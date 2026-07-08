import type { Decimal } from "../decimal";
import { DecimalError, formatValue } from "../errors";
import { encode } from "./canonical";
import { decode } from "./parse";
import { DEFAULT_ROUNDING, ROUNDING_MODES, quantize } from "./round";
import type { RoundingMode } from "./round";
import type { Dec } from "./types";

export type RoundingOptions = {
  maximumFractionDigits?: number;
  roundingMode?: RoundingMode;
};

export function toDec(value: unknown): Dec {
  const d = decode(value);
  if (d === null) {
    throw new DecimalError(`Invalid Decimal input: ${formatValue(value)}`, "INVALID_INPUT");
  }
  return d;
}

export function resolveOptions(options?: RoundingOptions): {
  mode: RoundingMode;
  maxFractionDigits: number | undefined;
} {
  const mode = options?.roundingMode ?? DEFAULT_ROUNDING;
  if (!ROUNDING_MODES.includes(mode)) {
    throw new DecimalError(`Invalid roundingMode: ${formatValue(mode)}`, "INVALID_OPTION");
  }
  const maxFractionDigits = options?.maximumFractionDigits;
  if (
    maxFractionDigits !== undefined &&
    (!Number.isInteger(maxFractionDigits) || maxFractionDigits < 0 || maxFractionDigits > 6176)
  ) {
    throw new DecimalError(
      `Invalid maximumFractionDigits: ${formatValue(maxFractionDigits)}`,
      "INVALID_OPTION",
    );
  }
  return { mode, maxFractionDigits };
}

/** Apply options and emit the branded canonical string. */
export function finish(d: Dec, options?: RoundingOptions): Decimal {
  const { mode, maxFractionDigits } = resolveOptions(options);
  const out = maxFractionDigits === undefined ? d : quantize(d, maxFractionDigits, mode);
  return encode(out) as Decimal;
}
