import { describe, expect, it } from "vitest";
import { encode } from "@/internal/canonical";
import { decode } from "@/internal/parse";
import type { Dec } from "@/internal/types";

const fin = (sign: 1 | -1, coefficient: bigint, exponent: number): Dec =>
  ({ kind: "finite", sign, coefficient, exponent });

describe("encode", () => {
  it.each([
    [{ kind: "nan" }, "NaN"],
    [{ kind: "inf", sign: 1 }, "Infinity"],
    [{ kind: "inf", sign: -1 }, "-Infinity"],
    [{ kind: "zero", sign: 1 }, "0"],
    [{ kind: "zero", sign: -1 }, "-0"],
    [fin(1, 15n, -1), "1.5"],
    [fin(-1, 15n, -1), "-1.5"],
    [fin(1, 5n, -1), "0.5"],
    [fin(1, 5n, -7), "5e-7"],            // E = -7 → exponential
    [fin(1, 5n, -6), "0.000005"],        // E = -6 → plain
    [fin(1, 1n, 33), "1" + "0".repeat(33)],  // E = 33 → plain
    [fin(1, 1n, 34), "1e+34"],           // E = 34 → exponential
    [fin(1, 123n, 32), "1.23e+34"],
    [fin(1, 123n, -40), "1.23e-38"],
    [fin(1, 42n, 0), "42"],
    [fin(1, 12345n, -2), "123.45"],
  ] as const)("encode(%o) === %j", (d, expected) => {
    expect(encode(d as Dec)).toBe(expected);
  });

  it.each(["0", "-0", "1.5", "0.000005", "5e-7", "1e+34", "NaN", "Infinity", "-Infinity", "123.45"])(
    "round-trips %j through decode∘encode",
    (s) => {
      expect(encode(decode(s)!)).toBe(s);
    },
  );
});
