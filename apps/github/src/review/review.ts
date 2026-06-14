import type { Octokit } from "octokit";
import type { LLM } from "@code-forge/core";
import type { NoiseBudget } from "@code-forge/db";
import type { Hunk, RankedConvention } from "../conventions/retrieve.js";
import { addressableLines, fetchReviewableFiles, type ChangedFile } from "./files.js";
import { buildConventionContext, cheapTriage, strongReview } from "./llm.js";
import { selectFindings, type Finding } from "./types.js";

export interface ReviewTarget {
  owner: string;
  repo: string;
  prNumber: number;
  headSha?: string;
}

export interface ReviewDeps {
  octokit: Octokit;
  strong: LLM;
  fast: LLM;
  retrieve: (repo: string, hunks: Hunk[]) => Promise<RankedConvention[]>;
  getNoiseBudget: (repo: string) => Promise<NoiseBudget>;
  /** Optional: persist review + suggestion metrics. */
  recordMetrics?: (target: ReviewTarget, findings: Finding[], conventionsUsed: number) => Promise<void>;
}

export interface ReviewOutcome {
  posted: boolean;
  reason: string;
  comments: number;
}

const out = (posted: boolean, reason: string, comments = 0): ReviewOutcome => ({ posted, reason, comments });

/**
 * Review a PR: changed files → retrieve conventions → triage → strong review → dedupe/rank/cap
 * by the repo's noise budget → post ONE review, each comment citing its convention's source_url.
 */
export async function reviewPullRequest(deps: ReviewDeps, target: ReviewTarget): Promise<ReviewOutcome> {
  const repoSlug = `${target.owner}/${target.repo}`;

  const files = await fetchReviewableFiles(deps.octokit, target.owner, target.repo, target.prNumber);
  if (files.length === 0) return out(false, "no reviewable files");

  const hunks: Hunk[] = files.map((f) => ({ path: f.path, content: f.patch }));
  const conventions = await deps.retrieve(repoSlug, hunks);
  if (conventions.length === 0) return out(false, "no relevant conventions"); // silent

  const ctx = buildConventionContext(conventions);
  if (!(await cheapTriage(deps.fast, files, ctx))) return out(false, "triage: nothing to review");

  const changedPaths = new Set(files.map((f) => f.path));
  const findings = (await strongReview(deps.strong, files, ctx)).filter((f) =>
    changedPaths.has(f.path),
  ); // drop hallucinated paths
  if (findings.length === 0) return out(false, "clean — no findings");

  const budget = await deps.getNoiseBudget(repoSlug);
  const selected = selectFindings(findings, budget);
  if (selected.length === 0) return out(false, "all findings below budget");

  await postReview(deps.octokit, target, files, selected);
  await deps.recordMetrics?.(target, selected, conventions.length);
  return out(true, "posted", selected.length);
}

/** Render a finding into a review comment that cites its convention + source_url provenance. */
export function renderComment(f: Finding): string {
  const src = f.sourceUrl ? ` _([source](${f.sourceUrl}))_` : "";
  // The trailing marker lets recordReactionSignal map a reaction back to the convention.
  return `**Convention:** ${f.conventionLabel}\n\n${f.message}${src}\n\n<!-- cf:conv=${f.conventionId} -->`;
}

function isStatus(err: unknown, status: number): boolean {
  return typeof err === "object" && err !== null && (err as { status?: number }).status === status;
}

function summaryBody(findings: Finding[]): string {
  return [
    "Code Forge — convention findings:",
    "",
    ...findings.map(
      (f) =>
        `- \`${f.path}:${f.line}\` — ${f.message}${f.sourceUrl ? ` ([source](${f.sourceUrl}))` : ""}`,
    ),
  ].join("\n");
}

async function postReview(
  octokit: Octokit,
  target: ReviewTarget,
  files: ChangedFile[],
  findings: Finding[],
): Promise<void> {
  // Anchor only to lines actually addressable in the diff; GitHub 422s otherwise.
  const addressable = new Map(files.map((f) => [f.path, addressableLines(f.patch)]));
  const inline = findings.filter((f) => addressable.get(f.path)?.has(f.line));

  const base = {
    owner: target.owner,
    repo: target.repo,
    pull_number: target.prNumber,
    ...(target.headSha ? { commit_id: target.headSha } : {}),
  };

  if (inline.length > 0) {
    try {
      await octokit.rest.pulls.createReview({
        ...base,
        event: "COMMENT",
        comments: inline.map((f) => ({
          path: f.path,
          line: f.line,
          side: "RIGHT" as const,
          body: renderComment(f),
        })),
      });
      return;
    } catch (err) {
      if (!isStatus(err, 422)) throw err; // only fall back for invalid-line errors
    }
  }

  // No addressable lines (or the inline attempt 422'd): post one summary review with provenance.
  await octokit.rest.pulls.createReview({ ...base, event: "COMMENT", body: summaryBody(findings) });
}
