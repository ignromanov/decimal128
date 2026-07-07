import { Decimal, Numeric } from "@/decimal";
import { DecimalError, formatValue } from "@/errors";
import { finish, toDec } from "@/internal/args";
import type { RoundingOptions } from "@/internal/args";
import { resolveMode } from "@/internal/round";
import type { Dec } from "@/internal/types";
import { mulDec } from "@/ops/multiply";

const ONE: Dec = { kind: "finite", sign: 1, coefficient: 1n, exponent: 0 };

/**
 * Integer power by square-and-multiply. Each intermediate product is rounded
 * to 34 digits, so results very close to a rounding boundary may differ from
 * a single exact rounding by 1 ulp — documented v1 limitation (pow is our
 * extension; the TC39 API has no pow).
 */
export function pow(base: Numeric, exponent: number, options?: RoundingOptions): Decimal {
  if (!Number.isInteger(exponent) || exponent < 0) {
    throw new DecimalError(
      `pow exponent must be a non-negative integer, got ${formatValue(exponent)}`,
      "INVALID_EXPONENT",
    );
  }
  const mode = resolveMode(options);
  let acc = ONE;
  let sq = toDec(base);
  let e = exponent;
  if (e === 0) return finish(ONE, options); // IEEE: pow(x, 0) === 1, even for NaN
  while (e > 0) {
    if (e % 2 === 1) acc = mulDec(acc, sq, mode);
    e = Math.floor(e / 2);
    if (e > 0) sq = mulDec(sq, sq, mode);
  }
  return finish(acc, options);
}
