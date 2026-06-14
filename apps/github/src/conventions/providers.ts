// Runtime wiring: build ingest/retrieve dependencies from env. Kept separate from
// ingest.ts / retrieve.ts (which take injected deps) so unit tests stay isolated.
import { CerebrasLLM, GeminiLLM, LocalEmbedder, type FastEmbedModel, type LLM } from "@code-forge/core";
import { createDbClient, matchConventions, pruneConventions, upsertConventions } from "@code-forge/db";
import { makeDistiller, type IngestDeps } from "./ingest.js";
import type { RetrieveDeps } from "./retrieve.js";

export type Env = Record<string, string | undefined>;

export function embedModelOf(env: Env): FastEmbedModel {
  return env.EMBED_MODEL === "bge-base" ? "bge-base" : "bge-small";
}

export function buildFastLLM(env: Env): LLM | null {
  const provider = (env.FAST_PROVIDER ?? "cerebras").toLowerCase();
  if (provider === "gemini") {
    return env.GEMINI_API_KEY
      ? new GeminiLLM({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL })
      : null;
  }
  return env.CEREBRAS_API_KEY
    ? new CerebrasLLM({ apiKey: env.CEREBRAS_API_KEY, model: env.CEREBRAS_MODEL })
    : null;
}

export function buildIngestDeps(env: Env = process.env): IngestDeps {
  const db = createDbClient(env);
  const embedder = new LocalEmbedder({ model: embedModelOf(env), cacheDir: env.FASTEMBED_CACHE_DIR });
  const fast = buildFastLLM(env);
  return {
    embedder,
    upsert: (rows) => upsertConventions(db, rows),
    prune: async (repo, keepIds) => {
      await pruneConventions(db, repo, keepIds);
    },
    distill: fast ? makeDistiller(fast) : undefined,
  };
}

export function buildRetrieveDeps(env: Env = process.env): RetrieveDeps {
  const db = createDbClient(env);
  const embedder = new LocalEmbedder({ model: embedModelOf(env), cacheDir: env.FASTEMBED_CACHE_DIR });
  return {
    embedder,
    match: (repo, embedding, count) => matchConventions(db, repo, embedding, count),
  };
}
