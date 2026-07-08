import { describe, expect, it } from "vitest";
import { isDecimal } from "@/decimal";
import { DecimalError } from "@/errors";
import { from, tryFrom } from "@/from";

describe("from", () => {
  it.each([
    ["1.20", "1.2"],
    [" 42 ", "42"],
    ["-0", "-0"],
    [0.1, "0.1"],
    [2n, "2"],
    ["NaN", "NaN"],
    ["-Infinity", "-Infinity"],
  ] as const)("from(%s) === %j", (input, expected) => {
    expect(from(input)).toBe(expected);
  });

  it.each(["", "abc", "1..2", null, undefined, {}, true])("throws INVALID_INPUT on %j", (bad) => {
    expect(() => from(bad as never)).toThrowError(DecimalError);
    try {
      from(bad as never);
    } catch (e) {
      expect((e as DecimalError).code).toBe("INVALID_INPUT");
    }
  });
});

describe("tryFrom", () => {
  it("returns ok on valid input", () => {
    expect(tryFrom("1.5")).toEqual({ ok: true, value: "1.5" });
  });
  it("returns the error without throwing", () => {
    const r = tryFrom("abc");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("INVALID_INPUT");
  });
});

describe("isDecimal", () => {
  it.each(["1.5", "0", "-0", "NaN", "Infinity", "1.23e+40"])("accepts canonical %j", (s) => {
    expect(isDecimal(s)).toBe(true);
  });
  it.each(["1.50", "+1", " 1", "1e1", "01", 1.5, null, "1E+40"])("rejects non-canonical %j", (s) => {
    expect(isDecimal(s)).toBe(false);
  });
});
