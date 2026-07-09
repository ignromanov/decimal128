/**
 * Value-level normalizer for decTest literals.
 *
 * Deliberately shares no code with `src/`. If this called `from()`, the known-answer
 * suite would use the system under test as its own oracle and an ingest bug at the
 * subnormal boundary would mask itself.
 *
 * decTest asserts two orthogonal properties per vector: the numeric value and the
 * resulting quantum (`1.0 + 1.0 -> 2.0`). Our Decimal has no cohorts, so we compare
 * values and drop quantum. See README "Intentional divergences".
 */

export type NormValue =
  | { kind: "nan" }
  | { kind: "inf"; sign: 1 | -1 }
  | { kind: "num"; sign: 1 | -1; coeff: bigint; exp: number };

// Deliberately narrow: bare NaN only. `sNaN`, payload-bearing NaN (`NaN123`) and `+NaN`
// are unparsable here on purpose — the runner's skip policy filters them out before this
// function ever sees them. Widening this to swallow `sNaN` would normalize a signalling
// NaN into a quiet one, so a `-> NaN Invalid_operation` vector would pass for the wrong
// reason. The throw is a latch: if the skip policy ever drifts, the suite fails loudly
// instead of going quietly green.
const NAN_RE = /^-?nan$/i;
const INF_RE = /^([+-]?)inf(?:inity)?$/i;
const NUM_RE = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;

export function normalizeLiteral(raw: string): NormValue {
  const s = raw.trim();
  if (NAN_RE.test(s)) return { kind: "nan" };

  const inf = INF_RE.exec(s);
  if (inf) return { kind: "inf", sign: inf[1] === "-" ? -1 : 1 };

  const m = NUM_RE.exec(s);
  const intPart = m?.[2] ?? "";
  const fracPart = m?.[3] ?? "";
  if (!m || (intPart === "" && fracPart === "")) {
    throw new Error(`unparsable decTest literal: ${raw}`);
  }

  const sign: 1 | -1 = m[1] === "-" ? -1 : 1;
  let coeff = BigInt(intPart + fracPart);
  let exp = (m[4] ? Number(m[4]) : 0) - fracPart.length;

  // Strip trailing zeros: cohort members collapse to a single value.
  while (coeff !== 0n && coeff % 10n === 0n) {
    coeff /= 10n;
    exp += 1;
  }
  if (coeff === 0n) exp = 0;

  return { kind: "num", sign, coeff, exp };
}

export function sameValue(a: NormValue, b: NormValue): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "nan") return true;
  if (a.kind === "inf") return a.sign === (b as Extract<NormValue, { kind: "inf" }>).sign;
  const other = b as Extract<NormValue, { kind: "num" }>;
  return a.sign === other.sign && a.coeff === other.coeff && a.exp === other.exp;
}

/** Adapt a decTest operand to a form `from()` accepts: `Inf` → `Infinity`, drop `+`. */
export function toOperandInput(raw: string): string {
  const s = raw.trim();
  const inf = INF_RE.exec(s);
  if (inf) return inf[1] === "-" ? "-Infinity" : "Infinity";
  return s.startsWith("+") ? s.slice(1) : s;
}
