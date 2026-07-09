import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Decimal } from "@/index";
import { from, isDecimal, isFinite as isFiniteDec, isZero } from "@/index";
import { anyDecimal, FINITE_EDGES, finiteDecimal, nonZeroFiniteDecimal } from "./arbitraries";

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
    // The hand-authored corpus already contains 1e-6176 and max-normal, so asserting over the
    // whole sample would pass even if broadFinite's quantum range were narrowed to [-100, 100].
    // Exclude the corpus and demand extreme exponents from the random branch alone.
    const corpus = new Set<string>(FINITE_EDGES.map((s) => from(s)));
    const generated = fc
      .sample(finiteDecimal, { seed: 7, numRuns: 2000 })
      .filter((x) => !corpus.has(x));
    expect(generated.some((x) => /e-[1-9]\d{3}$/.test(x))).toBe(true);
    expect(generated.some((x) => /e\+[1-9]\d{3}$/.test(x))).toBe(true);
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
