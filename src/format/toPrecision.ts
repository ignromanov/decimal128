import { Numeric } from "../decimal";
import { DecimalError, formatValue } from "../errors";
import { toDec } from "../internal/args";
import { encode } from "../internal/canonical";
import { digitCount } from "../internal/coefficient";
import { DEFAULT_ROUNDING, roundCoefficient } from "../internal/round";
import { MAX_DIGITS } from "../internal/types";
import { toExponential } from "./toExponential";

export function toPrecision(value: Numeric, precision: number): string {
  if (!Number.isInteger(precision) || precision < 1 || precision > MAX_DIGITS) {
    throw new DecimalError(`toPrecision precision must be an integer in [1, 34], got ${formatValue(precision)}`, "INVALID_OPTION");
  }
  const d = toDec(value);
  if (d.kind === "nan" || d.kind === "inf") return encode(d);
  const sign = d.sign === -1 ? "-" : "";
  if (d.kind === "zero") {
    return precision === 1 ? sign + "0" : sign + "0." + "0".repeat(precision - 1);
  }
  let coeff = d.coefficient;
  let exp = d.exponent;
  const drop = digitCount(coeff) - precision;
  if (drop > 0) {
    coeff = roundCoefficient(coeff, drop, d.sign, DEFAULT_ROUNDING);
    exp += drop;
    if (digitCount(coeff) > precision) { coeff /= 10n; exp += 1; } // carry 99…9 → 10…0
  }
  const E = exp + digitCount(coeff) - 1;
  if (E < -6 || E >= precision) return toExponential(value, precision - 1);
  // Plain notation with trailing zeros preserved up to `precision` significant digits.
  const digits = coeff.toString().padEnd(precision, "0");
  const point = E + 1; // digits before the decimal point
  if (point >= digits.length) return sign + digits.padEnd(point, "0");
  if (point > 0) return sign + digits.slice(0, point) + "." + digits.slice(point);
  return sign + "0." + "0".repeat(-point) + digits;
}
