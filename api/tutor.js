// LearnFlow — proxy de IA (Vercel Serverless)
// Recebe { messages, max_tokens, temperature } e encaminha para provedores
// gratuitos, em cascata: OpenRouter → Nvidia NIM. As keys ficam só no
// servidor (env vars), nunca no front.
// Suporta streaming SSE (mesmo formato OpenAI que o front já consome).

// Provedores em ordem de preferência. Cada um tem sua base, sua env var
// e sua lista de modelos gratuitos (validada em 2026-09; IDs conferidos
// contra /v1/models de cada provedor).
const PROVIDERS = [
  {
    name: 'openrouter',
    base: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    altEnvKey: 'AI_API_KEY',
    useReasoningParam: true, // aceita reasoning:{effort:'none'} para não vazar o pensamento no content
    extraHeaders: () => ({
      'HTTP-Referer': 'https://learnflow-ia.vercel.app/',
      'X-Title': 'LearnFlow',
    }),
    models: [
      'nvidia/nemotron-3.5-lightning:free',       // 1M ctx, rápido
      'google/gemma-4-31b-it:free',               // raciocínio forte
      'nvidia/nemotron-3-super-120b-a12b:free',   // 262k ctx, agéntico
      'inclusionai/ling-3.0-flash-vl:free',       // multimodal (visão)
      'nvidia/nemotron-3-ultra-550b-a55b:free',   // 1M ctx, pesado (último recurso)
    ],
  },
  {
    name: 'nvidia',
    base: 'https://integrate.api.nvidia.com/v1',
    envKey: 'NVIDIA_API_KEY',
    extraHeaders: () => ({}),
    models: [
      'nvidia/nemotron-3.5-lightning-30b-a3b',    // o mais rápido do catálogo
      'deepseek-ai/deepseek-v4-flash-0731',       // 284B MoE, chat/coding
      'google/gemma-4-31b-it',
      'mistralai/mistral-nemotron',               // bom em instrução e tool call
    ],
  },
];

export default async function handler(req, res) {
  // CORS aberto: permite o site no GitHub Pages usar este backend como fallback
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { messages, max_tokens = 1500, temperature = 0.7, reasoning } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Envie { messages: [...] }.' });
  }

  const makeBody = (model, provider) => {
    const b = {
      model,
      messages,
      max_tokens: Math.min(Number(max_tokens) || 1500, 2000),
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      stream: true,
    };
    if (provider.useReasoningParam) {
      b.reasoning = reasoning && typeof reasoning === 'object' ? reasoning : { effort: 'none' };
    }
    return JSON.stringify(b);
  };

  const attempts = [];
  for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.envKey] || process.env[provider.altEnvKey || ''];
    if (!apiKey) {
      attempts.push({ provider: provider.name, skipped: 'env ausente' });
      continue; // provedor sem key configurada — pula
    }

    for (const model of provider.models) {
      try {
        const r = await fetch(`${provider.base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...provider.extraHeaders(),
          },
          body: makeBody(model, provider),
        });

        // Alguns provedores devolvem HTTP 200 com erro JSON no body (ex.: 429 do pool grátis)
        const ctype = (r.headers.get('content-type') || '').toLowerCase();
        if (ctype.includes('application/json')) {
          attempts.push({ provider: provider.name, model, note: 'erro no body (HTTP 200)' });
          continue;
        }

        if (!r.ok || !r.body) {
          attempts.push({ provider: provider.name, model, status: r.status });
          continue; // tenta o próximo modelo
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('X-LF-Provider', `${provider.name}/${model}`);

        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        return res.end();
      } catch (e) {
        // tenta o próximo modelo
      }
    }
  }

  return res.status(502).json({
    error: 'Nenhum modelo gratuito respondeu agora. Tente de novo em instantes.',
    attempts,
  });
}
