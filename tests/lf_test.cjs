// ============================================================
// 🎓 Suíte CRA — LearnFlow (caderno didático)
// Testa as funções puras do app (i18n, markdown, validadores de
// saída da IA), o backend serverless por leitura e BLINDA o anti-vibe.
// ============================================================
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api', 'tutor.js'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
const htmlSemScript = html.replace(/<script[\s\S]*?<\/script>/g, '<script src="stub"></script>');

let pass = 0, fail = 0;
function ok(cond, nome) {
  if (cond) { pass++; console.log('  ✓ ' + nome); }
  else { fail++; console.log('  ✗ FALHOU: ' + nome); }
}

function carregar() {
  const dom = new JSDOM(htmlSemScript, { url: 'https://learnflow-ia.vercel.app/', runScripts: 'outside-only' });
  dom.window.eval(script + `
    ;globalThis.__LF = {
      t, escapeHtml, formatMarkdown, lfValidateOutput, aiUrlList, applyLang,
      get lang(){ return document.documentElement.lang; }, set lang(v){ document.documentElement.lang = v; }
    };`);
  return dom;
}

(async () => {
  console.log('— 🌍 i18n (8 idiomas) —');
  {
    const w = carregar().window, X = w.__LF;
    X.lang = 'pt-BR';
    ok(X.t('nao-existe') === 'nao-existe', 'chave inexistente volta a própria chave (sem crash)');
    const comVar = X.t('welcome-back', { name: 'Ana' });
    ok(comVar.includes('Ana'), 't() interpola {vars}');
    X.lang = 'en';
    ok(X.t('welcome-back', { name: 'Ana' }) !== X.t('nao-existe'), 'lang=en acha tradução');
    X.lang = 'zh';
    const zh = X.t('welcome-back', { name: 'X' });
    ok(zh && zh !== 'welcome-back', 'zh suportado');
  }

  console.log('— 📝 markdown e escape —');
  {
    const w = carregar().window, X = w.__LF;
    ok(X.escapeHtml('<b>&"\'') === '&lt;b&gt;&amp;&quot;&#39;', 'escapeHtml neutraliza tudo');
    const md = X.formatMarkdown('**negrito** e `codigo` e ```js\nbloco()\n```');
    ok(md.includes('<strong>negrito</strong>'), 'markdown: ** → strong');
    ok(md.includes('<code>codigo</code>'), 'markdown: `x` → code');
    ok(md.includes('<pre><code>bloco()</code></pre>'), 'markdown: cerco → pre+code');
    ok(X.formatMarkdown('a\nb').includes('a<br>b'), 'markdown: quebra de linha → <br>');
    const inj = X.formatMarkdown('<img src=x onerror=alert(1)>');
    ok(!inj.includes('<img'), 'markdown NÃO deixa HTML cru passar (escapa antes)');
  }

  console.log('— 🛡️ validadores de saída da IA —');
  {
    const w = carregar().window, X = w.__LF;
    ok(X.lfValidateOutput('Resposta normal, didática e completa.') === null, 'resposta sã passa limpa');
    ok(String(X.lfValidateOutput('Error: insufficient_quota, topping up the wallet')).includes('crédito'), 'erro de cota disfarçado é FLAGRADO');
    ok(X.lfValidateOutput("Here's a thinking process: first...") !== null, 'vazamento de raciocínio é FLAGRADO');
    ok(X.lfValidateOutput('relendo as instruções do prompt') !== null, 'meta-texto em pt-BR é FLAGRADO');
    ok(X.lfValidateOutput('aaaaaaa'.repeat(13)) !== null, 'saída degenerada (palavra colada 13×) é FLAGRADA');
  }

  console.log('— 🔗 cascata de endpoints —');
  {
    const w = carregar().window, X = w.__LF;
    const lista = X.aiUrlList();
    ok(Array.isArray(lista) && lista.length >= 2, 'aiUrlList devolve a cascata');
    ok(lista.some(u => u.includes('pollinations')), 'Pollinations presente na cascata');
    ok(!lista.some(u => /sk-|key=/i.test(u)), 'nenhuma key na URL');
  }

  console.log('— ☁️ backend serverless (api/tutor.js, por leitura) —');
  {
    ok(!/sk-or-v1-[A-Za-z0-9]|nvai-/.test(api), 'nenhuma key hardcoded no servidor');
    ok(/process\.env\[provider\.envKey\]/.test(api), 'keys lidas só de env vars (acesso dinâmico)');
    ok(/envKey: 'OPENROUTER_API_KEY'/.test(api) && /envKey: 'NVIDIA_API_KEY'/.test(api), 'nomes das env vars declarados nos provedores');
    ok(/LIMITE_DIA\s*=\s*60/.test(api), 'limite diário de 60 req/pessoa presente');
    ok(/maxDuration = 60/.test(api), 'teto serverless compatível com Hobby');
    ok(/HEADERS_TIMEOUT_MS = 12000/.test(api) && /CHUNK_STALL_MS = 20000/.test(api) && /GLOBAL_DEADLINE_MS = 55000/.test(api), 'watchdogs de timeout blindados');
    ok((api.match(/name: '(openrouter|nvidia)'/g) || []).length === 2, '2 provedores em cascata');
    ok(/X-LF-Proxy/.test(api), 'marcador de versão p/ validar deploy');
  }

  console.log('— 🎨 CRA: NADA DE CARA DE IA —');
  {
    ok(/fonts.googleapis.com\/css2\?family=Atkinson\+Hyperlegible/.test(html), 'corpo em Atkinson Hyperlegible (legibilidade/educação)');
    ok(/family=Fraunces/.test(html) && (html.match(/Fraunces/g) || []).length >= 3, 'títulos herói em Fraunces (caderno didático)');
    ok(!/font-family:\s*'Inter'/.test(html), 'zero Inter');
    ok(!/linear-gradient/.test(html), 'zero gradiente (título-gradiente e botões viraram sólidos)');
    ok(!/radial-gradient/.test(html), 'zero glows radiais de fundo');
    ok(!/background-clip:\s*text/.test(html), 'zero título-gradiente');
    ok(!/float 3s/.test(html) && !/@keyframes float/.test(html), 'capuz não flutua mais (decoração fora)');
    ok(/@keyframes typing/.test(html) && /fabPulse/.test(html), 'animações FUNCIONAIS preservadas (digitando…, microfone gravando)');
    ok(/prefers-reduced-motion/.test(html), 'prefers-reduced-motion presente (novo)');
    ok((html.match(/--accent:\s*#34d399|--accent:\s*#0e9f6e/).length || 0) >= 1, 'identidade esmeralda+ciano PRESERVADA (era legítima)');
    ok(fs.existsSync(path.join(root, 'LICENSE')), 'LICENSE MIT presente');
    ok(!/sk-or-v1-[A-Za-z0-9]{10,}/.test(html + api), 'zero segredo real em front+api');
  }

  console.log(`\n═══ RESULTADO: ${pass} ✓ · ${fail} ✗ ═══`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH:', e); process.exit(1); });
