import { Numeric } from "../decimal";
import { toDec } from "../internal/args";
import { compareDec } from "./compare";

/** IEEE equality: NaN ≠ NaN, and -0 equals 0. */
export function equals(a: Numeric, b: Numeric): boolean {
  return compareDec(toDec(a), toDec(b)) === 0;
}

export const eq = equals;
