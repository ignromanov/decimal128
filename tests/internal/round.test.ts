import { describe, expect, it } from "vitest";
import { fitFinite, quantize, roundCoefficient } from "@/internal/round";
import type { Dec } from "@/internal/types";

describe("roundCoefficient — drop 2 digits from 12345", () => {
  it.each([
    ["trunc", 1, 123n],
    ["ceil", 1, 124n],
    ["ceil", -1, 123n],
    ["floor", 1, 123n],
    ["floor", -1, 124n],
    ["halfExpand", 1, 123n],
    ["halfEven", 1, 123n],
  ] as const)("%s sign=%i → %s", (mode, sign, expected) => {
    expect(roundCoefficient(12345n, 2, sign, mode)).toBe(expected);
  });

  it.each([
    // exact half: 12350 → 123|50
    ["halfEven", 12350n, 124n],  // 123 is odd → up to even 124
    ["halfEven", 12250n, 122n],  // 122 is even → stays
    ["halfExpand", 12250n, 123n],
  ] as const)("%s tie on %s → %s", (mode, coeff, expected) => {
    expect(roundCoefficient(coeff, 2, 1, mode)).toBe(expected);
  });

  it("sticky breaks halfEven ties upward", () => {
    expect(roundCoefficient(12250n, 2, 1, "halfEven", true)).toBe(123n);
  });

  it("sticky forces ceil up even with zero remainder", () => {
    expect(roundCoefficient(12300n, 2, 1, "ceil", true)).toBe(124n);
  });

  it("drop greater than digit count avoids huge pow10 and rounds directionally", () => {
    expect(roundCoefficient(999n, 1_000_000, 1, "halfEven")).toBe(0n);
    expect(roundCoefficient(999n, 1_000_000, 1, "ceil")).toBe(1n);
    expect(roundCoefficient(999n, 1_000_000, -1, "floor")).toBe(1n);
  });
});

describe("fitFinite", () => {
  it("strips trailing zeros into the exponent", () => {
    expect(fitFinite(1, 12300n, -2, "halfEven")).toEqual({
      kind: "finite", sign: 1, coefficient: 123n, exponent: 0,
    });
  });

  it("rounds a 35-digit coefficient to 34 digits", () => {
    const c35 = 10n ** 34n + 5n; // 1000…005 (35 digits)
    expect(fitFinite(1, c35, 0, "halfEven")).toEqual({
      kind: "finite", sign: 1, coefficient: 1n, exponent: 34,
    });
  });

  it("handles all-nines carry: 34 nines + roundup → 1e34", () => {
    const nines35 = 10n ** 35n - 1n; // 35 nines
    expect(fitFinite(1, nines35, 0, "halfEven")).toEqual({
      kind: "finite", sign: 1, coefficient: 1n, exponent: 35,
    });
  });

  it("overflows to Infinity under halfEven", () => {
    expect(fitFinite(1, 1n, 6145, "halfEven")).toEqual({ kind: "inf", sign: 1 });
  });

  it("overflows to max-normal under trunc", () => {
    expect(fitFinite(1, 1n, 6145, "trunc")).toEqual({
      kind: "finite", sign: 1, coefficient: 10n ** 34n - 1n, exponent: 6111,
    });
  });

  it("rounds subnormally at the quantum floor", () => {
    // 5e-6177 → halfEven tie against 0 at quantum -6176 → 0 (even)
    expect(fitFinite(1, 5n, -6177, "halfEven")).toEqual({ kind: "zero", sign: 1 });
    // 6e-6177 → above half → 1e-6176
    expect(fitFinite(1, 6n, -6177, "halfEven")).toEqual({
      kind: "finite", sign: 1, coefficient: 1n, exponent: -6176,
    });
  });

  it("single-rounds when both digit and quantum limits apply", () => {
    // 40 significant digits AND exponent below the quantum floor: one combined
    // drop of 38 (not digit-drop then quantum-drop) lands on a finite subnormal.
    const c = 10n ** 39n + 7n; // 1000…0007 (40 digits, no trailing zeros)
    const out = fitFinite(1, c, -6214, "halfEven") as Extract<Dec, { kind: "finite" }>;
    expect(out.kind).toBe("finite");
    expect(out.exponent).toBeGreaterThanOrEqual(-6176);
  });

  it("zero coefficient yields signed zero", () => {
    expect(fitFinite(-1, 0n, 5, "halfEven")).toEqual({ kind: "zero", sign: -1 });
  });
});

describe("quantize", () => {
  const dec = (coefficient: bigint, exponent: number): Dec =>
    ({ kind: "finite", sign: 1, coefficient, exponent });

  it("rounds to maximumFractionDigits", () => {
    expect(quantize(dec(12345n, -3), 2, "halfEven")).toEqual(dec(1234n, -2)); // 12.345 → 12.34 (tie→even)
    expect(quantize(dec(12355n, -3), 2, "halfEven")).toEqual(dec(1236n, -2)); // 12.355 → 12.36
  });

  it("leaves coarser values untouched", () => {
    expect(quantize(dec(5n, 3), 2, "halfEven")).toEqual(dec(5n, 3));
  });

  it("can quantize to zero", () => {
    expect(quantize(dec(4n, -3), 2, "halfEven")).toEqual({ kind: "zero", sign: 1 });
  });

  it("passes specials through", () => {
    expect(quantize({ kind: "nan" }, 2, "halfEven")).toEqual({ kind: "nan" });
  });
});
