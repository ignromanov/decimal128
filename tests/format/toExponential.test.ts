import { describe, expect, it } from "vitest";
import { toExponential } from "@/format/toExponential";

describe("toExponential", () => {
  it.each([
    ["123.45", undefined, "1.2345e+2"],
    ["123.45", 1, "1.2e+2"],
    ["123.45", 6, "1.234500e+2"],
    ["0.5", 0, "5e-1"],
    ["-0", 2, "-0.00e+0"],
    ["0", undefined, "0e+0"],
    ["NaN", 2, "NaN"],
  ] as const)("toExponential(%j, %s) === %j", (v, fd, expected) => {
    expect(toExponential(v, fd)).toBe(expected);
  });
});
