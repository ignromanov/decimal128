import { describe, expect, it } from "vitest";
import { cmp, compare } from "@/compare/compare";
import { eq, equals } from "@/compare/equals";

describe("compare (total order)", () => {
  it.each([
    ["1", "2", -1],
    ["2", "1", 1],
    ["1.0", "1", 0],
    ["0", "-0", 0],                    // zero signs are not ordered
    ["-1", "1", -1],
    ["-Infinity", "1", -1],
    ["Infinity", "1e6144", 1],
    ["1e-6176", "0", 1],
    ["9.999999999999999999999999999999999e+6144", "Infinity", -1],
    ["NaN", "NaN", 0],
    ["NaN", "Infinity", 1],            // NaN sorts last
    ["1", "NaN", -1],
    // same adjusted exponent, differing digits
    ["1.23", "1.24", -1],
    ["123", "12.4", 1],
  ] as const)("compare(%j, %j) === %i", (a, b, expected) => {
    expect(compare(a, b)).toBe(expected);
  });

  it("sorts arrays with NaN last", () => {
    const sorted = ["NaN", "3", "-Infinity", "0.5"].sort((a, b) => compare(a, b));
    expect(sorted).toEqual(["-Infinity", "0.5", "3", "NaN"]);
  });

  it("cmp is an alias", () => {
    expect(cmp).toBe(compare);
  });
});

describe("equals (IEEE)", () => {
  it.each([
    ["1.0", "1", true],
    ["0", "-0", true],
    ["NaN", "NaN", false],             // the ===-footgun antidote
    ["Infinity", "Infinity", true],
    ["1", "2", false],
  ] as const)("equals(%j, %j) === %s", (a, b, expected) => {
    expect(equals(a, b)).toBe(expected);
  });

  it("eq is an alias", () => {
    expect(eq).toBe(equals);
  });
});
