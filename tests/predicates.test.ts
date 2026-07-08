import { describe, expect, it } from "vitest";
import { isFinite, isNaN, isNegative, isZero } from "@/predicates";

describe("predicates", () => {
  it.each([
    // value, isNaN, isFinite, isZero, isNegative
    ["1.5", false, true, false, false],
    ["-1.5", false, true, false, true],
    ["0", false, true, true, false],
    ["-0", false, true, true, true],
    ["Infinity", false, false, false, false],
    ["-Infinity", false, false, false, true],
    ["NaN", true, false, false, false],
  ] as const)("%j", (v, nan, finite, zero, negative) => {
    expect(isNaN(v)).toBe(nan);
    expect(isFinite(v)).toBe(finite);
    expect(isZero(v)).toBe(zero);
    expect(isNegative(v)).toBe(negative);
  });
});
