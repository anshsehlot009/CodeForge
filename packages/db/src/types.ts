// @code-forge/db — row types (camelCase here; snake_case at the SQL boundary).

export type ConventionSource = "pr_comment" | "contributing" | "styleguide";

/** A convention to index. `id` is a deterministic content key (so re-ingest upserts). */
export interface ConventionRow {
  id: string;
  repo: string;
  source: ConventionSource;
  sourceUrl: string | null;
  pathGlob: string | null;
  body: string;
  embedding: number[];
  signal?: number;
}

/** A convention returned by `match_conventions`, with cosine `similarity` (1 = identical). */
export interface ConventionMatch {
  id: string;
  repo: string;
  source: ConventionSource;
  sourceUrl: string | null;
  pathGlob: string | null;
  body: string;
  signal: number;
  similarity: number;
}

/** Per-repo limits that keep review noise down. */
export interface NoiseBudget {
  /** Drop findings below this confidence (0–1). */
  minConfidence: number;
  /** Cap the number of comments posted in one review. */
  maxComments: number;
}

export type ReviewStatus = "completed" | "failed" | "skipped";

export interface ReviewRow {
  repo: string;
  prNumber: number;
  commitSha?: string | null;
  model?: string | null;
  conventionsUsed?: number;
  suggestionsCount?: number;
  latencyMs?: number | null;
  status?: ReviewStatus;
}

export interface SuggestionRow {
  reviewId: string;
  conventionId?: string | null;
  path: string;
  line?: number | null;
  body: string;
  accepted?: boolean | null;
}
