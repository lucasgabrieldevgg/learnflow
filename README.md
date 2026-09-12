# LearnFlow 🎓

**Uma tutora de IA que ensina de verdade — muda a representação quando você não entende, em vez de repetir a mesma explicação.**

> 🔗 **Use agora:** [learnflow-lukepalys-projects.vercel.app](https://learnflow-lukepalys-projects.vercel.app) · [GitHub Pages](https://lukepalys.github.io/learnflow/)

## 💡 O método

A maioria das IAs educacionais otimiza para *"o usuário quer a resposta → dê a resposta"*. O LearnFlow otimiza para *"o usuário quer aprender → faça ele chegar à resposta"*.

**Princípio central:** se o aluno não entendeu, mude a REPRESENTAÇÃO — nunca repita a mesma explicação.

1. **Perfil de interesses** — no onboarding, a tutora aprende com o que VOCÊ aprende melhor (jogos, tech, séries, esportes...) e usa esses universos em todas as analogias
2. **Ponte concreta** — o conceito aparece primeiro dentro do seu universo; o formalismo vem depois
3. **Escada de pré-requisitos** — se você travar, ela desce etapa por etapa até achar a base que falta, ensina do zero e sobe de volta
4. **Método socrático** — a resposta nunca vem de primeira; dicas guiadas até você chegar lá
5. **Papel e caneta** — "pega algo pra escrever": anote, resolva no papel, depois confirme
6. **Abstração** — só no fim o contexto é removido, para você não depender da analogia

## ✨ Funcionalidades

- 🪜 **4 níveis de ajuda** — 💡 Dica → 🧩 Exemplo → 👁️ Visualizar → 🧑‍🏫 Me ensine (botões no chat)
- 📝 **Modo Prova** — desliga todas as ajudas: uma questão por vez, correção rigorosa e balanço de erros
- 🌍 **8 idiomas** — PT-BR, EN, ES, FR, DE, IT, JA, ZH
- 🌗 **Tema claro/escuro** — sem flash na troca
- 💾 **Sessão persistente** — feche e volte: a conversa continua de onde parou
- 🧰 **Ferramentas de estudo** — resumo, quiz, flashcards, analogia, Feynman e exercícios (tudo ciente do seu perfil)
- 📱 **Responsiva** — funciona no celular e no desktop

## 🛠️ Arquitetura

- **Frontend:** um único `index.html` — zero build, zero dependências, 100% no navegador
- **IA com fallback automático:**
  1. [Pollinations AI](https://pollinations.ai) (anônima e gratuita)
  2. `/api/tutor` — proxy Vercel Serverless com [OpenRouter](https://openrouter.ai) (modelos gratuitos, key só no servidor)
  3. Proxy remoto — faz o fallback funcionar até no GitHub Pages
- **Deploy:** GitHub Pages (push em `main`) + Vercel

## 🚀 Rodando localmente

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

> A IA anônima da Pollinations bloqueia origin `localhost` — localmente use o proxy Vercel (já configurado no fallback automático).

## 🔒 Privacidade

Sem login, sem cadastro. Conversas e perfil ficam no `localStorage` do seu dispositivo. A key da OpenRouter vive apenas numa variável de ambiente da Vercel — nunca no front.
