import type { NoiseBudget } from "@code-forge/db";

export type Severity = "low" | "medium" | "high";

export const SEVERITY_WEIGHT: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

/** A finding the strong model returned, mapped to a retrieved convention (provenance). */
export interface Finding {
  path: string;
  line: number;
  message: string;
  /** Human label of the convention this violates (the rule text). */
  conventionLabel: string;
  /** Provenance — where the convention came from (our data, not the model's). */
  sourceUrl: string | null;
  severity: Severity;
  /** 0–1. */
  confidence: number;
  /** Internal: the convention row id, for the comment marker + signal feedback. */
  conventionId: string;
}

/** rank score = confidence · severity weight. */
export function findingScore(f: Finding): number {
  return f.confidence * SEVERITY_WEIGHT[f.severity];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Collapse duplicate findings, keeping the most confident. Two findings are duplicates when they
 * sit on the same path+line AND either cite the same convention or carry the same (normalized)
 * message. Different conventions with different messages on the same line both survive.
 */
export function dedupeFindings(findings: Finding[]): Finding[] {
  const kept: Finding[] = [];
  for (const f of findings) {
    const i = kept.findIndex(
      (k) =>
        k.path === f.path &&
        k.line === f.line &&
        (k.conventionId === f.conventionId || norm(k.message) === norm(f.message)),
    );
    if (i === -1) {
      kept.push(f);
      continue;
    }
    const existing = kept[i];
    if (existing && f.confidence > existing.confidence) kept[i] = f;
  }
  return kept;
}

/** Filter by minConfidence, dedupe, sort by confidence·severity, cap at maxComments. */
export function selectFindings(findings: Finding[], budget: NoiseBudget): Finding[] {
  return dedupeFindings(findings.filter((f) => f.confidence >= budget.minConfidence))
    .sort((a, b) => findingScore(b) - findingScore(a))
    .slice(0, budget.maxComments);
}
