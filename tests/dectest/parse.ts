// tests/dectest/parse.ts

/**
 * Parser for the decTest file grammar (https://speleotrove.com/decimal/dtfile.html).
 *
 * Stateful by necessity: `rounding:` directives switch part-way through a file
 * (dqAdd.decTest changes it 15 times), so each case carries the mode in force at
 * its own line.
 */

export interface DecTestCase {
  id: string;
  op: string;
  operands: string[];
  expected: string;
  /** Informational flags (`Inexact`, `Overflow`, …). Captured for diagnostics, never interpreted. */
  conditions: string[];
  /** The `rounding:` directive in force at this line, lowercased. */
  rounding: string;
  line: number;
}

const TOKEN_RE = /'[^']*'|"[^"]*"|\S+/g;
const DIRECTIVE_RE = /^(\w+):\s*(.*)$/;

function stripComment(line: string): string {
  const at = line.indexOf("--");
  return (at >= 0 ? line.slice(0, at) : line).trim();
}

function unquote(token: string): string {
  const q = token[0];
  return token.length >= 2 && (q === "'" || q === '"') && token.endsWith(q) ? token.slice(1, -1) : token;
}

export function parseDecTest(source: string): DecTestCase[] {
  const cases: DecTestCase[] = [];
  let rounding = "half_even";

  source.split("\n").forEach((raw, index) => {
    const line = stripComment(raw);
    if (line === "") return;

    const directive = DIRECTIVE_RE.exec(line);
    if (directive) {
      if (directive[1].toLowerCase() === "rounding") rounding = directive[2].trim().toLowerCase();
      return;
    }

    const tokens = line.match(TOKEN_RE);
    if (!tokens) return;
    const arrow = tokens.indexOf("->");
    if (arrow < 2 || arrow + 1 >= tokens.length) return;

    cases.push({
      id: tokens[0],
      op: tokens[1].toLowerCase(),
      operands: tokens.slice(2, arrow).map(unquote),
      expected: unquote(tokens[arrow + 1]),
      conditions: tokens.slice(arrow + 2),
      rounding,
      line: index + 1,
    });
  });

  return cases;
}
