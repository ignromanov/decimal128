import { describe, expect, it } from "vitest";
import { toNumber } from "@/format/toNumber";

describe("toNumber", () => {
  it.each([
    ["1.5", 1.5],
    ["1e400", Number.POSITIVE_INFINITY],  // beyond binary64 range
    ["Infinity", Number.POSITIVE_INFINITY],
  ] as const)("toNumber(%j) === %s", (v, expected) => {
    expect(toNumber(v)).toBe(expected);
  });

  it("preserves -0", () => {
    expect(Object.is(toNumber("-0"), -0)).toBe(true);
  });

  it("returns NaN for NaN", () => {
    expect(Number.isNaN(toNumber("NaN"))).toBe(true);
  });
});
