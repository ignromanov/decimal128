import { describe, expect, it } from "vitest";
import { toString } from "@/format/toString";

describe("toString", () => {
  it.each([
    ["1.20", "1.2"],
    [0.1, "0.1"],
    ["-0", "-0"],
    ["1e34", "1e+34"],
    ["0.0000005", "5e-7"],
    ["0.000005", "0.000005"],
    ["NaN", "NaN"],
  ] as const)("toString(%j) === %j", (v, expected) => {
    expect(toString(v)).toBe(expected);
  });
});
