import { OpenAICompatibleLLM } from "./openai-compatible.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
/** Strong default for review / suggest / edit. */
export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface GroqConfig {
  apiKey: string;
  model?: string;
}

/** The "strong" LLM — Groq, OpenAI-compatible. */
export class GroqLLM extends OpenAICompatibleLLM {
  constructor(cfg: GroqConfig) {
    super({
      apiKey: cfg.apiKey,
      baseURL: GROQ_BASE_URL,
      model: cfg.model ?? GROQ_DEFAULT_MODEL,
    });
  }
}
