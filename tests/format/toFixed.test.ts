import { describe, expect, it } from "vitest";
import { toFixed } from "@/format/toFixed";
import { DecimalError } from "@/errors";

describe("toFixed", () => {
  it.each([
    ["1.005", 2, "1.00"],              // halfEven tie → even (JS Number gives "1.00" too, for a different reason)
    ["1.015", 2, "1.02"],
    ["1.5", 0, "2"],
    ["2.5", 0, "2"],                   // halfEven, diverges from Number's "3"
    ["1", 2, "1.00"],
    ["0.5", 3, "0.500"],
    ["-0", 2, "-0.00"],
    ["1e34", 1, "1" + "0".repeat(34) + ".0"],  // always plain, never exponential
    ["NaN", 2, "NaN"],
    ["-Infinity", 2, "-Infinity"],
  ] as const)("toFixed(%j, %i) === %j", (v, d, expected) => {
    expect(toFixed(v, d)).toBe(expected);
  });

  it.each([-1, 0.5, 101, Number.NaN])("throws INVALID_OPTION on digits=%s", (d) => {
    expect(() => toFixed("1", d)).toThrowError(DecimalError);
  });
});
