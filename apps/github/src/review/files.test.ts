import { describe, expect, it } from "vitest";
import { isGenerated, isReviewable, MAX_FILE_CHANGES } from "./files.js";

describe("isGenerated", () => {
  it("flags lockfiles, build output, minified, snapshots, generated", () => {
    expect(isGenerated("pnpm-lock.yaml")).toBe(true);
    expect(isGenerated("apps/web/dist/index.js")).toBe(true);
    expect(isGenerated("a/b.min.js")).toBe(true);
    expect(isGenerated("x/__generated__/y.ts")).toBe(true);
    expect(isGenerated("schema.gen.ts")).toBe(true);
    expect(isGenerated("src/app.ts")).toBe(false);
  });
});

describe("isReviewable", () => {
  const base = { filename: "src/a.ts", changes: 10, status: "modified", patch: "@@ -1 +1 @@\n+x" };

  it("keeps normal modified text files with a patch", () => {
    expect(isReviewable(base)).toBe(true);
  });

  it("drops removed / binary / oversized / generated files", () => {
    expect(isReviewable({ ...base, status: "removed" })).toBe(false);
    expect(isReviewable({ ...base, patch: undefined })).toBe(false);
    expect(isReviewable({ ...base, changes: MAX_FILE_CHANGES + 1 })).toBe(false);
    expect(isReviewable({ ...base, filename: "yarn.lock" })).toBe(false);
  });
});
