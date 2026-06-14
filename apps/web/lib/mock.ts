/* ════════════════════════════════════════════════════════════════════════════
 *  ⚠️  MOCK DATA LAYER — NOT WIRED TO THE BACKEND  ⚠️
 *
 *  Stand-in data for screens whose Supabase tables aren't populated yet. Every consumer
 *  in lib/data.ts is labelled `LIVE (supabase)` or `MOCK`. Replace each MOCK read with a
 *  real query as the backend fills in. Do not import this file from the data layer's LIVE
 *  paths once they're real.
 * ════════════════════════════════════════════════════════════════════════════ */

export type Source = "pr_comment" | "contributing" | "styleguide";
export type Severity = "low" | "medium" | "high";
export type PrStatus = "reviewed" | "silent" | "reviewing";

/* ── /home — the prioritized "Needs you" stream ──────────────────────────────── */

export interface StreamItem {
  id: string;
  title: string;
  repo: string;
  prNumber: number;
  /** The matching PR queue id (PrSummary.id), if this item is reviewable. */
  prId?: string;
  status: PrStatus | "failing";
  reason: string;
  confidence: number;
  commentCount: number;
  updatedAt: string;
  detail: string;
}

export const MOCK_STREAM: StreamItem[] = [
  {
    id: "s1",
    title: "Refactor auth middleware to async guards",
    repo: "code-forge/api",
    prNumber: 482,
    prId: "482",
    status: "reviewed",
    reason: "3 high-confidence findings cite a CONTRIBUTING rule you wrote",
    confidence: 0.91,
    commentCount: 3,
    updatedAt: "8m ago",
    detail:
      "The review flags two missing `await`s on the new guard chain and one error swallowed in a catch. All three map to “async handlers must not swallow errors.”",
  },
  {
    id: "s2",
    title: "Add pgvector index migration",
    repo: "code-forge/db",
    prNumber: 117,
    status: "failing",
    reason: "CI failing — review paused until the migration applies",
    confidence: 0.74,
    commentCount: 0,
    updatedAt: "21m ago",
    detail: "The HNSW index build timed out in CI. Re-run once the runner has more memory, then the review will resume automatically.",
  },
  {
    id: "s3",
    title: "Tighten StatusPill contrast on Daybreak",
    repo: "code-forge/web",
    prNumber: 903,
    prId: "903",
    status: "reviewing",
    reason: "Reviewing now — strong pass in progress",
    confidence: 0.62,
    commentCount: 0,
    updatedAt: "just now",
    detail: "Cheap triage said this touches a styleguide convention. The strong pass is running; findings will stream in shortly.",
  },
  {
    id: "s4",
    title: "Bump fastembed and re-embed conventions",
    repo: "code-forge/core",
    prNumber: 256,
    prId: "256",
    status: "reviewed",
    reason: "1 finding — a 👎 here will lower this rule's signal",
    confidence: 0.58,
    commentCount: 1,
    updatedAt: "1h ago",
    detail: "A single low-severity nudge about embedding-dimension drift. If it's noise, dismiss it — the convention's signal drops and you'll see it less.",
  },
];

/* ── /home — the Pulse rail ──────────────────────────────────────────────────── */

export interface PulseData {
  acceptRate: number;
  acceptRateSeries: number[];
  noiseLevel: number;
  noiseCap: number;
  costThisMonth: number;
  costCap: number;
}

export const MOCK_PULSE: PulseData = {
  acceptRate: 0.78,
  acceptRateSeries: [0.61, 0.64, 0.6, 0.69, 0.72, 0.7, 0.74, 0.73, 0.77, 0.78],
  noiseLevel: 4.2,
  noiseCap: 10,
  costThisMonth: 38.4,
  costCap: 100,
};

/* ── /pr — the review center ─────────────────────────────────────────────────── */

export interface PrSummary {
  id: string;
  number: number;
  title: string;
  author: string;
  repo: string;
  status: PrStatus;
  commentCount: number;
  updatedAt: string;
}

export interface ReviewCommentData {
  id: string;
  path: string;
  line: number;
  message: string;
  severity: Severity;
  confidence: number;
  conventionLabel: string;
  source: Source;
  sourceUrl: string | null;
}

export interface DiffFile {
  path: string;
  patch: string;
}

export interface PrDetail extends PrSummary {
  branch: string;
  files: DiffFile[];
  comments: ReviewCommentData[];
}

export const MOCK_PRS: PrSummary[] = [
  { id: "482", number: 482, title: "Refactor auth middleware to async guards", author: "ada", repo: "code-forge/api", status: "reviewed", commentCount: 3, updatedAt: "8m" },
  { id: "903", number: 903, title: "Tighten StatusPill contrast on Daybreak", author: "grace", repo: "code-forge/web", status: "reviewing", commentCount: 0, updatedAt: "now" },
  { id: "771", number: 771, title: "Docs: clarify provider env vars", author: "linus", repo: "code-forge/core", status: "silent", commentCount: 0, updatedAt: "32m" },
  { id: "256", number: 256, title: "Bump fastembed and re-embed conventions", author: "alan", repo: "code-forge/core", status: "reviewed", commentCount: 1, updatedAt: "1h" },
  { id: "640", number: 640, title: "Add retry/backoff to ingest worker", author: "ada", repo: "code-forge/github", status: "silent", commentCount: 0, updatedAt: "2h" },
];

const DIFF_482 = `@@ -12,7 +12,9 @@ export async function withGuards(req, res, next) {
   const user = await authenticate(req);
-  guards.forEach((g) => g(user));
+  guards.forEach((g) => {
+    g(user); // BUG: async guard not awaited
+  });
   if (!user) return res.status(401).end();
@@ -28,5 +30,7 @@ async function loadSession(req) {
   try {
     return await sessions.get(req.cookies.sid);
-  } catch (e) {}
+  } catch (e) {
+    return null; // error swallowed silently
+  }
 }`;

