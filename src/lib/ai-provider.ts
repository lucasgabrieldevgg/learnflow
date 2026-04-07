// AI Provider abstraction layer with automatic fallback
// Supports: puter.js, ChatAnywhere, OpenRouter (multiple models)

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'puter' | 'openrouter' | 'chatanywhere';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  priority: number; // lower = higher priority
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface ProviderStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'untested';
  lastError?: string;
  lastSuccess?: number;
  latencyMs?: number;
  totalCalls: number;
  failedCalls: number;
}

// Provider configurations - ordered by priority (fallback chain)
const PROVIDER_CONFIGS: AIProviderConfig[] = [
  {
    id: 'puter',
    name: 'Puter.js (Gratuito)',
    type: 'puter',
    priority: 0,
  },
  {
    id: 'chatanywhere-deepseek',
    name: 'DeepSeek V3',
    type: 'chatanywhere',
    model: 'deepseek-v3',
    apiKey: '[REDACTED]',
    baseUrl: 'https://api.chatanywhere.tech/v1',
    priority: 1,
  },
  {
    id: 'chatanywhere-gpt4o',
    name: 'GPT-4o Mini',
    type: 'chatanywhere',
    model: 'gpt-4o-mini-ca',
    apiKey: '[REDACTED]',
    baseUrl: 'https://api.chatanywhere.tech/v1',
    priority: 2,
  },
  {
    id: 'openrouter-arcee',
    name: 'Arcee Trinity',
    type: 'openrouter',
    model: 'arcee-ai/trinity-large-preview:free',
    apiKey: '[REDACTED]',
    priority: 3,
  },
  {
    id: 'openrouter-gpt120b',
    name: 'OpenAI GPT-OSS 120B',
    type: 'openrouter',
    model: 'openai/gpt-oss-120b:free',
    apiKey: '[REDACTED]',
    priority: 4,
  },
  {
    id: 'openrouter-minimax',
    name: 'MiniMax M2.5',
    type: 'openrouter',
    model: 'minimax/minimax-m2.5:free',
    apiKey: '[REDACTED]',
    priority: 5,
  },
  {
    id: 'openrouter-nvidia',
    name: 'NVIDIA Nemotron 120B',
    type: 'openrouter',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    apiKey: '[REDACTED]',
    priority: 6,
  },
];

// Track provider health status (persisted in memory during session)
const providerStatuses: Map<string, ProviderStatus> = new Map();

function initProviderStatus(config: AIProviderConfig): ProviderStatus {
  return {
    id: config.id,
    name: config.name,
    status: 'untested',
    totalCalls: 0,
    failedCalls: 0,
  };
}

function getProviderStatus(config: AIProviderConfig): ProviderStatus {
  if (!providerStatuses.has(config.id)) {
    providerStatuses.set(config.id, initProviderStatus(config));
  }
  return providerStatuses.get(config.id)!;
}

// Mark a provider as offline temporarily (won't retry for a cooldown period)
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown for failed providers
const offlineUntil: Map<string, number> = new Map();

function isProviderAvailable(config: AIProviderConfig): boolean {
  const until = offlineUntil.get(config.id);
  if (until && Date.now() < until) {
    return false; // Still in cooldown
  }
  return true;
}

function markProviderOffline(config: AIProviderConfig) {
  offlineUntil.set(config.id, Date.now() + COOLDOWN_MS);
  const status = getProviderStatus(config);
  status.status = 'offline';
  status.failedCalls++;
}

function markProviderOnline(config: AIProviderConfig, latencyMs: number) {
  offlineUntil.delete(config.id);
  const status = getProviderStatus(config);
  status.status = 'online';
  status.lastSuccess = Date.now();
  status.latencyMs = latencyMs;
  status.totalCalls++;
}

function markProviderError(config: AIProviderConfig, error: string) {
  const status = getProviderStatus(config);
  status.lastError = error.slice(0, 100);
  status.totalCalls++;
  status.failedCalls++;
}

// ---- API Call Functions ----

async function callPuter(messages: AIMessage[]): Promise<{ content: string; latencyMs: number }> {
  const puterReady = typeof window !== 'undefined' && (window as unknown as { puter?: { ai?: { chat: (msgs: AIMessage[]) => Promise<{ message?: { content?: string } } | string> } } }).puter?.ai?.chat;

  if (!puterReady) {
    throw new Error('Puter.js não está carregado');
  }

  const start = Date.now();
  const response = await (window as unknown as { puter: { ai: { chat: (msgs: AIMessage[]) => Promise<{ message?: { content?: string } } | string> } } }).puter.ai.chat(messages);
  const latencyMs = Date.now() - start;

  let content = '';
  if (typeof response === 'string') {
    content = response;
  } else if (response?.message?.content) {
    content = response.message.content;
  }

  if (!content.trim()) {
    throw new Error('Resposta vazia do Puter.js');
  }

  return { content, latencyMs };
}

