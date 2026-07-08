# Roadmap

## v1 — this release

`@ignromanov/big-decimal` v1 pivots the project to a TS-first, tree-shakeable IEEE 754
Decimal128 arithmetic library, API-aligned with the TC39 `Decimal` proposal. Design source of
truth: `docs/superpowers/specs/2026-07-07-big-decimal-decimal128-pivot-design.md`.

Done-criteria (spec §1), all met at release:

- [x] `pnpm test:coverage` green (24 test files, 342 tests)
- [x] Differential tests vs the `proposal-decimal` polyfill pass (2000+ seeded input pairs)
- [x] `pnpm tsc --noEmit` green
- [x] `pnpm build` produces per-module ESM + CJS + type declarations (`preserveModules`)
- [x] Tree-shaking size guard passes (`pnpm size-check`)
- [x] `README.md` / `LICENSE` / `ROADMAP.md` updated

Functional API surface shipped: construction (`from`, `tryFrom`, `isDecimal`), arithmetic
(`add`, `subtract`, `multiply`, `divide`, `remainder`, `abs`, `negate`, `pow`), comparison
(`compare`, `equals`, `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`, `min`,
`max`), rounding (`round`, 5 rounding modes), formatting (`toString`, `toFixed`, `toPrecision`,
`toExponential`, `toNumber`), predicates (`isFinite`, `isNaN`, `isNegative`, `isZero`), and
errors (`DecimalError`, `Result`). See `README.md` for the full reference.

## Deferred (not v1, architected-for)

These were scoped out of v1 to keep it finishable; the module structure (`sideEffects: false`,
reserved `exports` subpaths) leaves room to add them later without touching the core.

- **`sqrt`, trig/log/exp** — outside the TC39 `Decimal` proposal's surface; no clear v1 use case
  to justify the correctness burden of implementing them to Decimal128 precision.
- **`scale10`** — present in the TC39 API; deferred until a concrete consumer needs it.
- **`toLocaleString` / `Intl` integration** — locale-aware formatting is a distinct, sizeable
  surface (and a tree-shaking risk if bundled into core formatting) — candidate for a separate
  subpath.
- **`big-decimal/chain`** — an ergonomic fluent/chained-call façade over the free-function API
  (`init` + `Proxy`, or a thin subpath class). The free-function core stays the source of truth;
  this would be sugar on top, not a replacement.
- **`big-decimal/mongodb`** — a bridge to MongoDB's BSON `Decimal128` type. Notably, the BSON
  spec *prohibits* drivers from doing Decimal128 arithmetic client-side — so a bridge pairing
  this library with the BSON type would fill an officially unfillable gap for JS Mongo users,
  not just duplicate driver functionality.
- **`Fixed<D>` money type** — a const-generic fixed-scale wrapper (e.g. "always exactly 2
  decimal places") for money-handling call sites that want compile-time scale guarantees on top
  of `Decimal`.

## Open decision: package name

`big-decimal` implies arbitrary-precision decimal arithmetic; this library is fixed-precision
IEEE 754 Decimal128, which is a different (and more specific) contract. The package has **never
been published to npm**, so renaming is free right now and becomes expensive (breaking change,
redirect, npm deprecation notice) the moment v1 ships. Candidate: `@ignromanov/decimal128`. This
should be decided before the first publish, not after.
