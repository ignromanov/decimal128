import { Numeric } from "@/decimal";
import { toDec } from "@/internal/args";
import { encode } from "@/internal/canonical";

/** Escape hatch to binary64. May lose precision beyond ~15–17 digits. */
export function toNumber(value: Numeric): number {
  const d = toDec(value);
  if (d.kind === "zero") return d.sign === -1 ? -0 : 0; // Number("-0") is -0 anyway, but be explicit
  return Number(encode(d));
}
