import { describe, expect, it } from "vitest";
import { DecimalError } from "@/index";
import { add } from "@/ops/add";

describe("add: finite", () => {
  it.each([
    ["0.1", "0.2", "0.3"],
    ["1.5", "2", "3.5"],
    ["1.03", "-0.42", "0.61"],
    ["1e34", "1", "1e+34"],                    // 1 is beyond 34 significant digits → absorbed
    ["9999999999999999999999999999999999", "1", "1e+34"], // 34 nines + 1 → carry
  ] as const)("add(%j, %j) === %j", (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });

  it("accepts mixed Numeric input", () => {
    expect(add("1.5", 2n)).toBe("3.5");
    expect(add(0.25, "0.75")).toBe("1");
  });

  it("honors maximumFractionDigits + roundingMode", () => {
    expect(add("1.005", "0", { maximumFractionDigits: 2 })).toBe("1"); // 1.005 → tie → even 1.00
    expect(add("1.005", "0", { maximumFractionDigits: 2, roundingMode: "halfExpand" })).toBe("1.01");
    expect(add("1.005", "0", { maximumFractionDigits: 2, roundingMode: "trunc" })).toBe("1");
  });

  it("throws DecimalError (not a raw TypeError) for an invalid roundingMode", () => {
    // 34-nines + 0.5 forces rounding, so the invalid mode reaches roundCoefficient's compute path
    expect(() =>
      add("9999999999999999999999999999999999", "0.5", { roundingMode: "bogus" as any }),
    ).toThrow(DecimalError);
  });
});

describe("add: specials and zeros", () => {
  it.each([
    ["NaN", "1", "NaN"],
    ["Infinity", "1", "Infinity"],
    ["Infinity", "-Infinity", "NaN"],
    ["-Infinity", "-Infinity", "-Infinity"],
    ["-0", "-0", "-0"],
    ["-0", "0", "0"],
    ["5", "-5", "0"],
    ["-0", "1", "1"],
  ] as const)("add(%j, %j) === %j", (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });

  it("floor mode makes exact cancellation negative zero (IEEE)", () => {
    expect(add("5", "-5", { roundingMode: "floor" })).toBe("-0");
  });
});
