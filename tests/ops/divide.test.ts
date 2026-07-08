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

  describe("subnormal boundary — single rounding (no double-round drift)", () => {
    // True quotient 10^34/22 = 454545454545454545454545454545454 rem 12/22.
    // 2*12=24 > 22, so the true value rounds UP at the last representable digit
    // (quantum exponent -6176, the MIN_QUANTUM floor). Rounding the 35-digit
    // scaled quotient to 34 digits FIRST, then again at the -6176 floor, loses
    // that carry and yields the wrong ...454 instead of the correct ...455.
    it("divide('1e-6142', '22') rounds once at the quantum floor", () => {
      expect(divide("1e-6142", "22")).toBe("4.54545454545454545454545454545455e-6144");
    });

    // True quotient 2*10^34/37 = 540540540540540540540540540540540 rem 20/37.
    // 2*20=40 > 37, so it also rounds UP: correct last digit is 1, not 0.
    it("divide('2e-6142', '37') rounds once at the quantum floor", () => {
      expect(divide("2e-6142", "37")).toBe("5.40540540540540540540540540540541e-6144");
    });
  });
});
