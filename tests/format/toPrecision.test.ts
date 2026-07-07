import { describe, expect, it } from "vitest";
import { toPrecision } from "@/format/toPrecision";
import { DecimalError } from "@/errors";

describe("toPrecision", () => {
  it.each([
    ["123.45", 4, "123.4"],            // dropped digit is an exact-half 5 → halfEven keeps even 123.4
    ["123.45", 7, "123.4500"],         // pads with zeros
    ["0.0001234", 2, "0.00012"],
    ["123.45", 2, "1.2e+2"],           // E(2) ≥ precision(2) → exponential
    ["0.0000001", 3, "1.00e-7"],       // E < -6 → exponential
    ["NaN", 3, "NaN"],
  ] as const)("toPrecision(%j, %i) === %j", (v, p, expected) => {
    expect(toPrecision(v, p)).toBe(expected);
  });

  it.each([0, 35, 1.5])("throws INVALID_OPTION on precision=%s", (p) => {
    expect(() => toPrecision("1", p)).toThrowError(DecimalError);
  });
});
