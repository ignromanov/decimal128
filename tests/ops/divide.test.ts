import { describe, expect, it } from "vitest";
import { div, divide } from "@/ops/divide";

describe("divide", () => {
  it.each([
    ["1", "2", "0.5"],
    ["1", "3", "0.3333333333333333333333333333333333"], // 34 threes
    ["2", "3", "0.6666666666666666666666666666666667"], // halfEven rounds last digit up
    ["-6", "2", "-3"],
    ["1", "0", "Infinity"],
    ["-1", "0", "-Infinity"],
    ["1", "-0", "-Infinity"],          // sign of zero matters — the -0 payoff
    ["0", "0", "NaN"],
    ["0", "5", "0"],
    ["-0", "5", "-0"],
    ["5", "Infinity", "0"],
    ["-5", "Infinity", "-0"],
    ["Infinity", "Infinity", "NaN"],
    ["Infinity", "5", "Infinity"],
    ["NaN", "1", "NaN"],
  ] as const)("divide(%j, %j) === %j", (a, b, expected) => {
    expect(divide(a, b)).toBe(expected);
  });

  it("supports rounding options", () => {
    expect(divide("1", "3", { maximumFractionDigits: 4 })).toBe("0.3333");
    expect(divide("2", "3", { maximumFractionDigits: 4, roundingMode: "trunc" })).toBe("0.6666");
  });

  it("div is an alias", () => {
    expect(div).toBe(divide);
  });
});
