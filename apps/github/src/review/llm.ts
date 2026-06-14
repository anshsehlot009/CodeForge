import type { LLM } from "@code-forge/core";
import type { RankedConvention } from "../conventions/retrieve.js";
import type { ChangedFile } from "./files.js";
import { type Finding, type Severity } from "./types.js";

/** Conventions labeled C1..Cn for the model, plus a label→row map to resolve provenance. */
export interface ConventionContext {
  byLabel: Map<string, RankedConvention>;
  prompt: string;
}

export function buildConventionContext(conventions: RankedConvention[]): ConventionContext {
  const byLabel = new Map<string, RankedConvention>();
  const lines: string[] = [];
  conventions.forEach((c, i) => {
    const label = `C${i + 1}`;
    byLabel.set(label, c);
    lines.push(`${label} [${c.source}] ${c.body}`);
  });
  return { byLabel, prompt: lines.join("\n") };
}

function renderDiff(files: ChangedFile[], maxChars: number): string {
  let out = "";
  for (const f of files) {
    const block = `\n### ${f.path}\n${f.patch}\n`;
    out += out.length + block.length > maxChars ? `\n### ${f.path}\n(diff omitted — too large)\n` : block;
  }
  return out.trim();
}

const REVIEW_SYSTEM = [
  "You are a precise code reviewer. You are given a unified diff and a numbered list of the",
  "repo's CONVENTIONS (C1, C2, ...). Return ONLY findings where the diff violates one of the",
  "listed conventions — never general style opinions.",
  "",
  "Output ONLY a JSON array (no prose, no markdown fences). Each element:",
  '{ "path": string, "line": number (a changed line in the diff, on the new side),',
  '  "convention": "C<number>", "severity": "low"|"medium"|"high", "confidence": number 0..1,',
  '  "message": string (one sentence, actionable) }',
  "Return [] if nothing violates a convention.",
].join("\n");

/** Cheap gate: is this diff worth a detailed review against any convention? */
export async function cheapTriage(
  fast: LLM,
  files: ChangedFile[],
  ctx: ConventionContext,
): Promise<boolean> {
  const out = await fast.complete(
    [
      {
        role: "system",
        content:
          "Fast triage gate. Given a diff and the repo's conventions, reply with exactly YES if " +
          "any convention could plausibly be violated and is worth a detailed review, else NO.",
      },
      {
        role: "user",
        content: `Conventions:\n${ctx.prompt}\n\nFiles:\n${files
          .map((f) => f.path)
          .join("\n")}\n\nDiff (truncated):\n${renderDiff(files, 4000)}`,
      },
    ],
    { temperature: 0, maxTokens: 16 },
  );
  // Fail open: proceed to the strong pass unless the model clearly said NO.
  return !/\bno\b/i.test(out);
}

/** Strong pass: findings mapped to conventions. Hallucinated convention refs are dropped. */
export async function strongReview(
  strong: LLM,
  files: ChangedFile[],
  ctx: ConventionContext,
): Promise<Finding[]> {
  const out = await strong.complete(
    [
      { role: "system", content: REVIEW_SYSTEM },
      { role: "user", content: `Conventions:\n${ctx.prompt}\n\nDiff:\n${renderDiff(files, 12000)}` },
    ],
    { temperature: 0, maxTokens: 1200 },
  );
  return parseFindings(out, ctx.byLabel);
}

interface RawFinding {
  path?: unknown;
  line?: unknown;
  convention?: unknown;
  severity?: unknown;
  confidence?: unknown;
  message?: unknown;
}

/** Parse the model's JSON array into Findings, resolving each convention ref to our row. */
export function parseFindings(text: string, byLabel: Map<string, RankedConvention>): Finding[] {
  const parsed = extractJsonArray(text);
  if (!Array.isArray(parsed)) return [];

  const out: Finding[] = [];
  for (const item of parsed as RawFinding[]) {
    const ref = typeof item.convention === "string" ? item.convention.trim().toUpperCase() : "";
    const conv = byLabel.get(ref);
    if (!conv) continue; // unmapped/hallucinated convention → drop

    const path = typeof item.path === "string" ? item.path : "";
    const line = toLine(item.line);
    const message = typeof item.message === "string" ? item.message.trim() : "";
    if (!path || line === null || !message) continue;

    out.push({
      path,
      line,
      message,
      conventionLabel: truncate(conv.body, 120),
      sourceUrl: conv.sourceUrl,
      conventionId: conv.id,
      severity: toSeverity(item.severity),
      confidence: toConfidence(item.confidence),
    });
  }
  return out;
}

function extractJsonArray(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return [];
      }
    }
    return [];
  }
}

function toLine(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseInt(v, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

function toSeverity(v: unknown): Severity {
  return v === "high" || v === "medium" || v === "low" ? v : "medium";
}

function toConfidence(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : NaN;
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
