/**
 * Minimal ambient type shim for the `proposal-decimal` devDependency.
 *
 * The package ships `src/Decimal.d.mts` alongside `src/Decimal.mts`, but has no
 * `exports` map in package.json. Under our `moduleResolution: "Bundler"`, TypeScript
 * resolves `import ... from "proposal-decimal"` straight to the `.mts` SOURCE file
 * instead of the `.d.mts` declaration, pulling its full implementation (and a
 * pre-existing unused-variable lint issue in ITS OWN code, unrelated to us) into our
 * strict (`noUnusedLocals`) compilation. This shim declares only the shape we actually
 * use in the differential suite, short-circuiting that resolution.
 */
declare module "proposal-decimal" {
  type RoundingMode = "ceil" | "floor" | "trunc" | "halfEven" | "halfExpand";
  type RoundingOpts = { roundingMode?: RoundingMode };

  export class Decimal {
    constructor(n: string, opts?: RoundingOpts);
    toString(): string;
    add(x: Decimal, opts?: RoundingOpts): Decimal;
    subtract(x: Decimal, opts?: RoundingOpts): Decimal;
    multiply(x: Decimal, opts?: RoundingOpts): Decimal;
    divide(x: Decimal, opts?: RoundingOpts): Decimal;
    remainder(x: Decimal): Decimal;
    equals(x: Decimal): boolean;
  }
}
