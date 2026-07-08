/** mulberry32 — deterministic PRNG so differential failures are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random decimal string: up to `maxDigits` significant digits, exponent in [minE, maxE]. */
export function randomDecimalString(
  rnd: () => number,
  maxDigits = 40,
  minE = -50,
  maxE = 50,
): string {
  const nDigits = 1 + Math.floor(rnd() * maxDigits);
  let digits = "";
  for (let i = 0; i < nDigits; i++) digits += Math.floor(rnd() * 10);
  const exp = minE + Math.floor(rnd() * (maxE - minE + 1));
  const sign = rnd() < 0.5 ? "-" : "";
  return `${sign}${digits}e${exp}`;
}
