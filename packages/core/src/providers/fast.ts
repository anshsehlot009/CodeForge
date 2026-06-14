import { OpenAICompatibleLLM } from "./openai-compatible.js";

// Both "fast" providers are OpenAI-compatible, so they share the base.
// Selected at runtime via FAST_PROVIDER (see providers/factory.ts).

const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";
export const CEREBRAS_DEFAULT_MODEL = "llama-3.3-70b";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";

export interface FastConfig {
  apiKey: string;
  model?: string;
}

/** Fast LLM option A — Cerebras (ultra-low-latency inference), for hover / triage. */
export class CerebrasLLM extends OpenAICompatibleLLM {
  constructor(cfg: FastConfig) {
    super({
      apiKey: cfg.apiKey,
      baseURL: CEREBRAS_BASE_URL,
      model: cfg.model ?? CEREBRAS_DEFAULT_MODEL,
    });
  }
}

/** Fast LLM option B — Gemini Flash via Google's OpenAI-compatible endpoint. */
export class GeminiLLM extends OpenAICompatibleLLM {
  constructor(cfg: FastConfig) {
    super({
      apiKey: cfg.apiKey,
      baseURL: GEMINI_BASE_URL,
      model: cfg.model ?? GEMINI_DEFAULT_MODEL,
    });
  }
}
