import { describe, expect, it } from "vitest";
import type { RankedConvention } from "../conventions/retrieve.js";
import { buildConventionContext, parseFindings } from "./llm.js";

function conv(over: Partial<RankedConvention>): RankedConvention {
  return {
    id: "c1",
    repo: "o/r",
    source: "pr_comment",
    sourceUrl: "https://example/1",
    pathGlob: null,
    body: "Always use const over let",
    signal: 0,
    similarity: 0.9,
    rankScore: 0.9,
    ...over,
  };
}

describe("buildConventionContext", () => {
  it("labels conventions C1..Cn and includes them in the prompt", () => {
    const ctx = buildConventionContext([conv({ id: "a" }), conv({ id: "b" })]);
    expect(ctx.byLabel.get("C1")?.id).toBe("a");
    expect(ctx.byLabel.get("C2")?.id).toBe("b");
    expect(ctx.prompt).toContain("C1");
    expect(ctx.prompt).toContain("C2");
  });
});

describe("parseFindings", () => {
  const ctx = buildConventionContext([conv({ id: "abc", sourceUrl: "https://src/1" })]); // → C1

  it("maps a convention ref to our provenance and coerces fields (even fenced JSON)", () => {
    const text =
      '```json\n[{"path":"src/a.ts","line":3,"convention":"C1","severity":"high","confidence":0.8,"message":"Use const"}]\n```';
    const out = parseFindings(text, ctx.byLabel);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      path: "src/a.ts",
      line: 3,
      conventionId: "abc",
      sourceUrl: "https://src/1",
      severity: "high",
      confidence: 0.8,
    });
  });

  it("drops findings citing an unknown convention (anti-hallucination)", () => {
    const text =
      '[{"path":"a","line":1,"convention":"C9","severity":"low","confidence":0.5,"message":"x"}]';
    expect(parseFindings(text, ctx.byLabel)).toEqual([]);
  });

  it("returns [] for junk / non-arrays", () => {
    expect(parseFindings("no json here", ctx.byLabel)).toEqual([]);
    expect(parseFindings("{}", ctx.byLabel)).toEqual([]);
  });

  it("clamps confidence to [0,1] and defaults severity to medium", () => {
    const text = '[{"path":"a","line":1,"convention":"C1","confidence":5,"message":"x"}]';
    const out = parseFindings(text, ctx.byLabel);
    expect(out[0]?.confidence).toBe(1);
    expect(out[0]?.severity).toBe("medium");
  });
});
