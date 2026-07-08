import { describe, expect, it } from "vitest";
import { abs } from "@/ops/abs";
import { neg, negate } from "@/ops/negate";

describe("abs", () => {
  it.each([
    ["-1.5", "1.5"], ["1.5", "1.5"], ["-0", "0"], ["0", "0"],
    ["-Infinity", "Infinity"], ["NaN", "NaN"],
  ] as const)("abs(%j) === %j", (a, expected) => {
    expect(abs(a)).toBe(expected);
  });
});

describe("negate", () => {
  it.each([
    ["1.5", "-1.5"], ["-1.5", "1.5"], ["0", "-0"], ["-0", "0"],
    ["Infinity", "-Infinity"], ["NaN", "NaN"],
  ] as const)("negate(%j) === %j", (a, expected) => {
    expect(negate(a)).toBe(expected);
  });

  it("neg is an alias", () => {
    expect(neg).toBe(negate);
  });
});
