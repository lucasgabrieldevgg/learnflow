[🇧🇷 Português](README.pt-BR.md)

# LearnFlow 🎓

[![ci](https://github.com/lucasgabrieldevgg/learnflow/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasgabrieldevgg/learnflow/actions/workflows/ci.yml)

**An AI tutor that actually teaches — it changes the representation when you don't get it, instead of repeating the same explanation.**

> 🔗 **Use it now:** [learnflow-ia.vercel.app](https://learnflow-ia.vercel.app)

## 💡 The method

Most educational AIs optimize for *"the user wants the answer → give the answer"*. LearnFlow optimizes for *"the user wants to learn → get them to the answer"*.

**Core principle:** if the student doesn't understand, CHANGE THE REPRESENTATION — never repeat the same explanation.

1. **Interest profile** — at onboarding, the tutor learns what YOU like to mess with (games, tech, shows, sports, cooking, art, animals, building and fixing, cars…) and uses those universes in every analogy
2. **Concrete bridge** — the concept appears first inside your universe, with a SIMPLE example of something you already know or use daily (phone, game, ball, snack, bus); formalism comes later
3. **Prerequisite ladder** — if you get stuck, it climbs down step by step to find the missing foundation, teaches it from zero and climbs back up
4. **Socratic method** — the answer never comes on the first try; guided hints until you get there yourself
5. **Paper and pen** — "grab something to write with": jot it down, solve on paper, then confirm
6. **Abstraction** — only at the end is the context removed, so you don't depend on the analogy

## ✨ Features

- 🪜 **4 help levels** — 💡 Hint → 🧩 Example → 👁️ Visualize → 🧑‍🏫 Teach me (buttons in the chat)
- 📝 **Exam mode** — turns off all help: one question at a time, strict grading and an error breakdown
- 🌍 **8 languages** — PT-BR, EN, ES, FR, DE, IT, JA, ZH
- 🌗 **Light/dark theme** — no flash on switch
- 💾 **Persistent session** — close it and come back: the conversation picks up where it left off
- 🧰 **Study tools** — summary, quiz, flashcards, analogy, Feynman and exercises (all aware of your profile)
- 📱 **Responsive** — works on mobile and desktop

## 🛠️ Architecture

- **Frontend:** a single `index.html` — zero build, zero dependencies, 100% in the browser
- **AI with automatic fallback:**
  1. [Pollinations AI](https://pollinations.ai) (anonymous and free)
  2. `/api/tutor` — Vercel serverless proxy with [OpenRouter](https://openrouter.ai) (free models, key stays server-side)
  3. Remote proxy — makes the fallback work even on GitHub Pages
- **Deploy:** Vercel — [learnflow-ia.vercel.app](https://learnflow-ia.vercel.app) (static + `api/tutor` serverless)

## 🚀 Running locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

> Pollinations' anonymous AI blocks the `localhost` origin — locally, use the Vercel proxy (already handled by the automatic fallback).

## 🎨 Identity — textbook notebook

Textbook typography: **Fraunces** (serif) for hero titles, **Atkinson Hyperlegible** — a font designed for *reading legibility*, the product's very purpose — for the body. Solid emerald+cyan ("education/growth" identity preserved), zero gradient, zero glow, zero floating decoration.

## 🧪 Tests

```
npm install && npm test
```
