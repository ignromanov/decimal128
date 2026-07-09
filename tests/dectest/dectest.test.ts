// tests/dectest/dectest.test.ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { add, divide, from, multiply, remainder, subtract } from "@/index";
import type { RoundingMode } from "@/index";
import { normalizeLiteral, sameValue, toOperandInput } from "./normalize";
import { type DecTestCase, parseDecTest } from "./parse";

const HERE = dirname(fileURLToPath(import.meta.url));

// decTest rounding names → our RoundingMode. `up` (away from zero) and `half_down`
// have no counterpart in the TC39 rounding set, so their vectors are skipped.
const ROUNDING: Record<string, RoundingMode> = {
  ceiling: "ceil",
  floor: "floor",
  down: "trunc",
  half_up: "halfExpand",
  half_even: "halfEven",
};

const BINARY = { add, subtract, multiply, divide, remainder } as const;

const UNDEFINED_TOKEN = "#";
// Signalling NaN, NaN payloads, and signed NaN: forms our single unsigned NaN cannot carry.
const UNSUPPORTED_NAN = /^(?:-nan|[+-]?snan\d*|[+-]?nan\d+)$/i;

interface Tally {
  total: number;
  rounding: number;
  undefinedResult: number;
  nanForm: number;
  ran: number;
}

const PINNED: Record<string, Tally> = {
  dqAdd: { total: 1012, rounding: 36, undefinedResult: 0, nanForm: 43, ran: 933 },
  dqSubtract: { total: 520, rounding: 0, undefinedResult: 2, nanForm: 42, ran: 476 },
  dqMultiply: { total: 472, rounding: 0, undefinedResult: 2, nanForm: 67, ran: 403 },
  dqDivide: { total: 688, rounding: 1, undefinedResult: 2, nanForm: 51, ran: 634 },
  dqRemainder: { total: 500, rounding: 0, undefinedResult: 2, nanForm: 32, ran: 466 },
};

function evaluate(c: DecTestCase): string {
  const inputs = c.operands.map(toOperandInput);
  if (c.op === "apply") return from(inputs[0]);
  const fn = BINARY[c.op as keyof typeof BINARY];
  if (!fn) throw new Error(`unmapped decTest operation "${c.op}" at line ${c.line}`);
  return fn(inputs[0], inputs[1], { roundingMode: ROUNDING[c.rounding] });
}

function runFile(name: string): { tally: Tally; failures: string[] } {
  const cases = parseDecTest(readFileSync(join(HERE, `${name}.decTest`), "utf8"));
  const tally: Tally = { total: cases.length, rounding: 0, undefinedResult: 0, nanForm: 0, ran: 0 };
  const failures: string[] = [];

  for (const c of cases) {
    const literals = [...c.operands, c.expected];
    if (!(c.rounding in ROUNDING)) {
      tally.rounding += 1;
    } else if (literals.includes(UNDEFINED_TOKEN)) {
      tally.undefinedResult += 1;
    } else if (literals.some((l) => UNSUPPORTED_NAN.test(l))) {
      tally.nanForm += 1;
    } else {
      tally.ran += 1;
      let actual: string;
      try {
        actual = evaluate(c);
      } catch (error) {
        failures.push(`${c.id} (line ${c.line}) threw: ${(error as Error).message}`);
        continue;
      }
      if (!sameValue(normalizeLiteral(actual), normalizeLiteral(c.expected))) {
        failures.push(
          `${c.id} (line ${c.line}, ${c.rounding}): ${c.op}(${c.operands.join(", ")}) → ${actual}, expected ${c.expected}`,
        );
      }
    }
  }

  return { tally, failures };
}

describe.each(Object.keys(PINNED))("%s.decTest", (name) => {
  const { tally, failures } = runFile(name);

  it("matches every runnable vector by value", () => {
    expect(failures).toEqual([]);
  });

  it("skips exactly the documented vectors", () => {
    expect(tally).toEqual(PINNED[name]);
  });
});
