import { Decimal, Numeric } from "@/decimal";
import { finish, toDec } from "@/internal/args";
import type { RoundingOptions } from "@/internal/args";
import type { RoundingMode } from "@/internal/round";

export type { RoundingMode, RoundingOptions };

/** Round a value; without options rounds to an integer under halfEven. */
export function round(value: Numeric, options?: RoundingOptions): Decimal {
  return finish(toDec(value), { maximumFractionDigits: 0, ...options });
}
