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
});
