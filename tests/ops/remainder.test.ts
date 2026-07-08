import { describe, expect, it } from "vitest";
import { mod, remainder } from "@/ops/remainder";

describe("remainder (truncated, JS % semantics)", () => {
  it.each([
    ["7", "3", "1"],
    ["-7", "3", "-1"],                 // sign follows the dividend
    ["7", "-3", "1"],
    ["5.5", "2", "1.5"],
    ["1", "0.3", "0.1"],
    ["6", "3", "0"],
    ["-6", "3", "-0"],                 // exact zero remainder keeps dividend sign
    ["1", "0", "NaN"],
    ["Infinity", "2", "NaN"],
    ["2", "Infinity", "2"],
    ["NaN", "2", "NaN"],
    ["0", "2", "0"],
    ["-0", "2", "-0"],
  ] as const)("remainder(%j, %j) === %j", (a, b, expected) => {
    expect(remainder(a, b)).toBe(expected);
  });

  it("mod is an alias", () => {
    expect(mod).toBe(remainder);
  });

  // IBM GDA: remainder raises "Division impossible" → NaN when the integer quotient
  // trunc(x/y) has more than 34 digits. trunc(10^n / 3) has exactly n digits, so the
  // boundary sits between 1e34 (q=34 digits, ok) and 1e35 (q=35 digits, NaN).
  describe("GDA division-impossible → NaN (integer quotient > 34 digits)", () => {
    it.each([
      ["1e34", "3", "1"],       // q = trunc(1e34/3) has 34 digits → finite; 10^34 ≡ 1 (mod 3)
      ["1e35", "3", "NaN"],     // q has 35 digits → Division impossible
      ["1e40", "3", "NaN"],     // q has 40 digits → Division impossible
      ["1e6144", "10", "NaN"],  // q = 10^6143 has 6144 digits → Division impossible
    ] as const)("remainder(%j, %j) === %j", (a, b, expected) => {
      expect(remainder(a, b)).toBe(expected);
    });
  });
});
