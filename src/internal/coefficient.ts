const POW10: bigint[] = [1n];

export function pow10(n: number): bigint {
  for (let i = POW10.length; i <= n; i++) POW10.push(POW10[i - 1] * 10n);
  return POW10[n];
}

/** Number of decimal digits of a positive bigint. */
export function digitCount(c: bigint): number {
  return c.toString().length;
}
