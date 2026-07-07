export type Sign = 1 | -1;

export type FiniteDec = {
  kind: "finite";
  sign: Sign;
  /** Positive, ≤34 digits, never ends in a zero digit (trailing zeros live in `exponent`). */
  coefficient: bigint;
  /** Quantum exponent: value = sign × coefficient × 10^exponent. */
  exponent: number;
};
export type ZeroDec = { kind: "zero"; sign: Sign };
export type InfDec = { kind: "inf"; sign: Sign };
export type NanDec = { kind: "nan" };
export type Dec = FiniteDec | ZeroDec | InfDec | NanDec;

export const NAN: Dec = { kind: "nan" };

export const MAX_DIGITS = 34;
export const MIN_QUANTUM = -6176;
export const MAX_EXP = 6144;
export const MAX_COEFF = 10n ** 34n - 1n;
