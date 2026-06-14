// @code-forge/db — Supabase client + pgvector queries.
// Schema lives in supabase/migrations/. See CLAUDE.md → "Project structure".

export { createDbClient } from "./client.js";
export type { DbEnv } from "./client.js";
export {
  upsertConventions,
  matchConventions,
  pruneConventions,
  adjustConventionSignal,
  applyReactionSignal,
} from "./conventions.js";
export { recordReview, recordSuggestions } from "./metrics.js";
export { getNoiseBudget, DEFAULT_NOISE_BUDGET } from "./budgets.js";
export type {
  ConventionSource,
  ConventionRow,
  ConventionMatch,
  NoiseBudget,
  ReviewStatus,
  ReviewRow,
  SuggestionRow,
} from "./types.js";
