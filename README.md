# Code Forge

An AI-native coding workspace — dashboard + editor with an agent that reviews code,
opens commits as PRs, and reasons over a codebase with retrieval.

> 📌 **Working rules live in [CLAUDE.md](CLAUDE.md).** Read it first.

## Layout

```
apps/
  web/      Next.js (App Router) + Tailwind dashboard & editor   → Vercel
  github/   Probot / Octokit GitHub App (webhooks, reviews)      → Render
packages/
  core/     LLM / Embedder / VectorStore interfaces + impls, prompts, types
  db/       Supabase client + pgvector schema + queries
styles/
  tokens.css   design tokens — the single source of truth
```

## Quick start

```bash
pnpm install
cp .env.example .env.local   # then fill in secrets
pnpm dev                     # web app → http://localhost:3000
```

See [CLAUDE.md](CLAUDE.md) for the full command list, architecture rules, and definition of done.
