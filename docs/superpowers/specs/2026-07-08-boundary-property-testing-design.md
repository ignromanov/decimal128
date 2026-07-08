# Design: Boundary-dense property + known-answer testing for `@ignromanov/decimal128`

> Created: 2026-07-08 | Author: Radix 🧮 (radix-cto) via brainstorming | Status: APPROVED (design), pending implementation plan

## Context

`@ignromanov/decimal128` currently proves correctness two ways: 359 hand-written unit tests,
and a **differential suite** (`tests/differential/conformance.test.ts`) that compares our output
against the `proposal-decimal` polyfill over 2011 input pairs (2000 seeded-PRNG + 11 directed).

Two structural limits of that differential suite motivate this work:

1. **Oracle is buggy at the boundaries.** The polyfill has ≥5 verified IEEE/GDA non-conformances
   (no subnormals, zero-sign defects, `÷0→NaN`, remainder precision, no GDA "Division impossible").
   At exactly the boundaries we most care about, the polyfill cannot be trusted as ground truth —
   those pairs are `skip`-predicated out.
2. **Generator distribution is narrow.** `randomDecimalString` draws exponents only from `[-50, 50]`.
   It structurally never reaches subnormals (~`1e-6176`), max-normal (~`1e6144`), or exact rounding
   ties. More random pairs from the same distribution add cost, not coverage.

## Goal

Dense, **boundary-inclusive** coverage of our operations, anchored to sources of truth that do not
depend on the buggy/narrow polyfill — so we are confident the operations are correct at the
boundaries, not just in the common range.

Approach chosen during brainstorming: **(A) mathematical properties** (oracle-free) as the base,
**+ (C) IBM decTest known-answer vectors** as authoritative anchor points.

## Non-goals

- Not replacing the existing differential suite — it stays as-is (cheap regression net for the
  common range).
- Not achieving formal proof — this is strong empirical evidence, not verification.
- Not a runtime dependency change — the only new dependency is a **devDependency** (`fast-check`),
  zero runtime footprint, consistent with the zero-runtime-dep positioning.

## Architecture — three complementary layers

New tests live alongside `tests/differential/` without replacing it.

| Layer | What | Source of truth | Gap it closes |
|---|---|---|---|
| **1. decTest KAT** | Run IBM `dq*` (decimal128) vectors through our API | Authoritative external (IBM / decNumber) | Exact answers at boundaries, no trust in the polyfill |
| **2. fast-check properties** | Boundary-dense generator + metamorphic laws | None (laws hold by math) | Combinatorial space incl. subnormals / emax / ties |
| **3. Metamorphic catalog** | Fixed list of rounding-safe laws per operation | None (mathematics) | Per-operation density without any oracle |

## Layer 1 — decTest known-answer harness

**Source & licensing.** Vendor the `dq*` files from CPython's `Lib/test/decimaltestdata`
(the canonical, cleanly-redistributable mirror) into `tests/dectest/`, preserving the IBM copyright
header and adding `PROVENANCE.md`. These are **dev-only test fixtures** — the published npm tarball
ships only `dist` (`package.json` `files: ["dist"]`), so the vectors are never redistributed in the
package. The `dq*` files already fix `precision:34 / maxExponent:6144 / minExponent:-6143 /
rounding:half_even` and are boundary-dense by design (overflow/underflow/subnormal/tie cases baked in).

**Parser.** No JS/TS decTest parser exists (verified on npm + GitHub); we write `tests/dectest/parse.ts`
(~30–40 lines), porting the trivial grammar from CPython `test_decimal.py`:
- Directive lines: `keyword: value` (`precision`, `rounding`, `maxExponent`, `minExponent`).
- Test lines: `id operation operand1 [operand2 ...] -> result [conditions]`.
- Map decTest operation names → our API; map decTest condition flags → our special-value semantics
  (`Division_impossible` → `NaN`, `Overflow` → `±Infinity` or max-normal per mode, `Invalid_operation`
  → `NaN`, `Inexact`/`Rounded` are informational).

