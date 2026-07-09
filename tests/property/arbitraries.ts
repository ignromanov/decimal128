import fc from "fast-check";
import type { Decimal } from "@/index";
import { from, isZero } from "@/index";

const MAX_COEFF = 10n ** 34n - 1n;
const MIN_QUANTUM = -6176;
// A 34-digit coefficient at quantum q has adjusted exponent q + 33.
// 6111 + 33 = 6144 = emax, so every generated value is finite by construction.
const MAX_QUANTUM = 6111;

const MAX_NORMAL = "9.999999999999999999999999999999999e+6144";

/**
 * Hand-authored corpus of the values that actually break decimal implementations.
 * The differential suite's PRNG draws exponents from [-50, 50] and structurally
 * cannot reach any of these.
 */
export const FINITE_EDGES = [
  "0",
  "-0",
  "1",
  "-1",
  "0.5",
  "1.5",
  "2.5",
  "-2.5",
  "1e-6176", // smallest subnormal
  "-1e-6176",
  "5e-6177", // exact tie below the smallest quantum
  "-5e-6177",
  "1.5e-6176",
  "9.999999999999999999999999999999999e-6143", // largest subnormal-adjacent normal
  MAX_NORMAL,
  `-${MAX_NORMAL}`,
  "1e34",
  "9999999999999999999999999999999999", // 34 nines
] as const;

// "5e-6177" and its negation are exact ties below the smallest quantum: from() rounds
// them half-even to ±0. A textual filter on "0"/"-0" would let those zeros through.
const NON_ZERO_EDGES = FINITE_EDGES.filter((s) => !isZero(from(s)));

const SPECIAL_EDGES = ["NaN", "Infinity", "-Infinity"] as const;

/**
 * Built with tuple().map() only. `.chain()` shrinks its chained output poorly and
 * `.filter()` degrades shrink efficiency; generating in-range by construction keeps
 * failures minimizing to `5e-6177` rather than a 40-digit monster.
 */
function broadFinite(minCoeff: bigint): fc.Arbitrary<Decimal> {
  return fc
    .tuple(
      fc.boolean(),
      fc.bigInt({ min: minCoeff, max: MAX_COEFF }),
      fc.integer({ min: MIN_QUANTUM, max: MAX_QUANTUM }),
    )
    .map(([negative, coeff, quantum]) => from(`${negative ? "-" : ""}${coeff}e${quantum}`));
}

export const finiteDecimal: fc.Arbitrary<Decimal> = fc.oneof(
  { weight: 1, arbitrary: fc.constantFrom(...FINITE_EDGES).map((s) => from(s)) },
  { weight: 1, arbitrary: broadFinite(0n) },
);

export const nonZeroFiniteDecimal: fc.Arbitrary<Decimal> = fc.oneof(
  { weight: 1, arbitrary: fc.constantFrom(...NON_ZERO_EDGES).map((s) => from(s)) },
  { weight: 1, arbitrary: broadFinite(1n) },
);

export const anyDecimal: fc.Arbitrary<Decimal> = fc.oneof(
  { weight: 1, arbitrary: fc.constantFrom(...SPECIAL_EDGES).map((s) => from(s)) },
  { weight: 3, arbitrary: finiteDecimal },
);
