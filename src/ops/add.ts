import { Decimal, Numeric } from "../decimal";
import { finish, toDec } from "../internal/args";
import type { RoundingOptions } from "../internal/args";
import { pow10 } from "../internal/coefficient";
import { fitFinite, resolveMode } from "../internal/round"; // resolveMode added below
import type { RoundingMode } from "../internal/round";
import { NAN } from "../internal/types";
import type { Dec, Sign } from "../internal/types";

export function addDec(a: Dec, b: Dec, mode: RoundingMode): Dec {
  if (a.kind === "nan" || b.kind === "nan") return NAN;
  if (a.kind === "inf") {
    if (b.kind === "inf" && b.sign !== a.sign) return NAN;
    return a;
  }
  if (b.kind === "inf") return b;
  if (a.kind === "zero" && b.kind === "zero") {
    // IEEE: like signs keep the sign; unlike signs give +0 except under floor.
    const sign: Sign = a.sign === b.sign ? a.sign : mode === "floor" ? -1 : 1;
    return { kind: "zero", sign };
  }
  if (a.kind === "zero") return b;
  if (b.kind === "zero") return a;
  const m = Math.min(a.exponent, b.exponent);
  const va = BigInt(a.sign) * a.coefficient * pow10(a.exponent - m);
  const vb = BigInt(b.sign) * b.coefficient * pow10(b.exponent - m);
  const sum = va + vb;
  if (sum === 0n) return { kind: "zero", sign: mode === "floor" ? -1 : 1 };
  const sign: Sign = sum < 0n ? -1 : 1;
  return fitFinite(sign, sum < 0n ? -sum : sum, m, mode);
}

export function add(a: Numeric, b: Numeric, options?: RoundingOptions): Decimal {
  return finish(addDec(toDec(a), toDec(b), resolveMode(options)), options);
}
