import { describe, expect, it } from "vitest";
import { getProviders, type Env } from "./factory.js";
import { GroqLLM } from "./groq.js";
import { CerebrasLLM, GeminiLLM } from "./fast.js";
import { LocalEmbedder } from "./local-embedder.js";
import { SupabaseVectorStore } from "./supabase-vector-store.js";

const baseEnv: Env = {
  GROQ_API_KEY: "gk_test",
  CEREBRAS_API_KEY: "ck_test",
  GEMINI_API_KEY: "gm_test",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "sk_test",
};

describe("getProviders", () => {
  it("wires the default providers (Groq strong + Cerebras fast + fastembed + Supabase)", () => {
    const p = getProviders(baseEnv);
    expect(p.strong).toBeInstanceOf(GroqLLM);
    expect(p.fast).toBeInstanceOf(CerebrasLLM);
    expect(p.embedder).toBeInstanceOf(LocalEmbedder);
    expect(p.vectorStore).toBeInstanceOf(SupabaseVectorStore);
  });

  it("defaults the strong model to llama-3.3-70b-versatile and honors GROQ_MODEL", () => {
    expect(getProviders(baseEnv).strong.model).toBe("llama-3.3-70b-versatile");
    expect(getProviders({ ...baseEnv, GROQ_MODEL: "llama-3.1-8b-instant" }).strong.model).toBe(
      "llama-3.1-8b-instant",
    );
  });

  it("selects the fast provider via FAST_PROVIDER", () => {
    expect(getProviders({ ...baseEnv, FAST_PROVIDER: "cerebras" }).fast).toBeInstanceOf(CerebrasLLM);
    expect(getProviders({ ...baseEnv, FAST_PROVIDER: "gemini" }).fast).toBeInstanceOf(GeminiLLM);
    // case-insensitive
    expect(getProviders({ ...baseEnv, FAST_PROVIDER: "GEMINI" }).fast).toBeInstanceOf(GeminiLLM);
  });

  it("picks the embedder dimension from EMBED_MODEL", () => {
    expect((getProviders(baseEnv).embedder as LocalEmbedder).dimensions).toBe(384);
    expect(
      (getProviders({ ...baseEnv, EMBED_MODEL: "bge-base" }).embedder as LocalEmbedder).dimensions,
    ).toBe(768);
  });

  it("accepts the anon key when the service-role key is absent", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _omit, ...noService } = baseEnv;
    void _omit;
    expect(getProviders({ ...noService, SUPABASE_ANON_KEY: "anon_test" }).vectorStore).toBeInstanceOf(
      SupabaseVectorStore,
    );
  });

  it("throws a clear error when a required env var is missing", () => {
    const { GROQ_API_KEY: _omit, ...noGroq } = baseEnv;
    void _omit;
    expect(() => getProviders(noGroq)).toThrowError(/GROQ_API_KEY/);
  });

  it("rejects an unknown FAST_PROVIDER", () => {
    expect(() => getProviders({ ...baseEnv, FAST_PROVIDER: "openai" })).toThrowError(
      /unknown FAST_PROVIDER/,
    );
  });

  it("defaults and overrides the fast model for each provider", () => {
    expect(getProviders(baseEnv).fast.model).toBe("llama-3.3-70b");
    expect(getProviders({ ...baseEnv, CEREBRAS_MODEL: "llama3.1-8b" }).fast.model).toBe("llama3.1-8b");
    expect(getProviders({ ...baseEnv, FAST_PROVIDER: "gemini" }).fast.model).toBe("gemini-2.0-flash");
    expect(
      getProviders({ ...baseEnv, FAST_PROVIDER: "gemini", GEMINI_MODEL: "gemini-1.5-flash" }).fast.model,
    ).toBe("gemini-1.5-flash");
  });

  it("throws when the selected gemini fast provider's key is missing", () => {
    const { GEMINI_API_KEY: _omit, ...noGemini } = baseEnv;
    void _omit;
    expect(() => getProviders({ ...noGemini, FAST_PROVIDER: "gemini" })).toThrowError(
      /GEMINI_API_KEY/,
    );
  });

  it("throws when both Supabase keys are absent", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _omit, ...noKeys } = baseEnv;
    void _omit;
    expect(() => getProviders(noKeys)).toThrowError(/Supabase key/);
  });

  it("throws when SUPABASE_URL is missing", () => {
    const { SUPABASE_URL: _omit, ...noUrl } = baseEnv;
    void _omit;
    expect(() => getProviders(noUrl)).toThrowError(/SUPABASE_URL/);
  });

  it("rejects an unsupported EMBED_MODEL (e.g. the unavailable 'nomic') at the factory", () => {
    expect(() => getProviders({ ...baseEnv, EMBED_MODEL: "nomic" })).toThrowError(/EMBED_MODEL/);
  });
});
