import { Numeric } from "@/decimal";
import { toDec } from "@/internal/args";
import { digitCount, pow10 } from "@/internal/coefficient";
import type { Dec, FiniteDec, NanDec } from "@/internal/types";

function cmpBigint(a: bigint, b: bigint): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

function cmpFinite(a: FiniteDec, b: FiniteDec): -1 | 0 | 1 {
  if (a.sign !== b.sign) return a.sign;
  // Same sign: compare adjusted exponents first to avoid giant alignments.
  const ea = a.exponent + digitCount(a.coefficient) - 1;
  const eb = b.exponent + digitCount(b.coefficient) - 1;
  if (ea !== eb) return (ea < eb ? -1 : 1) * a.sign as -1 | 1;
  // Equal magnitude class: exponent gap ≤ 33, alignment is cheap.
  const m = Math.min(a.exponent, b.exponent);
  const va = a.coefficient * pow10(a.exponent - m);
  const vb = b.coefficient * pow10(b.exponent - m);
  return (cmpBigint(va, vb) * a.sign) as -1 | 0 | 1;
}

/** IEEE partial order; "nan" when at least one operand is NaN. */
export function compareDec(a: Dec, b: Dec): -1 | 0 | 1 | "nan" {
  if (a.kind === "nan" || b.kind === "nan") return "nan";
  const rank = (d: Exclude<Dec, NanDec>): -1 | 0 | 1 => (d.kind === "zero" ? 0 : d.sign);
  if (a.kind === "inf" || b.kind === "inf") {
    const ra = a.kind === "inf" ? a.sign * 2 : rank(a);
    const rb = b.kind === "inf" ? b.sign * 2 : rank(b);
    return ra === rb ? 0 : ra < rb ? -1 : 1;
  }
  if (a.kind === "zero" || b.kind === "zero") {
    const ra = rank(a);
    const rb = rank(b);
    return ra === rb ? 0 : ra < rb ? -1 : 1;
  }
  return cmpFinite(a, b);
}

/**
 * Total order for Array.sort: NaN compares equal to NaN and greater than
 * every non-NaN value. Deliberate, documented divergence from `equals`.
 */
export function compare(a: Numeric, b: Numeric): -1 | 0 | 1 {
  const c = compareDec(toDec(a), toDec(b));
  if (c !== "nan") return c;
  const aNan = toDec(a).kind === "nan";
  const bNan = toDec(b).kind === "nan";
  return aNan && bNan ? 0 : aNan ? 1 : -1;
}

export const cmp = compare;
