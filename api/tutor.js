// LearnFlow — proxy de IA (Vercel Serverless)
// Recebe { messages, max_tokens, temperature } e encaminha para provedores
// gratuitos, em cascata: OpenRouter → Nvidia NIM. As keys ficam só no
// servidor (env vars), nunca no front.
// Suporta streaming SSE (mesmo formato OpenAI que o front já consome).
//
// v3 — BLINDAGEM DE TIMEOUT: um provedor pendurado NUNCA mais trava a resposta.
//  - 12s para receber headers do provedor (fetch com AbortSignal)
//  - 20s de silêncio total entre chunks → aborta e tenta o próximo modelo
//  - 20s sem NENHUM conteúdo real (ex.: fila "OPENROUTER PROCESSING" manda
//    comentários SSE infinitos que não são resposta) → próximo modelo
//  - deadline global de 55s para a cascata inteira
//  - se já entregou conteúdo ao cliente, não troca de modelo; entrega o que deu

export const maxDuration = 60; // teto da função serverless (compatível com Hobby)

const HEADERS_TIMEOUT_MS = 12000; // tempo p/ o provedor devolver headers
const CHUNK_STALL_MS = 20000;     // silêncio total entre chunks que aborta o modelo
const FIRST_CONTENT_MS = 20000;   // tempo máx. até o primeiro chunk com conteúdo real
const GLOBAL_DEADLINE_MS = 55000; // teto total da cascata

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
    // nemotron PENSE EM VOZ ALTA se não suprimirmos: sem isso o raciocínio
    // inteiro ("Here's a thinking process:...") vaza no content em HTTP 200.
    // Validado 2026-09: reasoning:{effort:'none'} é aceito pela NIM e zera o
    // reasoning_content que vaza no content.
    useReasoningParam: true,
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
  res.setHeader('X-LF-Proxy', 'v3-timeouts'); // marcador de versão p/ validar deploy
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

  const deadline = Date.now() + GLOBAL_DEADLINE_MS;
  const attempts = [];

  outer: for (const provider of PROVIDERS) {
    const apiKey = process.env[provider.envKey] || process.env[provider.altEnvKey || ''];
    if (!apiKey) {
      attempts.push({ provider: provider.name, skipped: 'env ausente' });
      continue; // provedor sem key configurada — pula
    }

    for (const model of provider.models) {
      // Sem tempo útil restante? Encerra a cascata com 502 (o front cai pro
      // próximo endpoint, ex. Pollinations).
      if (Date.now() > deadline - (HEADERS_TIMEOUT_MS + CHUNK_STALL_MS)) {
        attempts.push({ provider: provider.name, model, note: 'deadline global' });
        break outer;
      }

      const ac = new AbortController();
      let streamStarted = false;
      let gotData = false; // já passou chunk com "data:" (conteúdo real — comentários de fila não contam)

      try {
        let r;
        const headersTimer = setTimeout(() => ac.abort('headers timeout'), HEADERS_TIMEOUT_MS);
        try {
          r = await fetch(`${provider.base}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              ...provider.extraHeaders(),
            },
            body: makeBody(model, provider),
            signal: ac.signal,
          });
        } finally {
          clearTimeout(headersTimer); // fetch respondeu (ou falhou) — não aborta mais por headers
        }

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
        try {
          // headers podem já ter sido enviados se um modelo anterior soltou comentários de fila
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('X-Accel-Buffering', 'no');
          res.setHeader('X-LF-Provider', `${provider.name}/${model}`);
        } catch (_) {}
        streamStarted = true;

        const reader = r.body.getReader();
        const decoder = new TextDecoder();

        // Watchdog de primeiro conteúdo: filas (ex.: ": OPENROUTER PROCESSING")
        // mandam comentários SSE infinitos que NÃO são resposta. Se em
        // FIRST_CONTENT_MS nada com "data:" chegar, aborta e tenta o próximo modelo.
        let firstDataTimer = setTimeout(() => ac.abort('sem conteúdo (fila)'), FIRST_CONTENT_MS);

        while (true) {
          // Watchdog de silêncio total (só depois do 1º conteúdo)
          const stallTimer = gotData ? setTimeout(() => ac.abort('stream parado'), CHUNK_STALL_MS) : null;
          let chunk;
          try {
            chunk = await reader.read();
          } finally {
            if (stallTimer) clearTimeout(stallTimer);
          }
          const { done, value } = chunk;
          if (done) break;
          const s = decoder.decode(value, { stream: true });
          if (!gotData && s.includes('data:')) {
            gotData = true;
            clearTimeout(firstDataTimer);
            firstDataTimer = null;
          }
          res.write(s);
        }
        return res.end();
      } catch (e) {
        const note = String((e && (e.message || e.reason)) || e || 'erro').slice(0, 60);
        if (!streamStarted) {
          // falhou antes de começar a responder — tenta o próximo modelo
          attempts.push({ provider: provider.name, model, note });
          continue;
        }
        if (!gotData) {
          // só comentários de fila (ou nada útil) chegou — o cliente ainda não
          // recebeu resposta, então dá pra tentar o próximo modelo
          attempts.push({ provider: provider.name, model, note: 'sem conteúdo: ' + note });
          continue;
        }
        // stream já entregou dados: NÃO troca de modelo (evitaria duas
        // respostas concatenadas) — encerra com o que deu
        try { res.end(); } catch (_) {}
        return;
      }
    }
  }

  return res.status(502).json({
    error: 'Nenhum modelo gratuito respondeu agora. Tente de novo em instantes.',
    attempts,
  });
}
