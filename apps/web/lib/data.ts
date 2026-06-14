// Server-side reads for the app screens. Each function is labelled LIVE (Supabase) or MOCK.
// Mocked screens read from ./mock until their backend tables are populated.
import { createDbClient, DEFAULT_NOISE_BUDGET, getNoiseBudget, type NoiseBudget } from "@code-forge/db";
import * as mock from "./mock";

/** The repo whose settings/metrics the demo surfaces. */
export const DEMO_REPO = "code-forge/demo";

/** LIVE (Supabase): the demo repo's noise budget; defaults if unset or the DB is unreachable. */
export async function readNoiseBudget(): Promise<NoiseBudget> {
  try {
    return await getNoiseBudget(createDbClient(), DEMO_REPO);
  } catch {
    // No SUPABASE_* env or table not migrated yet — fall back to the shared default.
    return { ...DEFAULT_NOISE_BUDGET };
  }
}

/** MOCK: prioritized "needs you" stream. */
export async function readStream(): Promise<mock.StreamItem[]> {
  return mock.MOCK_STREAM;
}

/** MOCK: pulse-rail metrics (accept rate, noise, cost). */
export async function readPulse(): Promise<mock.PulseData> {
  return mock.MOCK_PULSE;
}

/** MOCK: PR review queue. */
export async function readPrQueue(): Promise<mock.PrSummary[]> {
  return mock.MOCK_PRS;
}

/** MOCK: a single PR's review detail (diff + deduped comments; synthesized for silent rows). */
export async function readPrDetail(id: string): Promise<mock.PrDetail | null> {
  return mock.getMockPrDetail(id);
}

/** MOCK: a sample PR's candidate comments for the noise-budget live preview. */
export async function readSamplePr(): Promise<typeof mock.MOCK_SAMPLE_PR> {
  return mock.MOCK_SAMPLE_PR;
}

/** MOCK: billing state (no billing tables yet). */
export async function readBilling(): Promise<mock.BillingState> {
  return mock.MOCK_BILLING;
}
