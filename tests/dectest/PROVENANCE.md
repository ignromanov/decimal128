# Provenance — IBM decTest vectors

## Source

Vendored from CPython, tag `v3.13.1`, path `Lib/test/decimaltestdata/`:
<https://github.com/python/cpython/tree/v3.13.1/Lib/test/decimaltestdata>

CPython is the canonical, cleanly-mirrored copy. The vectors originate from IBM's
General Decimal Arithmetic testcase suite (<https://speleotrove.com/decimal/dectest.html>).

## Licence

Each file retains its IBM copyright header:

    Copyright (c) IBM Corporation, 1981, 2008.  All rights reserved.

The header grants nothing on its own. The grant is stated upstream at
<https://speleotrove.com/decimal/>: the testcases "are part of the decNumber package
documentation, and are also covered by the ICU license". The ICU licence (see
`ICU-LICENSE.txt`) is an MIT-style permission grant, conditioned on retaining the
copyright notice in all copies. `tests/dectest/provenance.test.ts` enforces that
condition mechanically.

These are **dev-only fixtures**. `package.json` sets `files: ["dist"]`, so they are
never redistributed in the published npm tarball.

## Files

| File | sha256 | Vectors |
|---|---|---|
| dqAdd.decTest | `c177a8be4d5c325db9c8357907b046bcf3160fe998192c81da2b3b756cc31ed7` | 1012 |
| dqSubtract.decTest | `922e49be8743f06c4b150a1fce409a53028fca4805e85a19be0f982d246d1ca3` | 520 |
| dqMultiply.decTest | `0cf9dd544e740aa467dde13541ad10c942600518cc436b1f5562bdf1be54a7d8` | 472 |
| dqDivide.decTest | `e689e4eb4404c3e58229b4fb7b93eef39e2c5deaf757ed813023c20dd3eb09d4` | 688 |
| dqRemainder.decTest | `8b72438dd5b9a53410eb905dfae7064ffe039f6360955dfa5c2252e03c8fd829` | 500 |

## Refresh

Re-fetch from a newer CPython tag, then update the checksums above and the pinned
skip tallies in `tests/dectest/dectest.test.ts`:

```bash
for f in dqAdd dqSubtract dqMultiply dqDivide dqRemainder; do
  curl -fsS -o "tests/dectest/$f.decTest" \
    "https://raw.githubusercontent.com/python/cpython/vX.Y.Z/Lib/test/decimaltestdata/$f.decTest"
done
shasum -a 256 tests/dectest/*.decTest
```

`tests/dectest/.gitattributes` pins these files as binary (`*.decTest -text`) so Git's
`core.autocrlf` cannot rewrite their line endings and invalidate the checksums above.
