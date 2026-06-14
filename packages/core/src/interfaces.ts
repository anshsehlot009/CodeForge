// @code-forge/core — provider-agnostic contracts.
//
// Every provider (LLM / Embedder / VectorStore) implements one of these interfaces.
// Application code depends on the interface only; concrete providers are wired in one
// place via `getProviders()` (see providers/factory.ts). See CLAUDE.md → "Architecture".

/* ── LLM ─────────────────────────────────────────────────────────────────────── */

export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface CompleteOptions {
  /** 0–2; lower is more deterministic. */
  temperature?: number;
  /** Max tokens to generate. */
  maxTokens?: number;
  /** Nucleus sampling. */
  topP?: number;
  /** Stop sequences. */
  stop?: string[];
  /** Abort an in-flight request. */
  signal?: AbortSignal;
}

export interface LLM {
  /** Identifier of the underlying model (e.g. "llama-3.3-70b-versatile"). */
  readonly model: string;
  /** Single-shot completion → the assistant's text. */
  complete(messages: Message[], opts?: CompleteOptions): Promise<string>;
  /** Optional streaming completion → text deltas as they arrive. */
  stream?(messages: Message[], opts?: CompleteOptions): AsyncIterable<string>;
}

/* ── Embedder ────────────────────────────────────────────────────────────────── */

export interface Embedder {
  /** Output vector size (e.g. 384 for bge-small, 768 for bge-base). */
  readonly dimensions: number;
  /** Embed a single string. */
  embed(text: string): Promise<number[]>;
  /** Embed many strings, preserving order. */
  embedBatch(texts: string[]): Promise<number[][]>;
}

/* ── VectorStore ─────────────────────────────────────────────────────────────── */

/** A chunk to index. `embedding` length must match the store's vector dimension. */
export interface EmbeddingRow {
  id: string;
  repo: string;
  path: string;
  content: string;
  embedding: number[];
  startLine?: number;
  endLine?: number;
}

/** A search hit. `score` is similarity (higher = closer). */
export interface SearchRow {
  id: string;
  repo: string;
  path: string;
  content: string;
  score: number;
  startLine?: number;
  endLine?: number;
}

export interface VectorStore {
  /** Insert or update rows (keyed by `id`). */
  upsert(rows: EmbeddingRow[]): Promise<void>;
  /** Top-`k` nearest chunks within `repo`, optionally filtered by path globs. */
  search(repo: string, vec: number[], k: number, pathGlobs?: string[]): Promise<SearchRow[]>;
}
