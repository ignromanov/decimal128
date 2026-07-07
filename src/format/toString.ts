import { Numeric } from "@/decimal";
import { toDec } from "@/internal/args";
import { encode } from "@/internal/canonical";

/** Canonical string form (identical to `from`, but typed as plain string). */
export function toString(value: Numeric): string {
  return encode(toDec(value));
}
