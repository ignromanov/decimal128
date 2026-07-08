import { Decimal, Numeric } from "../decimal";
import { finish, toDec } from "../internal/args";
import type { RoundingOptions } from "../internal/args";
import { digitCount, pow10 } from "../internal/coefficient";
import { fitFinite, resolveMode, roundCoefficient } from "../internal/round";
import type { RoundingMode } from "../internal/round";
import { MAX_DIGITS, MIN_QUANTUM, NAN } from "../internal/types";
import type { Dec, Sign } from "../internal/types";

function divDec(a: Dec, b: Dec, mode: RoundingMode): Dec {
  if (a.kind === "nan" || b.kind === "nan") return NAN;
  const sign: Sign = a.sign === b.sign ? 1 : -1;
  if (a.kind === "inf") {
    if (b.kind === "inf") return NAN;
    return { kind: "inf", sign };
  }
  if (b.kind === "inf") return { kind: "zero", sign };
  if (b.kind === "zero") {
    if (a.kind === "zero") return NAN; // 0 / 0
    return { kind: "inf", sign };      // x / 0 — the signed-zero payoff
  }
  if (a.kind === "zero") return { kind: "zero", sign };
  // Scale the dividend so the integer quotient has ≥ 35 digits, then round once.
  const shift = digitCount(b.coefficient) - digitCount(a.coefficient) + MAX_DIGITS + 1;
  const scaled = a.coefficient * pow10(shift); // shift ≥ 2 given both coefficients ≤ 34 digits
  const q = scaled / b.coefficient;
  const r = scaled % b.coefficient;
  // Fuse BOTH rounding limits — 34-significant-digits AND the −6176 quantum floor —
  // into a single drop so fitFinite never rounds a second time (double rounding can
  // diverge from one correct rounding of the true quotient by 1 ULP at subnormals).
  const baseExp = a.exponent - b.exponent - shift; // exponent of q before any drop
  const drop = Math.max(digitCount(q) - MAX_DIGITS, MIN_QUANTUM - baseExp, 0);
  const rounded = roundCoefficient(q, drop, sign, mode, r !== 0n);
  return fitFinite(sign, rounded, baseExp + drop, mode);
}

export function divide(a: Numeric, b: Numeric, options?: RoundingOptions): Decimal {
  return finish(divDec(toDec(a), toDec(b), resolveMode(options)), options);
}

export const div = divide;
