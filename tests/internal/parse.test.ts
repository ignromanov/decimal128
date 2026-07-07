import { describe, expect, it } from "vitest";
import { decode } from "@/internal/parse";

const fin = (sign: 1 | -1, coefficient: bigint, exponent: number) =>
  ({ kind: "finite", sign, coefficient, exponent }) as const;

describe("decode: strings", () => {
  it.each([
    ["0", { kind: "zero", sign: 1 }],
    ["-0", { kind: "zero", sign: -1 }],
    ["0.00", { kind: "zero", sign: 1 }],
    ["1.5", fin(1, 15n, -1)],
    ["+1", fin(1, 1n, 0)],
    ["1.", fin(1, 1n, 0)],
    [".5", fin(1, 5n, -1)],
    ["-.5", fin(-1, 5n, -1)],
    ["007", fin(1, 7n, 0)],
    ["1.20", fin(1, 12n, -1)],          // trailing zero normalized away
    ["1E+10", fin(1, 1n, 10)],
    ["1.5e-3", fin(1, 15n, -4)],
    ["  42  ", fin(1, 42n, 0)],          // whitespace trimmed
    ["Infinity", { kind: "inf", sign: 1 }],
    ["+Infinity", { kind: "inf", sign: 1 }],
    ["-Infinity", { kind: "inf", sign: -1 }],
    ["NaN", { kind: "nan" }],
    ["-NaN", { kind: "nan" }],           // sign on NaN ignored
  ] as const)("decode(%j)", (input, expected) => {
    expect(decode(input)).toEqual(expected);
  });

  it.each(["", " ", ".", "+", "-", "1..2", "1.2.3", "e5", "1e", "0x10", "1_000", "1,5", "inf", "nan"])(
    "rejects %j",
    (input) => {
      expect(decode(input)).toBeNull();
    },
  );

  it("rounds >34-digit input on ingest (halfEven)", () => {
    const d35 = "1".padEnd(34, "0") + "5"; // 35 digits: 1000…005 = 10^34 + 5
    expect(decode(d35)).toEqual(fin(1, 1n, 34)); // halfEven rounds 10^34+5 → 10^34, canonical {1n,34}
  });

  it("parses huge exponents to Infinity / zero without blowing up", () => {
    expect(decode("1e999999999")).toEqual({ kind: "inf", sign: 1 });
    expect(decode("1e-999999999")).toEqual({ kind: "zero", sign: 1 });
  });
});

describe("decode: numbers", () => {
  it.each([
    [0.1, fin(1, 1n, -1)],                // shortest round-trip, NOT binary expansion
    [-1.5, fin(-1, 15n, -1)],
    [1e21, fin(1, 1n, 21)],               // String(1e21) === "1e+21"
    [123, fin(1, 123n, 0)],
    [Number.NaN, { kind: "nan" }],
    [Number.POSITIVE_INFINITY, { kind: "inf", sign: 1 }],
    [Number.NEGATIVE_INFINITY, { kind: "inf", sign: -1 }],
  ] as const)("decode(%s)", (input, expected) => {
    expect(decode(input)).toEqual(expected);
  });

  it("preserves the sign of -0", () => {
    expect(decode(-0)).toEqual({ kind: "zero", sign: -1 });
  });
});

describe("decode: bigints and garbage", () => {
  it("parses bigints exactly, rounding past 34 digits", () => {
    expect(decode(42n)).toEqual(fin(1, 42n, 0));
    expect(decode(-(10n ** 35n))).toEqual(fin(-1, 1n, 35));
  });

  it.each([null, undefined, {}, [], true, false, Symbol("x")])("rejects %s", (input) => {
    expect(decode(input)).toBeNull();
  });
});
