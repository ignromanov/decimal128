export type DecimalErrorCode =
  | "INVALID_INPUT"    // unparseable / null / undefined passed where a Numeric is required
  | "INVALID_OPTION"   // bad roundingMode / maximumFractionDigits / formatter argument
  | "INVALID_EXPONENT" // pow() with a non-integer or negative exponent
  ;

export class DecimalError extends Error {
  readonly code: DecimalErrorCode;

  constructor(message: string, code: DecimalErrorCode) {
    super(message);
    this.name = "DecimalError";
    this.code = code;
    Object.setPrototypeOf(this, DecimalError.prototype);
  }
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DecimalError };

/** Render any input readably inside error messages. */
export function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (value === "") return "(empty string)";
  if (typeof value === "string" && value.trim() === "") return "(whitespace)";
  return String(value);
}
