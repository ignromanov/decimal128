import { describe, expect, it } from "vitest";
import { normalizeLiteral, sameValue, toOperandInput } from "./normalize";

describe("normalizeLiteral", () => {
  it("collapses cohort members to one value", () => {
    // Our Decimal has no quantum: 2.0, 2.00 and 2 are the same value.
    expect(normalizeLiteral("2.0")).toEqual(normalizeLiteral("2"));
    expect(normalizeLiteral("2.00")).toEqual(normalizeLiteral("2E+0"));
    expect(normalizeLiteral("1.50")).toEqual(normalizeLiteral("1.5"));
  });

  it("keeps zero signed but exponent-free", () => {
    expect(normalizeLiteral("0.00")).toEqual({ kind: "num", sign: 1, coeff: 0n, exp: 0 });
    expect(normalizeLiteral("-0E+3")).toEqual({ kind: "num", sign: -1, coeff: 0n, exp: 0 });
    expect(sameValue(normalizeLiteral("0"), normalizeLiteral("-0"))).toBe(false);
  });

  it("parses exponent and fraction forms", () => {
    expect(normalizeLiteral("1E+3")).toEqual({ kind: "num", sign: 1, coeff: 1n, exp: 3 });
    expect(normalizeLiteral(".5")).toEqual({ kind: "num", sign: 1, coeff: 5n, exp: -1 });
    expect(normalizeLiteral("-1e-6176")).toEqual({ kind: "num", sign: -1, coeff: 1n, exp: -6176 });
  });

  it("accepts both infinity spellings", () => {
    expect(normalizeLiteral("Inf")).toEqual({ kind: "inf", sign: 1 });
    expect(normalizeLiteral("-Infinity")).toEqual({ kind: "inf", sign: -1 });
    expect(sameValue(normalizeLiteral("Inf"), normalizeLiteral("Infinity"))).toBe(true);
  });

  it("treats NaN as equal to NaN for known-answer purposes", () => {
    expect(sameValue(normalizeLiteral("NaN"), normalizeLiteral("NaN"))).toBe(true);
    expect(sameValue(normalizeLiteral("NaN"), normalizeLiteral("Inf"))).toBe(false);
  });

  it("rejects literals it cannot represent", () => {
    expect(() => normalizeLiteral("#")).toThrow(/unparsable/);
  });

  it("throws on every NaN form our value model cannot carry", () => {
    // The runner's skip policy filters these out first; the throw is the latch that
    // catches skip-policy drift instead of silently accepting a signalling NaN.
    for (const literal of ["-NaN", "+NaN", "sNaN", "NaN123", "-sNaN99"]) {
      expect(() => normalizeLiteral(literal)).toThrow(/unparsable/);
    }
  });
});

describe("toOperandInput", () => {
  it("expands decTest's short infinity form, which from() rejects", () => {
    expect(toOperandInput("Inf")).toBe("Infinity");
    expect(toOperandInput("-Inf")).toBe("-Infinity");
  });

  it("drops a leading plus, which from() also rejects", () => {
    expect(toOperandInput("+1.5")).toBe("1.5");
  });

  it("passes ordinary literals through untouched", () => {
    expect(toOperandInput("1E+3")).toBe("1E+3");
    expect(toOperandInput("-0")).toBe("-0");
  });
});