export const MOCK_PR_DETAILS: Record<string, PrDetail> = {
  "482": {
    ...MOCK_PRS[0]!,
    branch: "refactor/async-guards",
    files: [{ path: "src/auth/middleware.ts", patch: DIFF_482 }],
    comments: [
      {
        id: "c1",
        path: "src/auth/middleware.ts",
        line: 14,
        message: "Each guard is async — await them (e.g. `await Promise.all(guards.map((g) => g(user)))`) or the chain races.",
        severity: "high",
        confidence: 0.93,
        conventionLabel: "Async handlers must await every guard",
        source: "contributing",
        sourceUrl: "https://github.com/code-forge/api/blob/main/CONTRIBUTING.md#async",
      },
      {
        id: "c2",
        path: "src/auth/middleware.ts",
        line: 31,
        message: "Don't swallow the error — log it or surface it; a silent catch hides auth failures.",
        severity: "medium",
        confidence: 0.84,
        conventionLabel: "Never swallow errors in a catch",
        source: "pr_comment",
        sourceUrl: "https://github.com/code-forge/api/pull/410#discussion_r1",
      },
    ],
  },
  "256": {
    ...MOCK_PRS[3]!,
    branch: "chore/fastembed",
    files: [{ path: "packages/core/src/providers/local-embedder.ts", patch: "@@ -6,1 +6,1 @@\n-export type FastEmbedModel = \"bge-small\";\n+export type FastEmbedModel = \"bge-small\" | \"bge-base\";" }],
    comments: [
      {
        id: "c3",
        path: "packages/core/src/providers/local-embedder.ts",
        line: 6,
        message: "Adding a 768-dim model — make sure the conventions.embedding column matches or upserts will fail.",
        severity: "low",
        confidence: 0.58,
        conventionLabel: "Embedding dim must match the vector column",
        source: "styleguide",
        sourceUrl: "https://github.com/code-forge/db/blob/main/docs/STYLE.md#vectors",
      },
    ],
  },
};

/**
 * A PR's review detail: the rich mock entry, or a synthesized minimal detail (no comments)
 * for silent / reviewing queue rows that don't have a hand-written one yet.
 */
export function getMockPrDetail(id: string): PrDetail | null {
  const rich = MOCK_PR_DETAILS[id];
  if (rich) return rich;
  const summary = MOCK_PRS.find((p) => p.id === id);
  if (!summary) return null;
  return { ...summary, branch: `pr-${summary.number}`, files: [], comments: [] };
}

/* ── /settings/noise — sample PR for the live preview ────────────────────────── */

export interface SampleComment {
  id: string;
  path: string;
  line: number;
  message: string;
  severity: Severity;
  confidence: number;
  conventionLabel: string;
}

export const MOCK_SAMPLE_PR: { title: string; comments: SampleComment[] } = {
  title: "feat: streaming review results",
  comments: [
    { id: "p1", path: "src/review/stream.ts", line: 42, message: "Await the flush before closing the stream.", severity: "high", confidence: 0.94, conventionLabel: "Flush before close" },
    { id: "p2", path: "src/review/stream.ts", line: 58, message: "Prefer a typed event over `any` payloads.", severity: "medium", confidence: 0.81, conventionLabel: "No any in committed code" },
    { id: "p3", path: "src/review/llm.ts", line: 12, message: "Cap maxTokens so triage stays cheap.", severity: "medium", confidence: 0.66, conventionLabel: "Triage must stay cheap" },
    { id: "p4", path: "src/review/llm.ts", line: 90, message: "Consider memoizing the prompt builder.", severity: "low", confidence: 0.52, conventionLabel: "Avoid rebuilding prompts" },
    { id: "p5", path: "src/util/log.ts", line: 7, message: "Nit: trailing whitespace.", severity: "low", confidence: 0.38, conventionLabel: "Formatting" },
    { id: "p6", path: "src/util/log.ts", line: 9, message: "Nit: prefer `const`.", severity: "low", confidence: 0.29, conventionLabel: "Prefer const" },
  ],
};

/* ── /settings/billing ───────────────────────────────────────────────────────── */

export interface CostLogEntry {
  id: string;
  at: string;
  action: string;
  model: string;
  tokens: number;
  cost: number;
}

export interface BillingState {
  plan: string;
  priceMonthly: number;
  costThisMonth: number;
  cap: number;
  stopAtCap: boolean;
  log: CostLogEntry[];
}

export const MOCK_BILLING: BillingState = {
  plan: "Team",
  priceMonthly: 49,
  costThisMonth: 38.4,
  cap: 100,
  stopAtCap: true,
  log: [
    { id: "l1", at: "10:42", action: "Strong review · PR #482", model: "llama-3.3-70b", tokens: 18400, cost: 0.41 },
    { id: "l2", at: "10:41", action: "Triage · PR #482", model: "llama-3.3-70b (fast)", tokens: 2100, cost: 0.02 },
    { id: "l3", at: "09:58", action: "Ingest re-embed · code-forge/core", model: "bge-small (local)", tokens: 0, cost: 0.0 },
    { id: "l4", at: "09:31", action: "Strong review · PR #256", model: "llama-3.3-70b", tokens: 9200, cost: 0.21 },
    { id: "l5", at: "08:12", action: "Triage · PR #771 (silent)", model: "llama-3.3-70b (fast)", tokens: 1500, cost: 0.01 },
  ],
};
