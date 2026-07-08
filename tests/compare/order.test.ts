import { describe, expect, it } from "vitest";
import { gt, gte, lt, lte } from "@/compare/order";

describe("IEEE ordered comparisons — NaN is always false", () => {
  it.each([
    ["1", "2", true, true, false, false],   // a, b, lt, lte, gt, gte
    ["2", "2", false, true, false, true],
    ["3", "2", false, false, true, true],
    ["NaN", "2", false, false, false, false],
    ["2", "NaN", false, false, false, false],
    ["-0", "0", false, true, false, true],
  ] as const)("(%j vs %j)", (a, b, isLt, isLte, isGt, isGte) => {
    expect(lt(a, b)).toBe(isLt);
    expect(lte(a, b)).toBe(isLte);
    expect(gt(a, b)).toBe(isGt);
    expect(gte(a, b)).toBe(isGte);
  });
});
