import type { Embedder, LLM, VectorStore } from "../interfaces.js";
import { GroqLLM } from "./groq.js";
import { CerebrasLLM, GeminiLLM } from "./fast.js";
import { LocalEmbedder } from "./local-embedder.js";
import { SupabaseVectorStore } from "./supabase-vector-store.js";

/** The four providers the rest of the app depends on — only ever built here. */
export interface Providers {
  /** Strong model (Groq) — review / suggest / edit. */
  strong: LLM;
  /** Fast model (Cerebras or Gemini) — hover / triage. */
  fast: LLM;
  /** In-process embeddings (fastembed). */
  embedder: Embedder;
  /** pgvector store (Supabase). */
  vectorStore: VectorStore;
}

export type Env = Record<string, string | undefined>;

export type FastProvider = "cerebras" | "gemini";

function required(env: Env, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`getProviders: missing required env var ${key}`);
  return value;
}

/**
 * The ONE place concrete providers are constructed. Everything else imports interfaces
 * and receives them from here, so swapping a provider is a change to this file + env only.
 *
 * Reads provider / key / model from `env` (defaults to process.env):
 *   GROQ_API_KEY        GROQ_MODEL        (default llama-3.3-70b-versatile)
 *   FAST_PROVIDER       cerebras | gemini (default cerebras)
 *   CEREBRAS_API_KEY    CEREBRAS_MODEL
 *   GEMINI_API_KEY      GEMINI_MODEL
 *   EMBED_MODEL         bge-small | bge-base (default bge-small)   FASTEMBED_CACHE_DIR
 *   SUPABASE_URL        SUPABASE_SERVICE_ROLE_KEY | SUPABASE_ANON_KEY
 *   SUPABASE_EMBEDDINGS_TABLE   SUPABASE_MATCH_FN
 */
export function getProviders(env: Env = process.env): Providers {
  const strong = new GroqLLM({
    apiKey: required(env, "GROQ_API_KEY"),
    model: env.GROQ_MODEL,
  });

  const fast = buildFast(env);

  const embedModel = env.EMBED_MODEL ?? "bge-small";
  if (embedModel !== "bge-small" && embedModel !== "bge-base") {
    throw new Error(
      `getProviders: unknown EMBED_MODEL "${embedModel}" (expected "bge-small" or "bge-base")`,
    );
  }
  const embedder = new LocalEmbedder({ model: embedModel, cacheDir: env.FASTEMBED_CACHE_DIR });

  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    throw new Error(
      "getProviders: missing Supabase key (set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)",
    );
  }
  const vectorStore = new SupabaseVectorStore({
    url: required(env, "SUPABASE_URL"),
    key: supabaseKey,
    table: env.SUPABASE_EMBEDDINGS_TABLE,
    matchFn: env.SUPABASE_MATCH_FN,
  });

  return { strong, fast, embedder, vectorStore };
}

function buildFast(env: Env): LLM {
  const provider = (env.FAST_PROVIDER ?? "cerebras").toLowerCase();
  switch (provider) {
    case "cerebras":
      return new CerebrasLLM({ apiKey: required(env, "CEREBRAS_API_KEY"), model: env.CEREBRAS_MODEL });
    case "gemini":
      return new GeminiLLM({ apiKey: required(env, "GEMINI_API_KEY"), model: env.GEMINI_MODEL });
    default:
      throw new Error(`getProviders: unknown FAST_PROVIDER "${provider}" (expected "cerebras" or "gemini")`);
  }
}
