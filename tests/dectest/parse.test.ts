// tests/dectest/parse.test.ts
import { describe, expect, it } from "vitest";
import { parseDecTest } from "./parse";

const SAMPLE = `
------------------------------------------------------------------------
-- dqAdd.decTest -- decQuad addition                                  --
-- Copyright (c) IBM Corporation, 1981, 2008.  All rights reserved.   --
------------------------------------------------------------------------
version: 2.59

precision:   34
rounding:    half_even

dqadd001 add 1       1       ->  2
dqadd003 add '5.75'  '3.3'   ->  9.05
dqadd100 add 1E+3    -1      ->  999 Inexact Rounded

rounding:    half_up
dqadd200 add 1.5     0       ->  1.5

rounding:    up
dqadd300 add 1       1       ->  2
`;

describe("parseDecTest", () => {
  it("skips headers, comments, blank lines and non-rounding directives", () => {
    expect(parseDecTest(SAMPLE)).toHaveLength(5);
  });

  it("unquotes operands and captures the expected literal", () => {
    const [, second] = parseDecTest(SAMPLE);
    expect(second).toMatchObject({ id: "dqadd003", op: "add", operands: ["5.75", "3.3"], expected: "9.05" });
  });

  it("captures informational conditions without interpreting them", () => {
    const third = parseDecTest(SAMPLE)[2];
    expect(third.conditions).toEqual(["Inexact", "Rounded"]);
  });

  it("threads the rounding directive in force at each line", () => {
    const modes = parseDecTest(SAMPLE).map((c) => c.rounding);
    expect(modes).toEqual(["half_even", "half_even", "half_even", "half_up", "up"]);
  });

  it("strips trailing comments from test lines", () => {
    const cases = parseDecTest("dqadd001 add 1 1 -> 2  -- trivial\n");
    expect(cases[0]).toMatchObject({ expected: "2", conditions: [] });
  });

  it("treats a double dash inside a quoted operand as data, not a comment", () => {
    const cases = parseDecTest(`dqcom001 compare '--' "a--b" -> -1  -- quoted dashes\n`);
    expect(cases[0]).toMatchObject({ operands: ["--", "a--b"], expected: "-1", conditions: [] });
  });

  it("records the source line for failure messages", () => {
    expect(parseDecTest(SAMPLE)[0].line).toBe(11);
  });
});
