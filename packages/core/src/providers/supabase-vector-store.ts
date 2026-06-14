import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EmbeddingRow, SearchRow, VectorStore } from "../interfaces.js";

export interface SupabaseVectorStoreConfig {
  url: string;
  /** Service-role key (server-side) preferred; anon works for read-only. */
  key: string;
  /** Table holding the pgvector rows. */
  table?: string;
  /** Postgres function that does the ANN search (defined in packages/db). */
  matchFn?: string;
}

const DEFAULT_TABLE = "embeddings";
const DEFAULT_MATCH_FN = "match_embeddings";

// Shape returned by the `match_embeddings` RPC (defined in packages/db).
interface RawMatchRow {
  id: string;
  repo: string;
  path: string;
  content: string;
  score?: number;
  similarity?: number;
  start_line?: number | null;
  end_line?: number | null;
}

/**
 * VectorStore backed by Supabase + pgvector. `upsert` writes the chunk rows; `search`
 * delegates nearest-neighbour ranking to a SQL function (so the `<=>` operator and any
 * index live in the database, owned by packages/db).
 *
 * Schema contract (defined in packages/db):
 *   - table `embeddings(id pk, repo, path, content, embedding vector(N), start_line, end_line)`
 *     — `id` MUST be PRIMARY KEY / UNIQUE for upsert's onConflict:"id" to work, and the
 *     `embedding` dimension N MUST match the configured Embedder (384 bge-small / 768 bge-base).
 *   - function `match_embeddings(query_embedding, match_repo, match_count, path_globs)`
 *     returning rows { id, repo, path, content, score|similarity, start_line, end_line }.
 */
export class SupabaseVectorStore implements VectorStore {
  private readonly client: SupabaseClient;
  private readonly table: string;
  private readonly matchFn: string;

  constructor(cfg: SupabaseVectorStoreConfig) {
    if (!cfg.url || !cfg.key) {
      throw new Error("SupabaseVectorStore: missing url or key");
    }
    this.client = createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
    this.table = cfg.table ?? DEFAULT_TABLE;
    this.matchFn = cfg.matchFn ?? DEFAULT_MATCH_FN;
  }

  async upsert(rows: EmbeddingRow[]): Promise<void> {
    if (rows.length === 0) return;
    const payload = rows.map((r) => ({
      id: r.id,
      repo: r.repo,
      path: r.path,
      content: r.content,
      embedding: r.embedding,
      start_line: r.startLine ?? null,
      end_line: r.endLine ?? null,
    }));
    const { error } = await this.client.from(this.table).upsert(payload, { onConflict: "id" });
    if (error) throw new Error(`SupabaseVectorStore.upsert: ${error.message}`);
  }

  async search(repo: string, vec: number[], k: number, pathGlobs?: string[]): Promise<SearchRow[]> {
    const { data, error } = await this.client.rpc(this.matchFn, {
      query_embedding: vec,
      match_repo: repo,
      match_count: k,
      path_globs: pathGlobs ?? null,
    });
    if (error) throw new Error(`SupabaseVectorStore.search: ${error.message}`);

    const raw = (data ?? []) as RawMatchRow[];
    return raw.map((d) => ({
      id: d.id,
      repo: d.repo,
      path: d.path,
      content: d.content,
      score: d.score ?? d.similarity ?? 0,
      startLine: d.start_line ?? undefined,
      endLine: d.end_line ?? undefined,
    }));
  }
}
