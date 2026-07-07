import { describe, expect, it } from "vitest";
import { max, min } from "@/compare/minmax";
import { DecimalError } from "@/errors";

describe("min/max", () => {
  it("finds extremes across mixed input", () => {
    expect(min("3", 1, "2.5")).toBe("1");
    expect(max("3", 1, "2.5")).toBe("3");
  });

  it("propagates NaN", () => {
    expect(min("1", "NaN")).toBe("NaN");
    expect(max("NaN", "1")).toBe("NaN");
  });

  it("throws INVALID_INPUT on zero arguments", () => {
    expect(() => min()).toThrowError(DecimalError);
    expect(() => max()).toThrowError(DecimalError);
  });
});
