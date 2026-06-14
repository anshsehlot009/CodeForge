import { describe, expect, it, vi } from "vitest";
import type { Octokit } from "octokit";
import type { LLM } from "@code-forge/core";
import type { RankedConvention } from "../conventions/retrieve.js";
import { reviewPullRequest, type ReviewDeps } from "./review.js";

const CONV: RankedConvention = {
  id: "deadbeef".repeat(8),
  repo: "acme/demo",
  source: "pr_comment",
  sourceUrl: "https://example/conv/1",
  pathGlob: null,
  body: "Use const over let",
  signal: 0,
  similarity: 0.9,
  rankScore: 0.9,
};

const FILES = [
  {
    filename: "src/a.ts",
    changes: 2,
    status: "modified",
    patch: "@@ -1,2 +1,2 @@\n const a = 1;\n+let b = 2;", // new-side line 1 (context), 2 (added)
  },
];

const llm = (reply: string): LLM => ({ model: "fake", complete: async () => reply });

function fakeOctokit(createReview: ReturnType<typeof vi.fn>): Octokit {
  return {
    paginate: async (route: string) => (route.includes("/files") ? FILES : []),
    rest: { pulls: { createReview } },
  } as unknown as Octokit;
}

function deps(over: Partial<ReviewDeps>): ReviewDeps {
  return {
    octokit: fakeOctokit(vi.fn(async () => ({}))),
    strong: llm("[]"),
    fast: llm("YES"),
    retrieve: async () => [CONV],
    getNoiseBudget: async () => ({ minConfidence: 0.5, maxComments: 10 }),
    ...over,
  };
}

const target = { owner: "acme", repo: "demo", prNumber: 1, headSha: "abc" };

describe("reviewPullRequest", () => {
  it("returns silently (no review) when no conventions are retrieved", async () => {
    const createReview = vi.fn(async () => ({}));
    const out = await reviewPullRequest(deps({ retrieve: async () => [], octokit: fakeOctokit(createReview) }), target);
    expect(out.posted).toBe(false);
    expect(createReview).not.toHaveBeenCalled();
  });

  it("stops at triage when the fast model says NO", async () => {
    const createReview = vi.fn(async () => ({}));
    const out = await reviewPullRequest(deps({ fast: llm("NO"), octokit: fakeOctokit(createReview) }), target);
    expect(out.reason).toMatch(/triage/);
    expect(createReview).not.toHaveBeenCalled();
  });

  it("posts ONE review with the finding's convention + source_url provenance", async () => {
    const createReview = vi.fn(async () => ({}));
    const strong = llm(
      JSON.stringify([
        { path: "src/a.ts", line: 2, convention: "C1", severity: "high", confidence: 0.9, message: "Use const" },
      ]),
    );
    const out = await reviewPullRequest(deps({ strong, octokit: fakeOctokit(createReview) }), target);
    expect(out.posted).toBe(true);
    expect(createReview).toHaveBeenCalledTimes(1);
    const call = createReview.mock.calls[0] as [{ comments?: { body?: string }[] }] | undefined;
    const body = call?.[0]?.comments?.[0]?.body ?? "";
    expect(body).toContain(CONV.sourceUrl);
    expect(body).toContain(`cf:conv=${CONV.id}`);
  });

  it("returns clean (no review) when the strong model finds nothing", async () => {
    const createReview = vi.fn(async () => ({}));
    const out = await reviewPullRequest(deps({ strong: llm("[]"), octokit: fakeOctokit(createReview) }), target);
    expect(out.posted).toBe(false);
    expect(createReview).not.toHaveBeenCalled();
  });
});
