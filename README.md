# @ignromanov/decimal128

<div align="center">

[![npm version](https://img.shields.io/npm/v/@ignromanov/decimal128.svg)](https://www.npmjs.com/package/@ignromanov/decimal128)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**TS-first, tree-shakeable IEEE 754 Decimal128 arithmetic, API-aligned with the
[TC39 Decimal proposal](https://github.com/tc39/proposal-decimal).**

</div>

## Why

```js
0.1 + 0.2; // 0.30000000000000004
```

Binary floating point can't represent most decimal fractions exactly, which makes it unsafe
for money, invoicing, or any calculation where "close enough" isn't good enough. The usual fix
is arbitrary-precision decimal math — but that reopens a different can of worms (unbounded
memory, no interoperability contract, every library defining its own rules).

This library implements **IEEE 754-2019 Decimal128** instead: the same fixed-precision decimal
model used by MongoDB's `Decimal128` BSON type, SQL `DECIMAL`, and the (Stage 1) TC39 `Decimal`
proposal. Every value carries up to 34 significant digits — enough for any real-world financial
or scientific use — with well-defined rounding, overflow, and special-value (`NaN`/`±Infinity`)
behavior instead of ad hoc library-specific rules.

```js
import { from, add } from "@ignromanov/decimal128";

add(from("0.1"), from("0.2")); // "0.3"
```

## Install

```bash
npm install @ignromanov/decimal128
# or
pnpm add @ignromanov/decimal128
# or
yarn add @ignromanov/decimal128
```

Zero runtime dependencies. Ships as dual ESM + CJS with `sideEffects: false`, so bundlers can
tree-shake down to just the operations you import.

## Quick start

There is no class. A `Decimal` **is** a branded, canonical string — you create one with `from`
and operate on it with free functions:

```ts
import { from, add, divide, round, toFixed } from "@ignromanov/decimal128";

const a = from("10");
const b = from(3);

add(a, from("0.5")); // "10.5"
divide(a, b); // "3.333333333333333333333333333333333" (34 significant digits)
divide(a, b, { maximumFractionDigits: 2 }); // "3.33"
round(from("2.5"), { maximumFractionDigits: 0 }); // "2"  (default mode is half-even)
toFixed(divide(a, b), 4); // "3.3333"
```

Every function accepts `Numeric = string | number | bigint | Decimal` and normalizes internally,
so `add("1.5", 2n)` works too. Because each export is a standalone function with no shared
module-level state, importing a single op (e.g. `import { add } from "@ignromanov/decimal128"`)
pulls in only that op's dependency graph — see [Tree-shaking](#tree-shaking) below.

## ⚠️ Footguns — values are strings

A `Decimal` is a real JS string at runtime. That gives you free `===`, `Map`/object-key, and
`JSON.stringify` support for finite values — but it also means **native JS operators silently do
the wrong thing.** Always go through the library functions:

```ts
const a = from(1);
const b = from(2);

a + b; // "12"  — string concatenation, NOT 3. Use add(a, b) → "3"
"9" < "10"; // false — lexicographic compare. Use lt(from(9), from(10)) → true
from(0) === from("-0"); // false — distinct strings. Use equals(from(0), from("-0")) → true
```

- `a + b`, `a - b`, `a * b` — never use arithmetic operators on `Decimal` values. `+`/`-`/`*`
  either concatenate or silently coerce through `Number`, both wrong. Use `add`/`subtract`/
  `multiply`/`divide`.
- `a < b`, `a > b`, `.sort()` — comparisons on the raw string are **lexicographic**, not numeric
  (`"9" < "10"` is `false`). Use `lt`/`lte`/`gt`/`gte`/`compare`.
- `a === b` — canonical form makes equal *finite, same-sign* values equal as strings, but
  `"0" !== "-0"` even though they're numerically equal, and there's no reliable way to express
  "NaN-aware" equality with `===`. Use `equals()` for value equality; reserve `===` as a fast
  path only when you already know both sides are finite and non-zero.

## API reference

Every export is a standalone, tree-shakeable named export.

| Export | Description |
|---|---|
| `Decimal`, `Numeric` | `Decimal` — branded canonical string. `Numeric` — permissive input union (`string \| number \| bigint \| Decimal`). |
| `isDecimal(v)` | Type guard for `Decimal`. |
| `from(v)` | Parse `Numeric` → `Decimal`; throws `DecimalError` on invalid input. |
| `tryFrom(v)` | Parse `Numeric` → `Result<Decimal>`; never throws. |
| `add(a, b, options?)` | Addition. |
| `subtract(a, b, options?)` / `sub` | Subtraction. |
| `multiply(a, b, options?)` / `mul` | Multiplication. |
| `divide(a, b, options?)` / `div` | Division; `÷0` yields `Infinity`/`-Infinity`/`NaN`, never throws. |
| `remainder(a, b, options?)` / `mod` | Truncated remainder (sign follows the dividend); `NaN` when the integer quotient exceeds 34 digits (GDA "Division impossible" — see [Intentional divergences](#intentional-divergences)). |
| `abs(a)` | Absolute value. |
| `negate(a)` / `neg` | Sign flip. |
| `pow(base, exponent, options?)` | Integer exponentiation — an extension beyond the TC39 proposal (see [Semantics](#semantics)). |
| `compare(a, b)` / `cmp` | Total order: `-1 \| 0 \| 1`; `NaN` sorts last and equals itself (see [Semantics](#semantics)). |
| `equals(a, b)` / `eq` | Value equality; `NaN ≠ NaN`, `-0 == 0`. |
| `lessThan(a, b)` / `lt` | IEEE-ordered `<`; any `NaN` operand → `false`. |
| `lessThanOrEqual(a, b)` / `lte` | IEEE-ordered `<=`. |
| `greaterThan(a, b)` / `gt` | IEEE-ordered `>`. |
| `greaterThanOrEqual(a, b)` / `gte` | IEEE-ordered `>=`. |
| `min(...values)` | Minimum of one or more values; throws `DecimalError` on zero arguments. |
| `max(...values)` | Maximum of one or more values; throws `DecimalError` on zero arguments. |
| `round(value, options?)` | Round to `options.maximumFractionDigits` under `options.roundingMode`. |
| `RoundingMode`, `RoundingOptions` | `"ceil" \| "floor" \| "trunc" \| "halfExpand" \| "halfEven"` (default `halfEven`); `{ maximumFractionDigits?, roundingMode? }`. |
| `toString(value)` | Canonical string; scientific notation only outside `[1e-6, 1e34)`. |
| `toFixed(value, digits)` | Fixed-point string with exactly `digits` fractional digits. |
| `toPrecision(value, precision)` | String with exactly `precision` significant digits. |
| `toExponential(value, fractionDigits?)` | Scientific-notation string. |
| `toNumber(value)` | Escape hatch to a JS `number` (nearest binary64) — for charts, `Intl`, third-party APIs; may lose precision. |
| `isFinite(v)`, `isNaN(v)`, `isNegative(v)`, `isZero(v)` | Predicates over `Numeric`. |
| `DecimalError` | Thrown by `from`/`pow`/invalid options. Has `.code: DecimalErrorCode`. |
| `DecimalErrorCode`, `Result` | `"INVALID_INPUT" \| "INVALID_OPTION" \| "INVALID_EXPONENT"`; `{ ok: true, value } \| { ok: false, error }`. |

## Semantics

- **Canonical form**: no trailing fractional zeros (`from("1.20")` → `"1.2"`), no bare `.`, no
  leading `+`; scientific notation only outside `[1e-6, 1e34)`; `-0` is a distinct canonical
  value (`"-0"`), preserved because IEEE 754 requires sign propagation across composed operations
  (e.g. `divide(1, negate(0))` must be `-Infinity`).
- **Precision**: up to 34 significant digits, quantum exponent range `[-6176, 6111]` — the exact
  IEEE 754-2019 Decimal128 model. Results below the representable range underflow to `±0`;
  results above it overflow to `±Infinity` (except under `trunc`/`floor`/`ceil`, where IEEE
  mandates returning the max-normal value instead of infinity).
- **Rounding modes**: `ceil | floor | trunc | halfExpand | halfEven`. Default is `halfEven`
  ("banker's rounding" — ties round to the nearest even digit), matching IEEE 754 and the TC39
  proposal's default.
- **`remainder`** is truncated (fmod-style, sign follows the dividend), differing from IEEE 754's
  own `remainder` operation (which rounds half-to-even) and matching the TC39 proposal. It follows
  IBM General Decimal Arithmetic on the precision limit: when the integer quotient `trunc(x/y)`
  would exceed 34 digits, the operation returns `NaN` ("Division impossible") rather than a value.
  See [Intentional divergences](#intentional-divergences).
- **`pow`** is a **documented extension** beyond the TC39 proposal, which defines no `pow`. It
  accepts a non-negative integer exponent and rounds once per multiplication step.
- **`compare`** defines a total order for sortability: `NaN` compares equal to itself and greater
  than every other value. `equals`/`lt`/`lte`/`gt`/`gte` instead follow strict IEEE semantics
  (`NaN` is never equal to, less than, or greater than anything, including itself).
- **Special values**: a single quiet `NaN`, `Infinity`, `-Infinity`, `0`, `-0` — all round-trip
  through `from`/`toString` as the literal strings `"NaN"`, `"Infinity"`, `"-Infinity"`, `"0"`,
  `"-0"`.

## Intentional divergences

Every point where this library's output differs from the reference oracle
(`proposal-decimal`, the TC39 champion polyfill the differential suite tests against) is either
a bug or a deliberate, documented decision. These are the deliberate ones:

| Divergence | This library | Reference / oracle | Why |
|---|---|---|---|
| **`remainder` on a large quotient** | Returns `NaN` ("Division impossible") when the integer quotient `trunc(x/y)` exceeds 34 digits; otherwise the exact truncated modulo. | The polyfill returns a rounded (sometimes silently corrupted) finite — it does not implement the GDA precision check. | Standard conformance: matches IBM General Decimal Arithmetic, which cannot form a >34-digit quotient in Decimal128 and so signals an invalid operation. |
| **`pow`** | Provided: integer exponent, rounds once per multiply step; negative exponent throws `INVALID_EXPONENT`. | TC39 `Decimal` defines no `pow`. | A common need, offered as a clearly namespaced extension rather than left out. |
| **`compare` (total order) vs `equals` (IEEE)** | `compare` is a *total* order — `NaN` sorts last and equals itself — so values are sortable. `equals`/`lt`/`lte`/`gt`/`gte` keep strict IEEE (`NaN ≠ NaN`). | IEEE defines only the (partial) predicate semantics. | Sorting needs a total order; IEEE predicates need IEEE semantics. Both are provided under distinct names, never conflated. |
| **`toString` notation threshold** | Scientific notation only outside `[1e-6, 1e34)`. | The polyfill mimics legacy JS `Number.toString` thresholds (exponent ≥ 21 or ≤ -7). | A decimal-appropriate threshold. This is a *notation* choice, not a *value* difference — the differential suite re-threads the polyfill's output through our own `toString` so it compares values, not notation. |

## Tree-shaking

Because every export is a free function with no shared class or prototype, importing one
operation only pulls in its own dependency graph. A CI size guard
(`scripts/size-check.mjs`) bundles a fixture that imports a single op (`add`) with esbuild and
asserts it stays under a fixed threshold — currently **~3.7 KB minified** (measured via
`pnpm size-check`), well below what a class-based decimal library pulls in for the same op.

## Honest positioning

This is a portfolio-grade, spec-aligned project, not a battle-tested production dependency with
years of field use. A few things worth knowing before you adopt it:

- **TC39 alignment is a design anchor, not a standardization bet.** The TC39 `Decimal` proposal
  is Stage 1 and has seen no advancement since a 2024 Stage-2 decline. Aligning this library's
  API and semantics to it buys design discipline and a plausible future upgrade path to a native
  `Decimal` — it is not a claim that the proposal will ship.
- **Out-of-range operands resolve at construction, not at the operation.** Because a value is a
  canonical Decimal128 string, a literal outside the representable range is rounded (or overflowed)
  when it is parsed — before any operation runs. So `multiply("1e6145", "1e-100")` returns
  `Infinity`: the `1e6145` operand overflows on ingest even though the mathematical product
  `1e6045` is perfectly representable. This matches `proposal-decimal` (the reference polyfill
  behaves identically) but differs from an arbitrary-precision decimal such as Python's `decimal`
  or decNumber, which keep the operand exact and round only the in-range result. Operand parsing
  always uses `halfEven`; a per-operation `roundingMode` applies to the result, not to ingest.
- **Correctness is differential-tested.** The test suite runs 2000+ seeded input pairs against
  `proposal-decimal`, the TC39 champion's own reference polyfill, and asserts parity across
  arithmetic, rounding, comparison, and formatting. That comparison surfaced concrete points
  where the polyfill diverges from strict IEEE 754 behavior — no subnormal support, differences
  in signed-zero and division-by-zero handling, and remainder precision on large operands — which
  this library handles per-spec instead. That's offered as measured evidence of what the test
  suite actually caught, not a claim of superiority to the proposal itself.

## License

[MIT](LICENSE) © [Ignat Romanov](https://github.com/ignromanov)
