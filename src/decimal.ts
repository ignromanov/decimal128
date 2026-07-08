import { encode } from "./internal/canonical";
import { decode } from "./internal/parse";

declare const decimalBrand: unique symbol;

/** A validated, canonical Decimal128 value in string form. */
export type Decimal = string & { readonly [decimalBrand]: "Decimal" };

/** Any input every operation accepts and normalizes internally. */
export type Numeric = string | number | bigint | Decimal;

/** True iff `value` is a string already in canonical Decimal form. */
export function isDecimal(value: unknown): value is Decimal {
  if (typeof value !== "string") return false;
  const d = decode(value);
  return d !== null && encode(d) === value;
}
