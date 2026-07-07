import { DEFAULT_ROUNDING, fitFinite } from "@/internal/round";
import { NAN } from "@/internal/types";
import type { Dec, Sign } from "@/internal/types";

export type Numeric = string | number | bigint;

const SPECIAL_RE = /^([+-]?)(Infinity|NaN)$/;
// sign, then either "123", "123.", "123.45" (g2 int / g3 frac) or ".45" (g4), then optional exponent
const DECIMAL_RE = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;

function parseString(input: string): Dec | null {
  const s = input.trim();
  const special = SPECIAL_RE.exec(s);
  if (special) {
    if (special[2] === "NaN") return NAN; // sign on NaN is ignored
    return { kind: "inf", sign: special[1] === "-" ? -1 : 1 };
  }
  const m = DECIMAL_RE.exec(s);
  if (m === null) return null;
  const sign: Sign = m[1] === "-" ? -1 : 1;
  const intPart = m[2] ?? "";
  const fracPart = m[3] ?? m[4] ?? "";
  const expPart = m[5] === undefined ? 0 : Number.parseInt(m[5], 10);
  const digits = (intPart + fracPart).replace(/^0+(?=\d)/, "");
  return fitFinite(sign, BigInt(digits), expPart - fracPart.length, DEFAULT_ROUNDING);
}

export function decode(value: unknown): Dec | null {
  if (typeof value === "string") return parseString(value);
  if (typeof value === "number") {
    if (Number.isNaN(value)) return NAN;
    if (!Number.isFinite(value)) return { kind: "inf", sign: value > 0 ? 1 : -1 };
    if (Object.is(value, -0)) return { kind: "zero", sign: -1 }; // String(-0) loses the sign
    return parseString(String(value)); // shortest round-trip representation
  }
  if (typeof value === "bigint") {
    const sign: Sign = value < 0n ? -1 : 1;
    return fitFinite(sign, value < 0n ? -value : value, 0, DEFAULT_ROUNDING);
  }
  return null;
}
