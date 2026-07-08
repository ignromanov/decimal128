import { describe, expect, it } from "vitest";
import { digitCount, pow10 } from "@/internal/coefficient";

describe("pow10", () => {
  it.each([
    [0, 1n],
    [1, 10n],
    [5, 100000n],
    [34, 10n ** 34n],
  ] as const)("pow10(%i) === %s", (n, expected) => {
    expect(pow10(n)).toBe(expected);
  });
});

describe("digitCount", () => {
  it.each([
    [1n, 1],
    [9n, 1],
    [10n, 2],
    [10n ** 34n - 1n, 34],
    [10n ** 34n, 35],
  ] as const)("digitCount(%s) === %i", (c, expected) => {
    expect(digitCount(c)).toBe(expected);
  });
});
