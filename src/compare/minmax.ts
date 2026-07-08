import type { Decimal, Numeric } from "../decimal";
import { DecimalError } from "../errors";
import { finish, toDec } from "../internal/args";
import { NAN } from "../internal/types";
import type { Dec } from "../internal/types";
import { compareDec } from "./compare";

function extreme(values: Numeric[], keepLeft: -1 | 1, name: string): Decimal {
  if (values.length === 0) {
    throw new DecimalError(`${name}() requires at least one argument`, "INVALID_INPUT");
  }
  let best: Dec | null = null;
  for (const v of values) {
    const d = toDec(v);
    if (d.kind === "nan") return finish(NAN);
    if (best === null || compareDec(d, best) === keepLeft) best = d;
  }
  return finish(best!);
}

export function min(...values: Numeric[]): Decimal {
  return extreme(values, -1, "min");
}
export function max(...values: Numeric[]): Decimal {
  return extreme(values, 1, "max");
}
