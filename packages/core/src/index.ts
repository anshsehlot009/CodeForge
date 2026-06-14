// @code-forge/core — public API.
//
// Apps import interfaces + getProviders() from here, never a concrete provider module.
// See CLAUDE.md → "Architecture rules".

// Contracts
export type {
  LLM,
  Embedder,
  VectorStore,
  Role,
  Message,
  CompleteOptions,
  EmbeddingRow,
  SearchRow,
} from "./interfaces.js";

// The factory — the one supported way to obtain providers.
export { getProviders } from "./providers/factory.js";
export type { Providers, Env, FastProvider } from "./providers/factory.js";

// Concrete providers (escape hatch / tests; prefer getProviders()).
export { OpenAICompatibleLLM } from "./providers/openai-compatible.js";
export type { OpenAICompatibleConfig } from "./providers/openai-compatible.js";
export { GroqLLM, GROQ_DEFAULT_MODEL } from "./providers/groq.js";
export type { GroqConfig } from "./providers/groq.js";
export { CerebrasLLM, GeminiLLM, CEREBRAS_DEFAULT_MODEL, GEMINI_DEFAULT_MODEL } from "./providers/fast.js";
export type { FastConfig } from "./providers/fast.js";
export { LocalEmbedder } from "./providers/local-embedder.js";
export type { FastEmbedModel, LocalEmbedderConfig } from "./providers/local-embedder.js";
export { SupabaseVectorStore } from "./providers/supabase-vector-store.js";
export type { SupabaseVectorStoreConfig } from "./providers/supabase-vector-store.js";
