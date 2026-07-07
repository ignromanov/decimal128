import { digitCount, pow10 } from "@/internal/coefficient";
import { MAX_COEFF, MAX_DIGITS, MAX_EXP, MIN_QUANTUM } from "@/internal/types";
import type { Dec, Sign } from "@/internal/types";

export type RoundingMode = "ceil" | "floor" | "trunc" | "halfExpand" | "halfEven";
export const DEFAULT_ROUNDING: RoundingMode = "halfEven";

export const ROUNDING_MODES: readonly RoundingMode[] = [
  "ceil", "floor", "trunc", "halfExpand", "halfEven",
];

export function roundCoefficient(
  coeff: bigint,
  drop: number,
  sign: Sign,
  mode: RoundingMode,
  sticky = false,
): bigint {
  if (drop <= 0) return coeff;
  const digits = digitCount(coeff);
  if (drop > digits) {
    // Entire coefficient is discarded and the halves can never be reached:
    // 2·coeff < 2·10^digits ≤ 10^drop. Only away-from-zero directed modes round up.
    const up = (mode === "ceil" && sign === 1) || (mode === "floor" && sign === -1);
    return up ? 1n : 0n;
  }
  const divisor = pow10(drop);
  const head = coeff / divisor;
  const rem = coeff % divisor;
  if (rem === 0n && !sticky) return head;
  switch (mode) {
    case "trunc":
      return head;
    case "ceil":
      return sign === 1 ? head + 1n : head;
    case "floor":
      return sign === -1 ? head + 1n : head;
    case "halfExpand":
    case "halfEven": {
      const twice = rem * 2n;
      if (twice > divisor) return head + 1n;
      if (twice < divisor) return head;
      // Exactly half at this scale…
      if (sticky) return head + 1n; // …but the true value sits above the half.
      if (mode === "halfExpand") return head + 1n;
      return head % 2n === 0n ? head : head + 1n;
    }
  }
}

function stripTrailingZeros(coeff: bigint, exp: number): [bigint, number] {
  while (coeff % 10n === 0n) {
    coeff /= 10n;
    exp += 1;
  }
  return [coeff, exp];
}

/**
 * Normalize an exact (sign, coefficient, exponent) triple into a canonical Dec:
 * one combined rounding for the 34-digit and −6176-quantum limits, then
 * overflow handling. This is the single rounding choke point for all ops.
 */
export function fitFinite(sign: Sign, coeff: bigint, exp: number, mode: RoundingMode): Dec {
  if (coeff === 0n) return { kind: "zero", sign };
  [coeff, exp] = stripTrailingZeros(coeff, exp);
  const digits = digitCount(coeff);
  const drop = Math.max(digits - MAX_DIGITS, MIN_QUANTUM - exp, 0);
  if (drop > 0) {
    coeff = roundCoefficient(coeff, drop, sign, mode);
    exp += drop;
    if (coeff === 0n) return { kind: "zero", sign };
    [coeff, exp] = stripTrailingZeros(coeff, exp); // also collapses 999…9 carry to 1n
  }
  if (exp + digitCount(coeff) - 1 > MAX_EXP) {
    const towardZero =
      mode === "trunc" ||
      (mode === "floor" && sign === 1) ||
      (mode === "ceil" && sign === -1);
    return towardZero
      ? { kind: "finite", sign, coefficient: MAX_COEFF, exponent: MAX_EXP - MAX_DIGITS + 1 }
      : { kind: "inf", sign };
  }
  return { kind: "finite", sign, coefficient: coeff, exponent: exp };
}

/** Round a Dec so it has at most `maxFractionDigits` digits after the point. */
export function quantize(d: Dec, maxFractionDigits: number, mode: RoundingMode): Dec {
  if (d.kind !== "finite") return d;
  const targetExp = -maxFractionDigits;
  if (d.exponent >= targetExp) return d;
  const drop = targetExp - d.exponent;
  const coeff = roundCoefficient(d.coefficient, drop, d.sign, mode);
  return fitFinite(d.sign, coeff, targetExp, mode);
}
