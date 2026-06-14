# Code Forge

An **AI-native coding workspace** — a dashboard + editor where an AI agent reviews code,
opens commits as PRs, and reasons over a codebase using retrieval. This file is the source
of truth for how we work in this repo. **These are pinned project rules. Follow them.**

---

## Project structure (pnpm monorepo)

This is a **pnpm workspace** monorepo. Four packages, each with one job:

| Path            | What it is                                                                              | Deploys to |
| --------------- | --------------------------------------------------------------------------------------- | ---------- |
| `apps/web`      | Next.js (App Router) + TypeScript + Tailwind. The dashboard & editor UI.                | **Vercel** |
| `apps/github`   | Probot / Octokit GitHub App. Webhooks, code reviews, commit-as-PR.                      | **Render** |
| `packages/core` | Shared library: LLM / Embedder / VectorStore **interfaces** + provider impls, prompts, types. | —    |
| `packages/db`   | Supabase client + pgvector schema + queries.                                            | —          |

Workspace packages are named `@code-forge/web`, `@code-forge/github`, `@code-forge/core`, `@code-forge/db`
and reference each other with `workspace:*`. Apps depend on packages; packages do **not**
depend on apps. Keep the dependency graph acyclic.

---

## Commands

Run everything with **pnpm** from the repo root.

```bash
pnpm install                         # install all workspaces

pnpm dev                             # run the web app (alias for dev:web)
pnpm dev:web                         # apps/web   → http://localhost:3000  (Next.js)
pnpm dev:github                      # apps/github → Probot server (needs GitHub App env, see .env.example)

pnpm typecheck                       # tsc --noEmit across every package
pnpm lint                            # eslint across the repo
pnpm test                            # vitest (passes with no tests; add tests next to the code)
pnpm build                           # build every package that has a build step

# Target one package:
pnpm --filter @code-forge/web typecheck
pnpm --filter @code-forge/github dev
```

**After completing any step of a task, tell me the exact command to run it locally.**
Don't make me guess. (e.g. "Run `pnpm --filter @code-forge/web dev` and open http://localhost:3000".)

---

## Architecture rules

### Providers sit behind interfaces — always

`packages/core` defines three interfaces. **Every provider MUST sit behind one of them.**
Application code depends on the interface, never on a concrete SDK.

- **`LLM`** — chat / completion.
- **`Embedder`** — text → vector.
- **`VectorStore`** — upsert / similarity search.

Default implementations (swap by changing the impl behind the interface, not the call sites):

| Interface     | Default impl                                            |
| ------------- | ------------------------------------------------------- |
| `LLM`         | **Groq** (the "strong" model)                           |
| `LLM` (fast)  | **Cerebras** or **Gemini** (the "fast" model)           |
| `Embedder`    | **local fastembed** (no API key, runs on-box)           |
| `VectorStore` | **Supabase** (pgvector) — also the system of record for data |

If you add a provider, add it as a new impl of the existing interface and wire it through
config. Do not import a provider SDK directly from `apps/*` or from prompt/orchestration code.

---

## Design system

**Design tokens are the single source of truth.** They live in [`styles/tokens.css`](styles/tokens.css).

- Default theme is **dark — "Midnight"**. The light theme is **"Daybreak"** (toggled via
  `data-theme="light"` on the root element).
- Accent is the **aurora gradient**: `#7C5CFF → #4D7CFF → #34E5C8`.
- **Never hardcode a hex value in a component.** Use the semantic token / Tailwind utility.

Tailwind is wired to consume the tokens: `tailwind.config.ts` maps every CSS variable in
`styles/tokens.css` to a semantic utility, so components write classes and never touch hex:

- **Surfaces** — `bg-sunken` `bg-bg` `bg-surface` `bg-elevated` (`--bg-*`)
- **Text** — `text-fg` `text-muted` `text-faint` (`--text-hi|mid|lo`)
- **Borders** — `border-subtle` `border-strong` (`--border-*`)
- **Accents** — `accent-violet|blue|cyan` + `bg-aurora` gradient (`--accent-*`)
- **Signals** — `human` (amber) · `success` · `warning` · `danger`
- **Radius** — `rounded-{xs,sm,md,lg,xl,full}` (`--radius-*`) · **Spacing** — 4px base (`--space-*`)
- **Type** — `text-{xs…7xl}` with line-heights (`--fs-*` / `--lh-*`)
- **Elevation** — `shadow-ambient` `shadow-elevated` `shadow-glow-ai` (`--shadow-*`)
- **Component utilities** (in `app/globals.css`) — `.glass` `.aurora-text` `.glow-ai` `.bg-noise`

Tokens are scoped per theme in `styles/tokens.css` (`:root, [data-theme="dark"]` for Midnight;
`[data-theme="light"]` for Daybreak). **Eyeball everything at `/dev/styleguide`** (`pnpm dev:web`),
which renders every token + utility and has a live dark/light toggle.

---

## Definition of done

A task is **not done** until all of these hold:

1. **Typechecks** — `pnpm typecheck` is clean.
2. **Lints** — `pnpm lint` is clean.
3. **Has a basic test** where the logic is non-trivial (use vitest, next to the code).
   Pure scaffolding / trivial glue does not need a test.
4. **I can run it locally** — and you've told me the **exact command** to do so.

---

## Secrets

- All secrets live in **`.env.local`** (git-ignored). **Never commit secrets.**
- The committed [`.env.example`](.env.example) lists every variable with empty values — keep it
  in sync whenever you add a new env var.
- `SUPABASE_SERVICE_ROLE_KEY` and the GitHub App `PRIVATE_KEY` are **server-only** — never ship
  them to the browser. Only `NEXT_PUBLIC_*` vars are safe client-side.

---

## Conventions

- **TypeScript everywhere**, `strict` on (see `tsconfig.base.json`). No `any` in committed code.
- Prefer small, typed modules. Shared types belong in `packages/core`.
- Don't reach across package boundaries except through a package's public entry (`src/index.ts`).
- **Package imports:** shared packages (`@code-forge/*`) ship TS source and are consumed as
  source in dev — `apps/web` via `transpilePackages` + a tsconfig path alias. Relative imports
  inside a package use **explicit `.js` extensions** so the source also resolves under
  `NodeNext` (e.g. `apps/github`). For a Node **runtime** consumer, build the package first
  (`pnpm --filter @code-forge/core build` → `dist/`); the web bundler doesn't need that.
