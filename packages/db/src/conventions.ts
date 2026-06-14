import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConventionMatch, ConventionRow, ConventionSource } from "./types.js";

const TABLE = "conventions";
const MATCH_FN = "match_conventions";
const PRUNE_FN = "prune_conventions";

/** Insert or update conventions, keyed by `id` (deterministic content key → idempotent). */
export async function upsertConventions(db: SupabaseClient, rows: ConventionRow[]): Promise<void> {
  if (rows.length === 0) return;
  const payload = rows.map((r) => ({
    id: r.id,
    repo: r.repo,
    source: r.source,
    source_url: r.sourceUrl,
    path_glob: r.pathGlob,
    body: r.body,
    embedding: r.embedding,
    signal: r.signal ?? 0,
  }));
  const { error } = await db.from(TABLE).upsert(payload, { onConflict: "id" });
  if (error) throw new Error(`upsertConventions: ${error.message}`);
}

// Shape returned by the match_conventions RPC.
interface RawMatch {
  id: string;
  repo: string;
  source: ConventionSource;
  source_url: string | null;
  path_glob: string | null;
  body: string;
  signal: number;
  similarity: number;
}

/** Top-`matchCount` conventions for `repo` by cosine similarity (no path filtering yet). */
export async function matchConventions(
  db: SupabaseClient,
  repo: string,
  embedding: number[],
  matchCount = 50,
): Promise<ConventionMatch[]> {
  const { data, error } = await db.rpc(MATCH_FN, {
    p_repo: repo,
    p_query_embedding: embedding,
    p_match_count: matchCount,
  });
  if (error) throw new Error(`matchConventions: ${error.message}`);

  const raw = (data ?? []) as RawMatch[];
  return raw.map((d) => ({
    id: d.id,
    repo: d.repo,
    source: d.source,
    sourceUrl: d.source_url,
    pathGlob: d.path_glob,
    body: d.body,
    signal: d.signal,
    similarity: d.similarity,
  }));
}

/** Atomically adjust a convention's signal (e.g. +/- from review-comment reactions). */
export async function adjustConventionSignal(
  db: SupabaseClient,
  conventionId: string,
  delta: number,
): Promise<number> {
  const { data, error } = await db.rpc("bump_convention_signal", {
    p_id: conventionId,
    p_delta: delta,
  });
  if (error) throw new Error(`adjustConventionSignal: ${error.message}`);
  return typeof data === "number" ? data : 0;
}

/**
 * Idempotently fold a review comment's reactions into its convention's signal. `currentDelta`
 * is the absolute net reaction count now; the DB applies only the change since last time, so
 * calling this repeatedly (webhook + poller) never double-counts. Returns the signal change.
 */
export async function applyReactionSignal(
  db: SupabaseClient,
  commentId: number,
  conventionId: string,
  currentDelta: number,
  step: number,
): Promise<number> {
  const { data, error } = await db.rpc("apply_reaction_signal", {
    p_comment_id: commentId,
    p_convention_id: conventionId,
    p_current_delta: currentDelta,
    p_step: step,
  });
  if (error) throw new Error(`applyReactionSignal: ${error.message}`);
  return typeof data === "number" ? data : 0;
}

/** Delete a repo's conventions whose id is not in `keepIds` (prune rules removed since last ingest). */
export async function pruneConventions(
  db: SupabaseClient,
  repo: string,
  keepIds: string[],
): Promise<number> {
  const { data, error } = await db.rpc(PRUNE_FN, { p_repo: repo, p_keep_ids: keepIds });
  if (error) throw new Error(`pruneConventions: ${error.message}`);
  return typeof data === "number" ? data : 0;
}
