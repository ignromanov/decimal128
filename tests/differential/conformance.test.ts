import { describe, expect, it } from "vitest";
// The polyfill's exported class is named `Decimal` (not `Decimal128` — confirmed by
// reading node_modules/proposal-decimal/src/Decimal.mjs, which has no `exports` map
// so `main: "src/Decimal.mjs"` is the real entry). Aliased to `Decimal128` here to
// avoid colliding with our own `Decimal` string-brand type and to match IEEE naming.
import { Decimal as Decimal128 } from "proposal-decimal";
import { add, divide, equals, isZero, multiply, remainder, round, subtract, toString } from "@/index";
import { mulberry32, randomDecimalString } from "~/differential/prng";

const CASES = 2000;
const rnd = mulberry32(0xdec1_4a11);

const pairs: Array<[string, string]> = [];
for (let i = 0; i < CASES; i++) {
  pairs.push([randomDecimalString(rnd), randomDecimalString(rnd)]);
}
// Directed edge cases the generator would rarely hit:
pairs.push(
  ["0", "-0"], ["-0", "-0"], ["1", "3"], ["2", "3"], ["1", "-0"],
  ["9999999999999999999999999999999999", "1"],
  ["1e6144", "10"], ["1e-6176", "3"], ["0.1", "0.2"],
  // Subnormal divide 1-ULP double-rounding boundary (see src/ops/divide.ts fix).
  ["1e-6142", "22"], ["2e-6142", "37"],
);

/** Reference result via the champion polyfill; "throw" if it rejects the op. */
function ref(op: (a: InstanceType<typeof Decimal128>, b: InstanceType<typeof Decimal128>) => unknown, a: string, b: string): string {
  try {
    return String(op(new Decimal128(a), new Decimal128(b)));
  } catch {
    return "throw";
  }
}

/**
 * Renormalize a polyfill numeric-string result through OUR OWN canonical toString.
 * Our spec deliberately uses a different plain-vs-exponential notation threshold than
 * this polyfill (ours: outside [10^-6, 10^34), documented in
 * docs/superpowers/specs/2026-07-07-big-decimal-decimal128-pivot-design.md:82,177;
 * the polyfill's toString() docstring says it mimics legacy JS Number.toString()
 * thresholds, exponent >= 21 or <= -7). Re-threading the value through our own
 * toString keeps the comparison about VALUE correctness, not notation choice —
 * the notation threshold itself is covered by our own format/toString unit tests.
 */
function refValue(op: (a: InstanceType<typeof Decimal128>, b: InstanceType<typeof Decimal128>) => unknown, a: string, b: string): string {
  const raw = ref(op, a, b);
  if (raw === "throw") return raw;
  return toString(raw);
}

// ---------------------------------------------------------------------------------
// Documented, hand-verified defects in proposal-decimal@20250613.0.0 (the champion
// polyfill this suite treats as ground truth). Each was confirmed two ways: (1) by
// reading its source at node_modules/proposal-decimal/src/Decimal.mjs, and (2) by
// independent exact-bigint derivation. Full derivations are in task-13-report.md.
// Skips are scoped as tightly as the underlying bug allows — never a blanket skip.
// ---------------------------------------------------------------------------------

/**
 * BUG A — subnormal magnitude is clamped to the emin floor (-6143) instead of the true
 * quantum floor (-6176). Reproducible independent of any op under test here:
 * `new Decimal("1e-6144").toString()` returns "1e-6143" (10x too large), and
 * `new Decimal("1e-6160").toString()` ALSO returns "1e-6143" (should stay exact at
 * "1e-6160" — a single digit at exponent -6160 needs no rounding at all). Affects any
 * op whose operand or true result has adjusted exponent < -6143. This is a small, fixed,
 * known set (our PRNG's exponents are [-50,50] and never reach anywhere near here).
 */
const SUBNORMAL_PAIRS = new Set(["1e-6176|3", "1e-6142|22", "2e-6142|37"]);
const SUBNORMAL_VALUES = new Set(["1e-6176"]);

/**
 * BUG B — add()'s `if (this.isZero()) return x.clone();` fast path, and divide()'s
 * `if (x.isZero()) return new Decimal(NAN);` / `if (this.isZero()) return this.clone();`
 * fast paths, ignore the SIGN of the OTHER operand. So 0 + (-0) wrongly returns "-0"
 * (IEEE754: sum of opposite-signed zeros is +0 under halfEven, the default here);
 * nonzero/±0 wrongly returns NaN (IEEE754: signed Infinity); and 0/(-x) wrongly keeps
 * the dividend's own sign instead of XOR-ing with the divisor's sign. Scoped to pairs
 * where at least one operand is zero, which is where all these fast paths trigger.
 */
