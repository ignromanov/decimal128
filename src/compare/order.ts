import { Numeric } from "@/decimal";
import { toDec } from "@/internal/args";
import { compareDec } from "@/compare/compare";

export function lessThan(a: Numeric, b: Numeric): boolean {
  return compareDec(toDec(a), toDec(b)) === -1;
}
export function lessThanOrEqual(a: Numeric, b: Numeric): boolean {
  const c = compareDec(toDec(a), toDec(b));
  return c === -1 || c === 0;
}
export function greaterThan(a: Numeric, b: Numeric): boolean {
  return compareDec(toDec(a), toDec(b)) === 1;
}
export function greaterThanOrEqual(a: Numeric, b: Numeric): boolean {
  const c = compareDec(toDec(a), toDec(b));
  return c === 1 || c === 0;
}

export const lt = lessThan;
export const lte = lessThanOrEqual;
export const gt = greaterThan;
export const gte = greaterThanOrEqual;
