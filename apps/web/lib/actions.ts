"use server";

import { createDbClient, type NoiseBudget } from "@code-forge/db";
import { DEMO_REPO } from "./data";

/** LIVE (Supabase): persist the demo repo's noise budget to the `noise_budgets` table. */
export async function saveNoiseBudget(budget: NoiseBudget): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = createDbClient();
    const { error } = await db.from("noise_budgets").upsert(
      {
        repo: DEMO_REPO,
        min_confidence: Math.min(1, Math.max(0, budget.minConfidence)),
        max_comments: Math.max(0, Math.trunc(budget.maxComments)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "repo" },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "save failed" };
  }
}

// MOCK: billing settings have no backend table yet. This is intentionally a no-op stub so the
// UI can be wired end-to-end; replace with a real persist when the billing schema exists.
export async function saveBillingSettings(_settings: {
  cap: number;
  stopAtCap: boolean;
}): Promise<{ ok: boolean }> {
  return { ok: true };
}
