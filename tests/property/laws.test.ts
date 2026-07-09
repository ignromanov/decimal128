// tests/property/laws.test.ts
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  abs,
  add,
  compare,
  divide,
  equals,
  from,
  isNegative,
  isZero,
  multiply,
  negate,
  subtract,
  toString,
} from "@/index";
import { anyDecimal, finiteDecimal, nonZeroFiniteDecimal } from "./arbitraries";

// Deterministic: a seeded failure is reproducible from the CI log alone.
const RUNS = { seed: 20260709, numRuns: 500 };

// UNSAFE — never assert these. Correct half-even rounding breaks every one of them:
//   distributivity     a*(b+c) === a*b + a*c
//   inverse cancel     (a/b)*b === a,  a*b/b === a,  a+b-b === a
//   doubling           x + x === x * 2   (near the 34-digit ceiling)
//   associativity      (a+b)+c === a+(b+c)
// They are listed here so a future contributor does not "discover" them and add them back.

describe("commutativity", () => {
  it("add(a, b) === add(b, a)", () => {
    fc.assert(fc.property(anyDecimal, anyDecimal, (a, b) => add(a, b) === add(b, a)), RUNS);
  });

  it("multiply(a, b) === multiply(b, a)", () => {
    fc.assert(fc.property(anyDecimal, anyDecimal, (a, b) => multiply(a, b) === multiply(b, a)), RUNS);
  });
});

describe("identities", () => {
  // -0 is the additive identity: (-0) + (+0) = +0, so add(a, "0") !== a at a = -0.
  it("add(a, -0) === a", () => {
    fc.assert(fc.property(anyDecimal, (a) => add(a, "-0") === a), RUNS);
  });

  it("multiply(a, 1) === a", () => {
    fc.assert(fc.property(anyDecimal, (a) => multiply(a, "1") === a), RUNS);
  });

  it("divide(a, 1) === a", () => {
    fc.assert(fc.property(anyDecimal, (a) => divide(a, "1") === a), RUNS);
  });

  it("divide(a, a) === 1 for finite non-zero a", () => {
    fc.assert(fc.property(nonZeroFiniteDecimal, (a) => divide(a, a) === "1"), RUNS);
  });
});

describe("annihilator", () => {
  it("multiply(a, 0) is zero with the XOR of the operand signs", () => {
    fc.assert(
      fc.property(finiteDecimal, (a) => {
        const product = multiply(a, "0");
        return isZero(product) && isNegative(product) === isNegative(a);
      }),
      RUNS,
    );
  });
});

describe("negation and subtraction", () => {
  it("negate(negate(a)) === a", () => {
    fc.assert(fc.property(anyDecimal, (a) => negate(negate(a)) === a), RUNS);
  });

  it("subtract(a, b) === add(a, negate(b))", () => {
    fc.assert(fc.property(anyDecimal, anyDecimal, (a, b) => subtract(a, b) === add(a, negate(b))), RUNS);
  });

  it("abs(a) === abs(negate(a))", () => {
    fc.assert(fc.property(anyDecimal, (a) => abs(a) === abs(negate(a))), RUNS);
  });
});

describe("total order", () => {
  it("compare is antisymmetric", () => {
    fc.assert(fc.property(anyDecimal, anyDecimal, (a, b) => compare(a, b) === -compare(b, a)), RUNS);
  });

  it("compare is reflexive", () => {
    fc.assert(fc.property(anyDecimal, (a) => compare(a, a) === 0), RUNS);
  });
});

describe("round-trip", () => {
  it("from(toString(x)) === x", () => {
    fc.assert(fc.property(anyDecimal, (x) => from(toString(x)) === x), RUNS);
  });
});

describe("special values", () => {
  it("NaN is not equal to itself, though its canonical form is identical", () => {
    expect(equals("NaN", "NaN")).toBe(false);
    expect(from("NaN") === from("NaN")).toBe(true);
  });

  it("NaN propagates through every arithmetic operation", () => {
    fc.assert(
      fc.property(anyDecimal, (a) => {
        return (
          add("NaN", a) === "NaN" &&
          subtract("NaN", a) === "NaN" &&
          multiply("NaN", a) === "NaN" &&
          divide("NaN", a) === "NaN"
        );
      }),
      RUNS,
    );
  });

  it("infinity absorbs finite addends", () => {
    fc.assert(fc.property(finiteDecimal, (a) => add("Infinity", a) === "Infinity"), RUNS);
    fc.assert(fc.property(finiteDecimal, (a) => add("-Infinity", a) === "-Infinity"), RUNS);
  });

  it("indeterminate forms are NaN", () => {
    expect(subtract("Infinity", "Infinity")).toBe("NaN");
    expect(add("Infinity", "-Infinity")).toBe("NaN");
    expect(multiply("Infinity", "0")).toBe("NaN");
    expect(divide("Infinity", "Infinity")).toBe("NaN");
  });

  it("a finite value divided by infinity is a signed zero", () => {
    fc.assert(
      fc.property(finiteDecimal, (a) => {
        const q = divide(a, "Infinity");
        return isZero(q) && isNegative(q) === isNegative(a);
      }),
      RUNS,
    );
  });
});

describe("rounding-mode symmetry", () => {
  // ceil and floor are reflections of one another: ceil(x) === -floor(-x). A rounding
  // bug that treats the two directions asymmetrically at a boundary breaks this, and
  // nothing else in this file exercises a non-default rounding mode.
  it("divide under ceil mirrors divide under floor", () => {
    fc.assert(
      fc.property(
        anyDecimal,
        anyDecimal,
        (a, b) =>
          divide(a, b, { roundingMode: "ceil" }) ===
          negate(divide(negate(a), b, { roundingMode: "floor" })),
      ),
      RUNS,
    );
  });

  // trunc, halfEven and halfExpand are sign-symmetric: rounding -x gives -(rounding x).
  it.each(["trunc", "halfEven", "halfExpand"] as const)(
    "divide under %s is sign-symmetric",
    (mode) => {
      fc.assert(
        fc.property(
          anyDecimal,
          anyDecimal,
          (a, b) =>
            divide(a, b, { roundingMode: mode }) ===
            negate(divide(negate(a), b, { roundingMode: mode })),
        ),
        RUNS,
      );
    },
  );

  // Directed rounding brackets the exact quotient from both sides, including when the
  // quotient overflows (floor of a positive over-max clamps to max-normal, ceil goes to Infinity).
  it("floor never exceeds ceil", () => {
    fc.assert(
      fc.property(nonZeroFiniteDecimal, nonZeroFiniteDecimal, (a, b) => {
        const lo = divide(a, b, { roundingMode: "floor" });
        const hi = divide(a, b, { roundingMode: "ceil" });
        return compare(lo, hi) <= 0;
      }),
      RUNS,
    );
  });
});
