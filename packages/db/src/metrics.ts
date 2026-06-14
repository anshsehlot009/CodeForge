import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewRow, SuggestionRow } from "./types.js";

/** Record a review and return its generated id. */
export async function recordReview(db: SupabaseClient, review: ReviewRow): Promise<string> {
  const { data, error } = await db
    .from("reviews")
    .insert({
      repo: review.repo,
      pr_number: review.prNumber,
      commit_sha: review.commitSha ?? null,
      model: review.model ?? null,
      conventions_used: review.conventionsUsed ?? 0,
      suggestions_count: review.suggestionsCount ?? 0,
      latency_ms: review.latencyMs ?? null,
      status: review.status ?? "completed",
    })
    .select("id")
    .single();
  if (error) throw new Error(`recordReview: ${error.message}`);
  return (data as { id: string }).id;
}

/** Record the suggestions made during a review. */
export async function recordSuggestions(db: SupabaseClient, rows: SuggestionRow[]): Promise<void> {
  if (rows.length === 0) return;
  const payload = rows.map((s) => ({
    review_id: s.reviewId,
    convention_id: s.conventionId ?? null,
    path: s.path,
    line: s.line ?? null,
    body: s.body,
    accepted: s.accepted ?? null,
  }));
  const { error } = await db.from("suggestions").insert(payload);
  if (error) throw new Error(`recordSuggestions: ${error.message}`);
}
