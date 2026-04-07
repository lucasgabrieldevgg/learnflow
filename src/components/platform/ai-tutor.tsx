'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  BookOpen,
  CalendarDays,
  Lightbulb,
  Wrench,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  MonitorOff,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
} from 'lucide-react';
import { AI_SYSTEM_PROMPT } from '@/lib/ai-system-prompt';
import {
  sendMessageWithFallback,
  getAllProviderStatuses,
  resetAllCooldowns,
  isPuterAvailable,
  type AIResponse,
  type ProviderStatus,
  type AIMessage,
} from '@/lib/ai-provider';
import {
  getChatHistory,
  setChatHistory,
  addChatMessage,
  clearChatHistory,
  addXP,
  getProgress,
  getUserProfile,
  generateId,
  type ChatMessage,
} from '@/lib/storage';

const quickActions = [
  { label: '📖 Me ensine do zero', prompt: 'Me ensine do zero sobre um assunto. O que você quer aprender?' },
  { label: '📋 Crie um plano de estudo', prompt: 'Ajude-me a criar um plano de estudo personalizado. Qual assunto você quer estudar e quanto tempo tem por dia?' },
  { label: '💡 Como aprender algo?', prompt: 'Como posso aprender de forma mais eficaz? Me conte sobre técnicas de aprendizagem comprovadas.' },
  { label: '🔧 Recomende ferramentas', prompt: 'Quais ferramentas de estudo da plataforma LearnFlow você recomenda para mim agora? Explique como usar cada uma.' },
];

const offlineTips = [
  '📖 **Técnica Feynman**: Tente explicar o conceito que quer aprender como se fosse para uma criança. Se não conseguir simplificar, ainda não entendeu o suficiente.',
  '🍅 **Pomodoro Timer**: Use sessões de 25 minutos de foco total seguidas de 5 minutos de descanso. Isso mantém seu cérebro descansado e produtivo.',
  '🃏 **Flashcards**: Crie cartões com perguntas de um lado e respostas do outro. Revise usando repetição espaçada — revise mais o que errar.',
  '📝 **Notas Cornell**: Divida sua página em 3 seções: notas à direita, palavras-chave à esquerda e resumo na parte de baixo.',
  '🧠 **Recall Ativo**: Em vez de reler, feche o livro e tente lembrar o que acabou de estudar. Isso fortalece as conexões neurais.',
  '🫁 **Respiração**: Antes de estudar, faça 5 respirações profundas. O oxigênio extra melhora a concentração e reduz a ansiedade.',
  '⏰ **Estudo Distribuído**: Estudar 30 min por dia é muito melhor que 5 horas num único dia. A consistência vence a intensidade.',
  '🎯 **Ensine Alguém**: Quando você ensina, é obrigado a organizar seus pensamentos — isso revela lacunas no seu entendimento.',
  '🎵 **Sons para Foco**: Música ambiente ou ruído branco pode ajudar a bloquear distrações e manter a concentração.',
  '✅ **Hábitos Diários**: Crie o hábito de estudar sempre no mesmo horário. Em ~21 dias, vira automático!',
];