async function callOpenRouter(config: AIProviderConfig, messages: AIMessage[]): Promise<{ content: string; latencyMs: number }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  const start = Date.now();
  const data = await response.json();
  const latencyMs = Date.now() - start;

  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('Resposta vazia');
  }

  return { content, latencyMs };
}

async function callChatAnywhere(config: AIProviderConfig, messages: AIMessage[]): Promise<{ content: string; latencyMs: number }> {
  const baseUrl = config.baseUrl || 'https://api.chatanywhere.tech/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || errorData?.error || `HTTP ${response.status}`;
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  const start = Date.now();
  const data = await response.json();
  const latencyMs = Date.now() - start;

  const content = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('Resposta vazia');
  }

  return { content, latencyMs };
}

async function callProvider(config: AIProviderConfig, messages: AIMessage[]): Promise<{ content: string; latencyMs: number }> {
  switch (config.type) {
    case 'puter':
      return callPuter(messages);
    case 'openrouter':
      return callOpenRouter(config, messages);
    case 'chatanywhere':
      return callChatAnywhere(config, messages);
    default:
      throw new Error(`Provider type desconhecido: ${config.type}`);
  }
}

// ---- Public API ----

export type AIProviderCallback = (event: {
  type: 'switching' | 'success' | 'all_failed';
  provider?: string;
  message?: string;
}) => void;

/**
 * Send messages to AI with automatic fallback across providers.
 * Tries each provider in priority order until one succeeds.
 */
export async function sendMessageWithFallback(
  messages: AIMessage[],
  onEvent?: AIProviderCallback
): Promise<AIResponse> {
  const sortedProviders = [...PROVIDER_CONFIGS].sort((a, b) => a.priority - b.priority);

  // Filter to available providers (not in cooldown)
  const availableProviders = sortedProviders.filter(p => isProviderAvailable(p));

  if (availableProviders.length === 0) {
    // All in cooldown - reset cooldowns and try again
    offlineUntil.clear();
    availableProviders.push(...sortedProviders);
  }

  const errors: string[] = [];

  for (let i = 0; i < availableProviders.length; i++) {
    const config = availableProviders[i];
    const status = getProviderStatus(config);

    // Skip puter if not in browser
    if (config.type === 'puter' && typeof window === 'undefined') {
      errors.push(`${config.name}: não está no browser`);
      continue;
    }

    // Notify we're trying this provider (but skip notification for the first one unless it's a retry)
    if (i > 0) {
      onEvent?.({
        type: 'switching',
        provider: config.name,
        message: `Tentando ${config.name}...`,
      });
    }

    try {
      const { content, latencyMs } = await callProvider(config, messages);

      if (!content.trim()) {
        throw new Error('Resposta vazia');
      }

      markProviderOnline(config, latencyMs);

      onEvent?.({
        type: 'success',
        provider: config.name,
        message: `Usando ${config.name}`,
      });

      return {
        content,
        provider: config.id,
        model: config.model || 'puter-default',
        latencyMs,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`${config.name}: ${errorMsg}`);
      markProviderError(config, errorMsg);

      // Mark as offline for cooldown if it's a connectivity/availability error
      if (
        errorMsg.includes('401') ||
        errorMsg.includes('403') ||
        errorMsg.includes('429') ||
        errorMsg.includes('503') ||
        errorMsg.includes('não está carregado') ||
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('NetworkError')
      ) {
        markProviderOffline(config);
      }

      console.warn(`[AI Provider] ${config.name} failed:`, errorMsg);

      // If this is not the last provider, try the next one
      if (i < availableProviders.length - 1) {
        continue;
      }
    }
  }

  // All providers failed
  onEvent?.({
    type: 'all_failed',
    message: 'Todas as APIs de IA estão indisponíveis',
  });

  throw new Error(
    `Todas as APIs falharam:\n${errors.map(e => `• ${e}`).join('\n')}\n\nTente novamente em alguns minutos.`
  );
}

/**
 * Get all provider statuses for display
 */
export function getAllProviderStatuses(): ProviderStatus[] {
  return PROVIDER_CONFIGS.map(config => getProviderStatus(config));
}

/**
 * Get the list of available provider configs
 */
export function getProviderConfigs(): AIProviderConfig[] {
  return [...PROVIDER_CONFIGS];
}

/**
 * Force reset all cooldowns (e.g., when user clicks "retry")
 */
export function resetAllCooldowns(): void {
  offlineUntil.clear();
  providerStatuses.clear();
}

/**
 * Quick check if puter.js is available
 */
export function isPuterAvailable(): boolean {
  return typeof window !== 'undefined' &&
    !!(window as unknown as { puter?: { ai?: { chat: unknown } } }).puter?.ai?.chat;
}
