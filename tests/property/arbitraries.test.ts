import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Decimal } from "@/index";
import { isDecimal, isFinite as isFiniteDec, isZero } from "@/index";
import { anyDecimal, finiteDecimal, nonZeroFiniteDecimal } from "./arbitraries";

describe("decimal arbitraries", () => {
  it("only ever produces canonical Decimal values", () => {
    fc.assert(fc.property(anyDecimal, (x) => isDecimal(x)), { seed: 42, numRuns: 500 });
  });

  it("finiteDecimal never escapes to NaN or Infinity", () => {
    fc.assert(fc.property(finiteDecimal, (x) => isFiniteDec(x)), { seed: 42, numRuns: 500 });
  });

  it("nonZeroFiniteDecimal never produces zero", () => {
    fc.assert(fc.property(nonZeroFiniteDecimal, (x) => isFiniteDec(x) && !isZero(x)), { seed: 42, numRuns: 500 });
  });

  it("reaches the subnormal and emax boundaries the differential PRNG cannot", () => {
    const sample = fc.sample(anyDecimal, { seed: 7, numRuns: 2000 });
    expect(sample.some((x) => x.includes("e-617"))).toBe(true);
    expect(sample.some((x) => x.includes("e+614"))).toBe(true);
  });

  it("shrinks a counterexample down to a minimal value", () => {
    // tuple().map() keeps shrinking clean; .chain()/.filter() would leave a 40-digit monster.
    const result = fc.check(
      fc.property<[Decimal]>(finiteDecimal, () => false),
      { seed: 11 },
    );
    expect(result.failed).toBe(true);
    expect(result.counterexample?.[0].length).toBeLessThanOrEqual(4);
  });
});
