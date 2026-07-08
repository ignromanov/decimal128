import { describe, expect, it } from "vitest";
import { sub, subtract } from "@/ops/subtract";

describe("subtract", () => {
  it.each([
    ["0.3", "0.1", "0.2"],
    ["1", "1", "0"],
    ["0", "0", "0"],
    ["0", "-0", "0"],
    ["-0", "0", "-0"],
    ["Infinity", "Infinity", "NaN"],
    ["1", "NaN", "NaN"],
  ] as const)("subtract(%j, %j) === %j", (a, b, expected) => {
    expect(subtract(a, b)).toBe(expected);
  });

  it("sub is an alias", () => {
    expect(sub).toBe(subtract);
  });
});