**File list (by operation).** `dqAdd`, `dqSubtract`, `dqMultiply`, `dqDivide`, `dqDivideInt`,
`dqRemainder`, `dqRemainderNear`, `dqAbs`, `dqMinus`, `dqPlus`, `dqCompare`, `dqCompareTotal`,
`dqQuantize`, `dqCanonical`, `dqEncode`, `dqBase`. (Optional later: `dqFMA`, `dqMax/Min`, `dqNext*`.)

**Documented divergences (skip predicates).** Where a decTest vector expects behavior that differs
from a **deliberate** decision of ours, add a narrow skip predicate with a comment — exactly the
pattern the differential suite uses. Candidates: our `-0` canonicalization, our notation threshold,
and remainder GDA behavior (already aligned, but confirm against `dqRemainder`). **Rule: every skip
is a documented decision, never a silent pass over a real bug.**

**`pow` gap.** There is no `dq*` file for power (pow is not in the required decimal128 set). Author
`pow` vectors separately: adapt the integer-exponent subset of the general `power.decTest` at
precision 34, plus hand-written edges (`0^0 == 1`, `x^0 == 1`, negative exponent → `INVALID_EXPONENT`).

## Layer 2 — boundary-dense fast-check arbitrary

One reusable arbitrary in `tests/property/arbitraries.ts`. No published decimal arbitrary exists to
lift; this is ~15 lines of composition of fast-check primitives.

- **Weighted mixture** (~50/50) via `fc.oneof`:
  - a **hand-authored edge corpus** via `fc.constantFrom(...)`: `"0"`, `"-0"`, `"NaN"`, `"Infinity"`,
    `"-Infinity"`, `"1e-6176"` (min subnormal), max-normal, `"5e-6177"` (sub-min tie), and exact
    half-way ties for each rounding mode;
  - a **broad generator**: `fc.tuple(sign, fc.bigInt({min:0n, max:10n**34n-1n}), fc.integer({min:-6143, max:6144})).map(makeDecimal)`.
- **Shrink-safety (critical):** build only via `tuple(...).map(...)`. Do **not** use `.chain()`
  (shrinks the chained output poorly) or `.filter()` (degrades shrink efficiency). Generating in-range
  by construction keeps shrinking clean so failures minimize to e.g. `5e-6177`, not a 40-digit monster.
- Tests use plain Vitest + `fc.assert(fc.property(decimalArbitrary, ...))` — no wrapper package.

## Layer 3 — metamorphic law catalog

No published per-operation decimal law checklist exists to lift; the catalog below is assembled from
IEEE 754-2019 and Goldberg, and IS the deliverable. File: `tests/property/laws.test.ts`.

**SAFE — assert these (exact under correct half-even rounding):**
- Commutativity: `add(a,b) == add(b,a)`, `multiply(a,b) == multiply(b,a)`
- Identities: `add(a,0) == a`, `multiply(a,1) == a`, `divide(a,1) == a`, `divide(a,a) == 1` (finite, ≠0)
- Annihilator: `multiply(a,0) == 0` (sign = XOR of operand signs)
- Negation / subtraction bridge: `negate(negate(a)) == a`, `subtract(a,b) == add(a, negate(b))`,
  `abs(a) == abs(negate(a))`
- Compare: `compare(a,b) == -compare(b,a)`; reflexivity `compare(a,a) == 0` (NaN excepted)
- Round-trip: `from(toString(x)) == x` (Decimal128 finite values are exactly representable; canonical
  string is exact)
- Special values: NaN propagation and `NaN != NaN`; `∞ ± finite == ∞`; `∞ - ∞ == NaN`; `∞ * 0 == NaN`;
  `finite / ∞ == 0`; `+0 == -0` numerically but distinguished by sign predicates

