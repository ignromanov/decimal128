import type { Decimal, Numeric } from "../decimal";
import { finish, toDec } from "../internal/args";
import type { RoundingOptions } from "../internal/args";
import { fitFinite, resolveMode } from "../internal/round";
import type { RoundingMode } from "../internal/round";
import { NAN } from "../internal/types";
import type { Dec, Sign } from "../internal/types";

export function mulDec(a: Dec, b: Dec, mode: RoundingMode): Dec {
  if (a.kind === "nan" || b.kind === "nan") return NAN;
  const sign: Sign = a.sign === b.sign ? 1 : -1;
  if (a.kind === "inf" || b.kind === "inf") {
    if (a.kind === "zero" || b.kind === "zero") return NAN; // 0 × ∞
    return { kind: "inf", sign };
  }
  if (a.kind === "zero" || b.kind === "zero") return { kind: "zero", sign };
  return fitFinite(sign, a.coefficient * b.coefficient, a.exponent + b.exponent, mode);
}

export function multiply(a: Numeric, b: Numeric, options?: RoundingOptions): Decimal {
  return finish(mulDec(toDec(a), toDec(b), resolveMode(options)), options);
}

export const mul = multiply;
