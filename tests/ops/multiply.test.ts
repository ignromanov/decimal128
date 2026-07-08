import { describe, expect, it } from "vitest";
import { mul, multiply } from "@/ops/multiply";

describe("multiply", () => {
  it.each([
    ["0.1", "0.2", "0.02"],
    ["1.5", "2", "3"],
    ["-3", "2", "-6"],
    ["-1", "0", "-0"],                 // signed zero from sign product
    ["0", "0", "0"],
    ["-0", "-0", "0"],
    ["Infinity", "2", "Infinity"],
    ["Infinity", "-2", "-Infinity"],
    ["Infinity", "0", "NaN"],
    ["NaN", "0", "NaN"],
    ["1e6144", "10", "Infinity"],      // overflow
    ["1e-6176", "0.1", "0"],           // below subnormal range → zero
  ] as const)("multiply(%j, %j) === %j", (a, b, expected) => {
    expect(multiply(a, b)).toBe(expected);
  });

  it("rounds exact products past 34 digits (halfEven)", () => {
    // (10^17 + 1)^2 = 10^34 + 2·10^17 + 1 → 35 digits; the trailing …001 is
    // rounded away and trailing zeros are stripped.
    const x = (10n ** 17n + 1n).toString();
    expect(multiply(x, x)).toBe("1.00000000000000002e+34");
  });

  it("mul is an alias", () => {
    expect(mul).toBe(multiply);
  });
});
