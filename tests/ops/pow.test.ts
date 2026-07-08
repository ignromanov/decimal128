import { describe, expect, it } from "vitest";
import { DecimalError } from "@/errors";
import { pow } from "@/ops/pow";

describe("pow", () => {
  it.each([
    ["2", 10, "1024"],
    ["1.5", 2, "2.25"],
    ["-2", 3, "-8"],
    ["-2", 2, "4"],
    ["0", 0, "1"],                     // x^0 === 1 by convention, even for 0
    ["NaN", 0, "1"],                   // IEEE pow(x, 0) = 1
    ["5", 1, "5"],
    ["0", 5, "0"],
    ["-0", 3, "-0"],
    ["-0", 2, "0"],
    ["Infinity", 2, "Infinity"],
    ["-Infinity", 3, "-Infinity"],
    ["-Infinity", 2, "Infinity"],
    ["NaN", 2, "NaN"],
    ["10", 6200, "Infinity"],          // overflow
  ] as const)("pow(%j, %i) === %j", (base, e, expected) => {
    expect(pow(base, e)).toBe(expected);
  });

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "throws INVALID_EXPONENT on %s",
    (e) => {
      expect(() => pow("2", e)).toThrowError(DecimalError);
      try {
        pow("2", e);
      } catch (err) {
        expect((err as DecimalError).code).toBe("INVALID_EXPONENT");
      }
    },
  );
});
