import type { Decimal, Numeric } from "../decimal";
import { finish, toDec } from "../internal/args";
import { negateDec } from "../internal/special";

export function negate(a: Numeric): Decimal {
  return finish(negateDec(toDec(a)));
}

export const neg = negate;
