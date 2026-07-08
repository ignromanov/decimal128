import { Numeric } from "../decimal";
import { DecimalError, formatValue } from "../errors";
import { toDec } from "../internal/args";
import { encode } from "../internal/canonical";
import { digitCount } from "../internal/coefficient";
import { DEFAULT_ROUNDING, roundCoefficient } from "../internal/round";
import type { Dec } from "../internal/types";

function render(sign: string, digits: string, E: number, fractionDigits: number | undefined): string {
  const padded = fractionDigits === undefined ? digits : digits.padEnd(fractionDigits + 1, "0");
  const mantissa = padded.length === 1 ? padded : padded[0] + "." + padded.slice(1);
  return sign + mantissa + "e" + (E >= 0 ? "+" + E : String(E));
}

export function toExponential(value: Numeric, fractionDigits?: number): string {
  if (fractionDigits !== undefined && (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 100)) {
    throw new DecimalError(`toExponential fractionDigits must be an integer in [0, 100], got ${formatValue(fractionDigits)}`, "INVALID_OPTION");
  }
  const d: Dec = toDec(value);
  if (d.kind === "nan" || d.kind === "inf") return encode(d);
  const sign = d.sign === -1 ? "-" : "";
  if (d.kind === "zero") return render(sign, "0", 0, fractionDigits);
  let coeff = d.coefficient;
  let E = d.exponent + digitCount(coeff) - 1;
  if (fractionDigits !== undefined) {
    const keep = fractionDigits + 1;
    const drop = digitCount(coeff) - keep;
    if (drop > 0) {
      coeff = roundCoefficient(coeff, drop, d.sign, DEFAULT_ROUNDING);
      if (digitCount(coeff) > keep) E += 1; // carry: 99…9 → 100…0
      coeff = BigInt(coeff.toString().slice(0, keep)); // trim carry zeros to `keep` digits
    }
  }
  return render(sign, coeff.toString(), E, fractionDigits);
}
