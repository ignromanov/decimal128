import type { Dec } from "@/internal/types";

/**
 * Emit THE canonical string. Plain decimal notation when the adjusted
 * exponent E is in [-6, 33] (i.e. 10^-6 ≤ |v| < 10^34), else exponential.
 */
export function encode(d: Dec): string {
  switch (d.kind) {
    case "nan":
      return "NaN";
    case "inf":
      return d.sign === 1 ? "Infinity" : "-Infinity";
    case "zero":
      return d.sign === 1 ? "0" : "-0";
    case "finite": {
      const digits = d.coefficient.toString();
      const E = d.exponent + digits.length - 1;
      const sign = d.sign === -1 ? "-" : "";
      if (E >= -6 && E <= 33) {
        if (d.exponent >= 0) return sign + digits + "0".repeat(d.exponent);
        const point = digits.length + d.exponent;
        if (point > 0) return sign + digits.slice(0, point) + "." + digits.slice(point);
        return sign + "0." + "0".repeat(-point) + digits;
      }
      const mantissa = digits.length === 1 ? digits : digits[0] + "." + digits.slice(1);
      return sign + mantissa + "e" + (E >= 0 ? "+" + E : String(E));
    }
  }
}
