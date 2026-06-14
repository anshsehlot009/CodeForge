import type { SupabaseClient } from "@supabase/supabase-js";
import type { NoiseBudget } from "./types.js";

/** Sane defaults when a repo has no noise_budgets row. */
export const DEFAULT_NOISE_BUDGET: NoiseBudget = { minConfidence: 0.55, maxComments: 10 };

/** Read a repo's noise budget, falling back to defaults. */
export async function getNoiseBudget(db: SupabaseClient, repo: string): Promise<NoiseBudget> {
  const { data, error } = await db
    .from("noise_budgets")
    .select("min_confidence, max_comments")
    .eq("repo", repo)
    .maybeSingle();
  if (error) throw new Error(`getNoiseBudget: ${error.message}`);

  const row = data as { min_confidence: number; max_comments: number } | null;
  if (!row) return { ...DEFAULT_NOISE_BUDGET };
  // Clamp defensively in case a row predates the CHECK constraints.
  return {
    minConfidence: clamp(row.min_confidence ?? DEFAULT_NOISE_BUDGET.minConfidence, 0, 1),
    maxComments: Math.max(0, Math.trunc(row.max_comments ?? DEFAULT_NOISE_BUDGET.maxComments)),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
