import { describe, expect, it } from "vitest";
import { dedupeFindings, findingScore, selectFindings, type Finding } from "./types.js";

function f(over: Partial<Finding>): Finding {
  return {
    path: "a.ts",
    line: 1,
    message: "m",
    conventionLabel: "rule",
    sourceUrl: null,
    severity: "medium",
    confidence: 0.8,
    conventionId: "c",
    ...over,
  };
}

describe("findingScore", () => {
  it("is confidence × severity weight", () => {
    expect(findingScore(f({ confidence: 0.5, severity: "high" }))).toBeCloseTo(1.5);
    expect(findingScore(f({ confidence: 0.5, severity: "low" }))).toBeCloseTo(0.5);
  });
});

describe("dedupeFindings", () => {
  it("collapses same path+line+normalized message, keeping the most confident", () => {
    const out = dedupeFindings([
      f({ line: 3, message: "Use const, not let.", confidence: 0.6 }),
      f({ line: 3, message: "use const not let", confidence: 0.9 }), // near-duplicate
      f({ line: 4, message: "Use const, not let.", confidence: 0.7 }), // different line
    ]);
    expect(out).toHaveLength(2);
    expect(out.find((x) => x.line === 3)?.confidence).toBe(0.9);
  });

  it("keeps two different conventions reported on the same line", () => {
    const out = dedupeFindings([
      f({ path: "x.ts", line: 5, conventionId: "c1", message: "no console.log" }),
      f({ path: "x.ts", line: 5, conventionId: "c2", message: "prefer async/await" }),
    ]);
    expect(out).toHaveLength(2);
  });
});

describe("selectFindings", () => {
  it("filters by minConfidence, ranks by confidence×severity, caps at maxComments", () => {
    const findings = [
      f({ path: "a", confidence: 0.9, severity: "low" }), // 0.90
      f({ path: "b", confidence: 0.6, severity: "high" }), // 1.80
      f({ path: "c", confidence: 0.5, severity: "high" }), // dropped (conf < 0.55)
      f({ path: "d", confidence: 0.7, severity: "medium" }), // 1.40
    ];
    const out = selectFindings(findings, { minConfidence: 0.55, maxComments: 2 });
    expect(out.map((x) => x.path)).toEqual(["b", "d"]);
  });
});