**UNSAFE — must NOT assert (broken by rounding; leave a warning comment):**
- Distributivity `a*(b+c) == a*b + a*c`
- Inverse cancellation `(a/b)*b == a`, `a*b/b == a`, `a+b-b == a`
- `x + x == x * 2` near the 34-digit ceiling
- Associativity `(a+b)+c == a+(b+c)`

## File structure

```
tests/
  differential/            (existing — unchanged)
  dectest/
    <dq*.decTest>           vendored, IBM header preserved
    PROVENANCE.md           source, license note, provenance
    parse.ts               ~30-40-line decTest parser (must-write)
    dectest.test.ts        runs vectors through our API + skip predicates
  property/
    arbitraries.ts         boundary-dense decimalArbitrary (must-write, ~15 lines)
    laws.test.ts           metamorphic relations (safe list only)
    pow.property.test.ts   pow properties + adapted power.decTest / hand vectors
```

## Phasing (each phase green and mergeable)

1. **Infra + arithmetic core** — `parse.ts` + `arbitraries.ts`; decTest KAT + properties for
   `add`, `subtract`, `multiply`, `divide`, `remainder`.
2. **Comparison / rounding / formatting / predicates** — `compare`/`compareTotal`, `quantize`/`round`,
   `canonical`/`encode`/format, predicates.
3. **`pow`** — adapt `power.decTest` (integer subset, prec 34) + hand-written edges + pow properties.

## Success criteria

- All three layers green; the existing differential suite stays green.
- Every decTest skip predicate is a documented deliberate decision (not a masked bug), each with a
  comment and, where applicable, a reference to the corresponding README "Intentional divergences" row.
- Property runs are deterministic (seeded) and shrink to a minimal failing `Decimal`.
- Only one new devDependency: `fast-check` (MIT, core, no wrapper).
- decTest vectors are dev-only (absent from the published tarball via `files: ["dist"]`).

## Resolved decisions

- **decTest source:** CPython `Lib/test/decimaltestdata` (PSF-redistributed), not speleotrove
  (IBM/ICU license friction).
- **Vendor vs fetch:** vendor into the repo (offline, deterministic, reproducible CI); keep IBM header.
- **Tooling:** `fast-check` core in plain Vitest; add `@fast-check/vitest` only if `test.prop`
  ergonomics later prove worth an extra 0.x dependency (generators port unchanged).

## Risks & mitigations

- **decTest license.** IBM "all rights reserved", reproduced with permission; ICU-redistributed.
  Mitigation: consume as dev-only fixtures never shipped in the tarball; preserve header + provenance.
  Confirm the specific license text before vendoring.
- **Test mirrors SUT (self-oracle risk).** Layer 3 laws are oracle-free by design (a bug preserving a
  law slips through) — this is why Layer 1 (independent KAT) and the metamorphic *diversity* (many
  distinct laps) are paired with it, not relied on alone.
- **Shrinking regressions.** Enforced by the `tuple().map()`-only rule in `arbitraries.ts`; a comment
  documents why `.chain()`/`.filter()` are banned there.

## References

- IBM decTest / General Decimal Arithmetic: https://speleotrove.com/decimal/dectest.html ,
  format: https://speleotrove.com/decimal/dtfile.html
- CPython mirror: https://github.com/python/cpython/tree/main/Lib/test/decimaltestdata ,
  parser reference: `Lib/test/test_decimal.py`
- fast-check: https://fast-check.dev/ (arbitraries, shrinking); primitives `fc.bigInt`/`fc.integer`/`fc.oneof`
- Metamorphic testing: https://www.hillelwayne.com/post/metamorphic-testing/ ; IEEE 754-2019; Goldberg,
  *What Every Computer Scientist Should Know About Floating-Point Arithmetic*
- Prior-art harness patterns: Go `ericlagergren/decimal/dectest_test.go`; C++ `cppalliance/decimal-dectest`
