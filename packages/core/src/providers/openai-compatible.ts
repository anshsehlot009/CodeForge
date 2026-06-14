import OpenAI from "openai";
import type { CompleteOptions, LLM, Message } from "../interfaces.js";

export interface OpenAICompatibleConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * Base for any OpenAI-compatible chat API (Groq, Cerebras, Gemini's compat endpoint, …).
 * Concrete providers just supply { baseURL, model } and the env key.
 */
export class OpenAICompatibleLLM implements LLM {
  readonly model: string;
  protected readonly client: OpenAI;

  constructor(cfg: OpenAICompatibleConfig) {
    if (!cfg.apiKey) throw new Error(`${new.target.name}: missing API key`);
    this.model = cfg.model;
    this.client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseURL });
  }

  async complete(messages: Message[], opts: CompleteOptions = {}): Promise<string> {
    const res = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        top_p: opts.topP,
        stop: opts.stop,
      },
      { signal: opts.signal },
    );
    return res.choices[0]?.message?.content ?? "";
  }

  async *stream(messages: Message[], opts: CompleteOptions = {}): AsyncIterable<string> {
    const completion = await this.client.chat.completions.create(
      {
        model: this.model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        top_p: opts.topP,
        stop: opts.stop,
        stream: true,
      },
      { signal: opts.signal },
    );
    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
