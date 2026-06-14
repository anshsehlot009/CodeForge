import { describe, expect, it } from "vitest";
import type { Embedder } from "@code-forge/core";
import type { ConventionMatch } from "@code-forge/db";
import {
  globToRegExp,
  pathGlobMatches,
  rankConventions,
  retrieveConventions,
  type Hunk,
  type RetrieveDeps,
} from "./retrieve.js";

// A seeded conventions row (overridable).
function seed(over: Partial<ConventionMatch>): ConventionMatch {
  return {
    id: "id",
    repo: "o/r",
    source: "pr_comment",
    sourceUrl: null,
    pathGlob: null,
    body: "a rule",
    signal: 0,
    similarity: 0.5,
    ...over,
  };
}

// Embedder stub — deterministic, never hits fastembed.
const fakeEmbedder: Embedder = {
  dimensions: 384,
  embed: async () => new Array(384).fill(0.1),
  embedBatch: async (texts) => texts.map(() => new Array(384).fill(0.1)),
};

describe("globToRegExp / pathGlobMatches", () => {
  it("treats null / * / ** as repo-wide", () => {
    expect(pathGlobMatches(null, ["a.ts"])).toBe(true);
    expect(pathGlobMatches("*", ["src/a.ts"])).toBe(true);
    expect(pathGlobMatches("**", ["src/a.ts"])).toBe(true);
  });

  it("matches extension and directory globs against changed files", () => {
    expect(globToRegExp("**/*.ts").test("src/a/b.ts")).toBe(true);
    expect(pathGlobMatches("**/*.ts", ["src/app.ts"])).toBe(true);
    expect(pathGlobMatches("**/*.ts", ["README.md"])).toBe(false);
    expect(pathGlobMatches("src/**", ["src/app.ts"])).toBe(true);
    expect(pathGlobMatches("src/**", ["lib/app.ts"])).toBe(false);
    expect(pathGlobMatches("docs/*.md", ["docs/STYLE.md"])).toBe(true);
    expect(pathGlobMatches("docs/*.md", ["docs/a/b.md"])).toBe(false);
  });
});

describe("rankConventions", () => {
  it("filters by path_glob and re-ranks by similarity + 0.15·signal", () => {
    const rows = [
      seed({ id: "a", pathGlob: "**/*.ts", similarity: 0.7, signal: 0 }), // 0.70
      seed({ id: "b", pathGlob: "**/*.ts", similarity: 0.6, signal: 3 }), // 0.60 + 0.45 = 1.05
      seed({ id: "c", pathGlob: "**/*.md", similarity: 0.99, signal: 9 }), // filtered (no .md changed)
      seed({ id: "d", pathGlob: null, similarity: 0.5, signal: 1 }), // 0.50 + 0.15 = 0.65
    ];
    const ranked = rankConventions(rows, ["src/app.ts"]);
    expect(ranked.map((r) => r.id)).toEqual(["b", "a", "d"]);
    expect(ranked[0]?.rankScore).toBeCloseTo(1.05);
    expect(ranked[1]?.rankScore).toBeCloseTo(0.7);
  });

  it("keeps input order for equal rankScores (stable sort)", () => {
    const rows = [
      seed({ id: "first", similarity: 0.6, signal: 0 }), // 0.60
      seed({ id: "second", similarity: 0.45, signal: 1 }), // 0.45 + 0.15 = 0.60
    ];
    expect(rankConventions(rows, ["any.ts"]).map((r) => r.id)).toEqual(["first", "second"]);
  });
});

describe("retrieveConventions", () => {
  it("embeds the diff, searches the repo, filters by changed files, re-ranks, returns top-k", async () => {
    const candidates = [
      seed({ id: "ts1", pathGlob: "**/*.ts", similarity: 0.6, signal: 2 }), // 0.90
      seed({ id: "ts2", pathGlob: "src/**", similarity: 0.8, signal: 0 }), // 0.80
      seed({ id: "md1", pathGlob: "**/*.md", similarity: 0.95, signal: 5 }), // filtered out
      seed({ id: "all", pathGlob: null, similarity: 0.5, signal: 0 }), // 0.50
    ];
    let seen: { repo: string; count: number } | null = null;
    const deps: RetrieveDeps = {
      embedder: fakeEmbedder,
      match: async (repo, _emb, count) => {
        seen = { repo, count };
        return candidates;
      },
    };

    const hunks: Hunk[] = [{ path: "src/app.ts", content: "export const x = 1;" }];
    const out = await retrieveConventions("o/r", hunks, deps, { k: 2, poolSize: 25 });

    expect(seen).toEqual({ repo: "o/r", count: 25 });
    expect(out.map((r) => r.id)).toEqual(["ts1", "ts2"]); // md1 filtered, "all" below top-2
    expect(out[0]?.rankScore).toBeCloseTo(0.9);
  });

  it("returns [] when every candidate is filtered out by path_glob", async () => {
    const deps: RetrieveDeps = {
      embedder: fakeEmbedder,
      match: async () => [seed({ id: "md", pathGlob: "**/*.md", similarity: 0.99, signal: 9 })],
    };
    const out = await retrieveConventions("o/r", [{ path: "src/a.ts", content: "x" }], deps);
    expect(out).toEqual([]);
  });

  it("preserves source_url provenance on results", async () => {
    const url = "https://github.com/o/r/pull/7#discussion_r42";
    const deps: RetrieveDeps = {
      embedder: fakeEmbedder,
      match: async () => [seed({ id: "p", pathGlob: "**/*.ts", sourceUrl: url, similarity: 0.9 })],
    };
    const out = await retrieveConventions("o/r", [{ path: "src/a.ts", content: "x" }], deps);
    expect(out[0]?.sourceUrl).toBe(url);
  });

  it("returns [] for an empty diff (no search)", async () => {
    let called = false;
    const deps: RetrieveDeps = {
      embedder: fakeEmbedder,
      match: async () => {
        called = true;
        return [];
      },
    };
    expect(await retrieveConventions("o/r", [], deps)).toEqual([]);
    expect(called).toBe(false);
  });
});
