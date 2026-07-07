import { describe, expect, it } from "vitest";
import { round } from "@/round";

describe("round", () => {
  it.each([
    ["2.5", undefined, "2"],           // default: integer, halfEven
    ["3.5", undefined, "4"],
    ["-2.5", undefined, "-2"],
    ["2.5", { roundingMode: "halfExpand" }, "3"],
    ["2.4", { roundingMode: "ceil" }, "3"],
    ["-2.4", { roundingMode: "ceil" }, "-2"],
    ["1.2345", { maximumFractionDigits: 2 }, "1.23"],
    ["1.2355", { maximumFractionDigits: 2 }, "1.24"],
    ["NaN", undefined, "NaN"],
    ["Infinity", undefined, "Infinity"],
    ["-0.4", undefined, "-0"],         // rounds to signed zero
  ] as const)("round(%j, %o) === %j", (v, opts, expected) => {
    expect(round(v, opts as never)).toBe(expected);
  });
});
