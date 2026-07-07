import { Numeric } from "@/decimal";
import { DecimalError, formatValue } from "@/errors";
import { toDec } from "@/internal/args";
import { encode } from "@/internal/canonical";
import { pow10 } from "@/internal/coefficient";
import { DEFAULT_ROUNDING, quantize } from "@/internal/round";

/** Exactly `digits` fraction digits, halfEven, always plain notation. */
export function toFixed(value: Numeric, digits: number): string {
  if (!Number.isInteger(digits) || digits < 0 || digits > 100) {
    throw new DecimalError(`toFixed digits must be an integer in [0, 100], got ${formatValue(digits)}`, "INVALID_OPTION");
  }
  const d = quantize(toDec(value), digits, DEFAULT_ROUNDING);
  if (d.kind === "nan" || d.kind === "inf") return encode(d);
  const sign = d.sign === -1 ? "-" : "";
  const scaled = d.kind === "zero" ? 0n : d.coefficient * pow10(d.exponent + digits);
  const s = scaled.toString();
  if (digits === 0) return sign + s;
  const intPart = s.length > digits ? s.slice(0, s.length - digits) : "0";
  const fracPart = s.padStart(digits, "0").slice(-digits);
  return sign + intPart + "." + fracPart;
}
