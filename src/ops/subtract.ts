import { Decimal, Numeric } from "@/decimal";
import { finish, toDec } from "@/internal/args";
import type { RoundingOptions } from "@/internal/args";
import { resolveMode } from "@/internal/round";
import { negateDec } from "@/internal/special";
import { addDec } from "@/ops/add";

export function subtract(a: Numeric, b: Numeric, options?: RoundingOptions): Decimal {
  return finish(addDec(toDec(a), negateDec(toDec(b)), resolveMode(options)), options);
}

export const sub = subtract;
