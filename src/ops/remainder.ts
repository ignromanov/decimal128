import { Decimal, Numeric } from "@/decimal";
import { finish, toDec } from "@/internal/args";
import type { RoundingOptions } from "@/internal/args";
import { pow10 } from "@/internal/coefficient";
import { fitFinite, resolveMode } from "@/internal/round";
import type { RoundingMode } from "@/internal/round";
import { NAN } from "@/internal/types";
import type { Dec } from "@/internal/types";

function remDec(a: Dec, b: Dec, mode: RoundingMode): Dec {
  if (a.kind === "nan" || b.kind === "nan") return NAN;
  if (a.kind === "inf" || b.kind === "zero") return NAN;
  if (b.kind === "inf" || a.kind === "zero") return a;
  // Truncated (JS %) semantics on exactly aligned bigints; sign follows the dividend.
  const m = Math.min(a.exponent, b.exponent);
  const A = a.coefficient * pow10(a.exponent - m);
  const B = b.coefficient * pow10(b.exponent - m);
  const r = A % B;
  if (r === 0n) return { kind: "zero", sign: a.sign };
  return fitFinite(a.sign, r, m, mode);
}

export function remainder(a: Numeric, b: Numeric, options?: RoundingOptions): Decimal {
  return finish(remDec(toDec(a), toDec(b), resolveMode(options)), options);
}

export const mod = remainder;