function hasZeroSignBug(a: string, b: string): boolean {
  return isZero(a) || isZero(b);
}

function significantDigitCount(s: string): number {
  const mantissa = s.split(/[eE]/)[0].replace("-", "").replace(".", "").replace(/^0+/, "");
  return mantissa.length || 1;
}

/**
 * BUG C — remainder() is implemented as `divide(d).round(0, trunc)` then
 * `subtract(d.multiply(q))`, both ORDINARY (34-significant-digit-rounded) Decimal128
 * operations. Per the General Decimal Arithmetic Specification, remainder's final
 * (dividend - q*divisor) step must be computed EXACTLY whenever q's coefficient fits
 * in <= precision (34) digits. This polyfill doesn't: whenever q*divisor needs more
 * than 34 significant digits, its intermediate multiply() silently rounds, corrupting
 * (sometimes zeroing out) low-order digits of the "remainder". Hand-verified via exact
 * bigint modulo for a representative pair — see task-13-report.md. Empirically this hits
 * 968 of 2011 pairs in this exact dataset (48%), so a per-pair skip list is impractical;
 * this predicate uses our own `divide`/`round` — already exhaustively differentially
 * validated elsewhere in this file — purely as a measuring tool, not as the SUT.
 */
function remainderPrecisionUnreliable(a: string, b: string): boolean {
  if (isZero(b)) return false; // NaN case either way; not what this predicate is about.
  const q = round(divide(a, b), { maximumFractionDigits: 0, roundingMode: "trunc" });
  const qDigits = significantDigitCount(toString(q));
  const bDigits = significantDigitCount(toString(b));
  return qDigits + bDigits > 34;
}

describe(`differential vs proposal-decimal (${pairs.length} pairs, seed 0xdec14a11)`, () => {
  it("add matches", () => {
    for (const [a, b] of pairs) {
      if (hasZeroSignBug(a, b)) continue; // BUG B
      const expected = refValue((x, y) => x.add(y).toString(), a, b);
      if (expected === "throw") continue;
      expect(add(a, b), `add(${a}, ${b})`).toBe(expected);
    }
  });

  it("subtract matches", () => {
    for (const [a, b] of pairs) {
      const expected = refValue((x, y) => x.subtract(y).toString(), a, b);
      if (expected === "throw") continue;
      expect(subtract(a, b), `subtract(${a}, ${b})`).toBe(expected);
    }
  });

  it("multiply matches", () => {
    for (const [a, b] of pairs) {
      if (SUBNORMAL_PAIRS.has(`${a}|${b}`)) continue; // BUG A
      const expected = refValue((x, y) => x.multiply(y).toString(), a, b);
      if (expected === "throw") continue;
      expect(multiply(a, b), `multiply(${a}, ${b})`).toBe(expected);
    }
  });

  it("divide matches", () => {
    for (const [a, b] of pairs) {
      if (hasZeroSignBug(a, b) || SUBNORMAL_PAIRS.has(`${a}|${b}`)) continue; // BUG A, B
      const expected = refValue((x, y) => x.divide(y).toString(), a, b);
      if (expected === "throw") continue;
      expect(divide(a, b), `divide(${a}, ${b})`).toBe(expected);
    }
  });

  it("remainder matches", () => {
    for (const [a, b] of pairs) {
      if (SUBNORMAL_PAIRS.has(`${a}|${b}`) || remainderPrecisionUnreliable(a, b)) continue; // BUG A, C
      const expected = refValue((x, y) => x.remainder(y).toString(), a, b);
      if (expected === "throw") continue;
      expect(remainder(a, b), `remainder(${a}, ${b})`).toBe(expected);
    }
  });

  it("toString canonicalization matches", () => {
    for (const [a] of pairs) {
      if (SUBNORMAL_VALUES.has(a)) continue; // BUG A
      const expected = refValue((x) => x.toString(), a, a);
      if (expected === "throw") continue;
      expect(toString(a), `toString(${a})`).toBe(expected);
    }
  });

  it("equals matches (finite values)", () => {
    for (const [a, b] of pairs) {
      const expected = ref((x, y) => x.equals(y), a, b);
      if (expected === "throw") continue;
      expect(String(equals(a, b)), `equals(${a}, ${b})`).toBe(expected);
    }
  });
});