function TypingIndicator({ switchingText }: { switchingText?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 px-4 md:px-0"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted/80 px-4 py-3">
        {switchingText ? (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <ArrowRightLeft className="h-3 w-3 animate-pulse" />
            {switchingText}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-violet-400 typing-dot" />
            <div className="h-2 w-2 rounded-full bg-violet-400 typing-dot" />
            <div className="h-2 w-2 rounded-full bg-violet-400 typing-dot" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      processed = processed.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
      if (processed.startsWith('### ')) {
        return <h4 key={i} className="font-semibold text-sm mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(4) }} />;
      }
      if (processed.startsWith('## ')) {
        return <h3 key={i} className="font-semibold text-base mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />;
      }
      if (processed.startsWith('# ')) {
        return <h2 key={i} className="font-bold text-lg mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      }
      if (processed.startsWith('- ') || processed.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-muted-foreground">•</span>
            <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
          </div>
        );
      }
      const numberedMatch = processed.match(/^(\d+)\.\s(.*)/);
      if (numberedMatch) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-muted-foreground font-medium">{numberedMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />
          </div>
        );
      }
      if (processed.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 message-animate ${isUser ? 'flex-row-reverse' : ''} px-4 md:px-0`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
            : 'bg-gradient-to-br from-violet-500 to-purple-600'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-gradient-to-br from-violet-600 to-purple-600 text-white'
            : 'rounded-tl-sm bg-muted/80'
        }`}
      >
        {renderContent(message.content)}
        {message.provider && !isUser && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground/60">via {message.provider}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AITutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [switchingText, setSwitchingText] = useState<string>('');
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [showProviders, setShowProviders] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getDynamicPrompt = useCallback(() => {
    try {
      const userProfile = getUserProfile();
      const progress = getProgress();
      return `${AI_SYSTEM_PROMPT}\n\n## SOBRE O USUÁRIO ATUAL\n- Nome: ${userProfile.name || 'Não informado'}\n- Nível detectado: ${userProfile.level}\n- Objetivo: ${userProfile.goal}\n- Tópicos já aprendidos: ${userProfile.learnedTopics.map(t => t.topic).join(', ') || 'Nenhum ainda'}\n- Total de XP: ${progress.xp}\n\nAdapte seu ensino ao nível do usuário. Se o nível é "iniciante", seja EXTREMAMENTE simples e paciente. Se é "intermediário", pode ser mais direto.`;
    } catch {
      return AI_SYSTEM_PROMPT;
    }
  }, []);

  // Check AI status on mount and periodically
  useEffect(() => {
    const updateStatus = () => {
      setProviderStatuses(getAllProviderStatuses());
      const puterOk = isPuterAvailable();
      if (puterOk && !activeProvider) {
        setActiveProvider('Puter.js');
      }
    };
    updateStatus();
    const interval = setInterval(updateStatus, 10000);
    return () => clearInterval(interval);
  }, [activeProvider]);

  // Load chat history on mount
  useEffect(() => {
    const history = getChatHistory();
    const userProfile = getUserProfile();
    const userName = userProfile.name || 'Aprendiz';

    if (history.length > 0) {
      setMessages(history);
    } else {
      const goalText = userProfile.goal ? ` sobre **${userProfile.goal}**` : '';
      const levelText = userProfile.level ? ` (Nível: **${userProfile.level}**)` : '';
      const welcome: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Olá, ${userName}! 👋 Sou o **Tutor IA** do LearnFlow e estou aqui para te ajudar a aprender${goalText}${levelText}.

Eu uso técnicas cientificamente comprovadas para te ensinar do jeito mais eficaz possível. Aqui estão algumas coisas que posso fazer:

📖 **Te ensinar qualquer assunto** do absoluto zero
📋 **Criar planos de estudo** personalizados
🧠 **Usar a Técnica Feynman** para explicar conceitos
🍅 **Recomendar o Pomodoro Timer** para sessões focadas
🃏 **Criar flashcards** com repetição espaçada

O que você quer aprender hoje? 😄`,
        timestamp: Date.now(),
      };
      setMessages([welcome]);
      setChatHistory([welcome]);
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsOfflineMode(false);
    addChatMessage(userMessage);
    addXP(10);

    try {
      const systemPrompt = getDynamicPrompt();
      const apiMessages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        // Include last 20 messages for context - this ensures continuity when switching models
        ...newMessages.slice(-20).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      const response: AIResponse = await sendMessageWithFallback(apiMessages, (event) => {
        if (event.type === 'switching') {
          setSwitchingText(event.message || 'Tentando outro modelo...');
        } else if (event.type === 'success') {
          setSwitchingText('');
          setActiveProvider(event.provider || '');
        } else if (event.type === 'all_failed') {
          setSwitchingText('');
        }
      });

      const providerName = response.provider;
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        provider: providerName,
      };

      const allMessages = [...newMessages, assistantMessage];
      setMessages(allMessages);
      setChatHistory(allMessages);
      addChatMessage(assistantMessage);
      addXP(20);
      setProviderStatuses(getAllProviderStatuses());
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setProviderStatuses(getAllProviderStatuses());

      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `⚠️ Todas as APIs de IA estão temporariamente indisponíveis.

**Detalhes:** ${errorMsg}

🔧 **Enquanto isso:**
• Use o **Modo Offline** para dicas de estudo
• Tente novamente em alguns minutos
• Suas mensagens foram salvas localmente

💡 O sistema tem **7 APIs de reserva** que entram automaticamente quando uma falha.`,
        timestamp: Date.now(),
      };

      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
      setChatHistory(errorMessages);
    } finally {
      setIsLoading(false);
      setSwitchingText('');
    }
  }, [messages, isLoading, getDynamicPrompt]);

  const handleOfflineMode = () => {
    setIsOfflineMode(true);
    const randomTip = offlineTips[Math.floor(Math.random() * offlineTips.length)];
    const tipMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `🔧 **Modo Offline Ativado**\n\nEnquanto a IA não está disponível, aqui vai uma dica valiosa:\n\n${randomTip}\n\n💡 Clique em "Tentar Novamente" para reconectar com a IA.`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, tipMessage]);
    addChatMessage(tipMessage);
  };

  const handleRetry = () => {
    setIsOfflineMode(false);
    resetAllCooldowns();
    setProviderStatuses(getAllProviderStatuses());
    setActiveProvider('');

    const retryMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '🔄 Resetando conexões... Tentando todas as APIs novamente!\n\nEnvie uma mensagem para testar. O sistema tentará Puter.js primeiro, depois as APIs de reserva automaticamente.',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, retryMessage]);
    addChatMessage(retryMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = () => {
    clearChatHistory();
    const welcome: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: 'Chat limpo! 🧹 Estou pronto para começar de novo. O que você quer aprender agora? 😄',
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    setChatHistory([welcome]);
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  const onlineCount = providerStatuses.filter(p => p.status === 'online').length;
  const offlineCount = providerStatuses.filter(p => p.status === 'offline').length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Tutor IA</h2>
            <div className="flex items-center gap-2">
              <p className={`text-[10px] flex items-center gap-1 ${
                activeProvider ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {activeProvider ? (
                  <>
                    <Zap className="h-3 w-3" />
                    {activeProvider}
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wifi className="h-3 w-3" />
                    {onlineCount > 0 ? `${onlineCount} APIs prontas` : 'Verificando...'}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Provider status toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-violet-400"
            onClick={() => setShowProviders(!showProviders)}
          >
            <Wifi className="h-3.5 w-3.5 mr-1" />
            APIs
            {onlineCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 min-w-[16px] px-1 text-[9px] bg-emerald-500/20 text-emerald-400">
                {onlineCount}
              </Badge>
            )}
          </Button>
          {(isLoading || offlineCount > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-violet-400"
              onClick={handleRetry}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span className="text-xs">Limpar</span>
          </Button>
        </div>
      </div>

      {/* Provider Status Panel */}
      <AnimatePresence>
        {showProviders && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border/30 bg-card/30"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  APIs Disponíveis (fallback automático)
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Ordem: Puter.js → ChatAnywhere → OpenRouter
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {getAllProviderStatuses().map((status) => (
                  <div
                    key={status.id}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                      status.status === 'online'
                        ? 'bg-emerald-500/5 border border-emerald-500/20'
                        : status.status === 'offline'
                        ? 'bg-red-500/5 border border-red-500/20 opacity-60'
                        : 'bg-muted/30 border border-border/30'
                    }`}
                  >
                    {status.status === 'online' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    ) : status.status === 'offline' ? (
                      <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`truncate ${
                      status.status === 'online' ? 'text-emerald-300' : 'text-muted-foreground'
                    }`}>
                      {status.name}
                    </span>
                    {status.latencyMs && (
                      <span className="ml-auto text-[9px] text-muted-foreground/60 shrink-0">
                        {status.latencyMs}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/60">
                Se uma API falhar, o sistema automaticamente tenta a próxima na lista.
                Cada API entra em cooldown de 5 min após falha. Clique &quot;Retry&quot; para resetar.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 px-0 py-4" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <AnimatePresence>
            {isLoading && <TypingIndicator switchingText={switchingText} />}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length <= 2 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t border-border/30 px-4 py-3 bg-card/30"
        >
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Ações rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="text-xs h-8 border-border/50 hover:border-violet-500/50 hover:bg-violet-500/10"
                onClick={() => handleQuickAction(action.prompt)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-background/80 p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent px-2 py-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md disabled:opacity-50"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              {activeProvider
                ? `Usando ${activeProvider} — 7 APIs de reserva disponíveis`
                : 'Fallback automático: Puter.js → ChatAnywhere → OpenRouter'
              }
            </p>
            <div className={`flex items-center gap-1 text-[10px] ${
              activeProvider ? 'text-emerald-400' : 'text-muted-foreground'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                activeProvider ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`} />
              {activeProvider ? 'Online' : 'Conectando...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
