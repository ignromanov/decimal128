import { Numeric } from "./decimal";
import { toDec } from "./internal/args";

export function isNaN(v: Numeric): boolean {
  return toDec(v).kind === "nan";
}

export function isFinite(v: Numeric): boolean {
  const k = toDec(v).kind;
  return k === "finite" || k === "zero";
}

export function isZero(v: Numeric): boolean {
  return toDec(v).kind === "zero";
}

/** True for negative finite values, -0, and -Infinity; false for NaN. */
export function isNegative(v: Numeric): boolean {
  const d = toDec(v);
  return d.kind !== "nan" && d.sign === -1;
}
