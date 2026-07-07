import { Decimal, Numeric } from "@/decimal";
import { DecimalError, Result } from "@/errors";
import { finish, toDec } from "@/internal/args";

/** Parse and canonicalize any Numeric input. Throws DecimalError on invalid input. */
export function from(value: Numeric): Decimal {
  return finish(toDec(value));
}

/** Like `from`, but never throws. */
export function tryFrom(value: Numeric): Result<Decimal> {
  try {
    return { ok: true, value: from(value) };
  } catch (error) {
    if (error instanceof DecimalError) return { ok: false, error };
    throw error;
  }
}
