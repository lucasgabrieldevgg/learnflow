// LearnFlow — proxy de IA (Vercel Serverless)
// Recebe { messages, max_tokens, temperature } e encaminha para a OpenRouter
// usando modelos gratuitos. A key fica só no servidor (env var), nunca no front.
// Suporta streaming SSE (mesmo formato OpenAI que o front já consome).

export default async function handler(req, res) {
  // CORS aberto: permite o site no GitHub Pages usar este backend como fallback
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { messages, max_tokens = 1500, temperature = 0.7 } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Envie { messages: [...] }.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'IA não configurada: OPENROUTER_API_KEY ausente no servidor.' });
  }

  // Modelos gratuitos da OpenRouter, em ordem de preferência
  const models = [
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'nvidia/nemotron-3.5-lightning:free',
    'inclusionai/ling-3.0-flash-vl:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-20b:free',
  ];

  for (const model of models) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://lukepalys.github.io/learnflow/',
          'X-Title': 'LearnFlow',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: Math.min(Number(max_tokens) || 1500, 2000),
          temperature: typeof temperature === 'number' ? temperature : 0.7,
          stream: true,
        }),
      });

      if (!r.ok || !r.body) continue; // tenta o próximo modelo

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');

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

  return res.status(502).json({ error: 'Nenhum modelo gratuito respondeu agora. Tente de novo em instantes.' });
}
