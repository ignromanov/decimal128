import type { Decimal, Numeric } from "../decimal";
import { finish, toDec } from "../internal/args";
import type { Dec } from "../internal/types";

export function abs(a: Numeric): Decimal {
  const d = toDec(a);
  const out: Dec = d.kind === "nan" ? d : { ...d, sign: 1 };
  return finish(out);
}
