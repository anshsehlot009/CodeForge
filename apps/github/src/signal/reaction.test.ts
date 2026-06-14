import { describe, expect, it } from "vitest";
import { parseConventionMarker, reactionDelta } from "./reaction.js";

const ID = "deadbeef".repeat(8); // 64 hex chars, like a real sha256 convention id

describe("parseConventionMarker", () => {
  it("extracts a full sha256 convention id from our comment marker", () => {
    expect(parseConventionMarker(`text\n\n<!-- cf:conv=${ID} -->`)).toBe(ID);
    expect(parseConventionMarker("no marker here")).toBeNull();
    expect(parseConventionMarker(null)).toBeNull();
    expect(parseConventionMarker(undefined)).toBeNull();
  });

  it("rejects a truncated / non-64-hex id", () => {
    expect(parseConventionMarker("<!-- cf:conv=deadbeef -->")).toBeNull();
  });
});

describe("reactionDelta", () => {
  it("sums positive and negative reactions", () => {
    expect(reactionDelta([{ content: "+1" }, { content: "rocket" }, { content: "-1" }])).toBe(1);
    expect(reactionDelta([{ content: "-1" }, { content: "confused" }])).toBe(-2);
    expect(reactionDelta([{ content: "eyes" }])).toBe(0);
    expect(reactionDelta([])).toBe(0);
  });
});
