import { build } from "esbuild";

// Bundle a fixture importing a SINGLE op from the built package. If class-in-barrel
// or side-effect imports ever creep back, this size explodes and CI fails.
const result = await build({
  stdin: {
    contents: `export { add } from "./dist/index.js";`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  minify: true,
  format: "esm",
  write: false,
});

const bytes = result.outputFiles[0].contents.length;
// Threshold rule: measured size of add + its internal deps (parse/round/canonical/args)
// plus ~25% headroom. Measured 3749B on 2026-07-07; pinned to ceil(3749 * 1.25) = 4687,
// rounded to the nearest 512.
const LIMIT = 4608;

if (bytes > LIMIT) {
  console.error(`✗ tree-shaking regression: single-op bundle is ${bytes}B > ${LIMIT}B`);
  process.exit(1);
}
console.log(`✓ size-check: single-op bundle ${bytes}B ≤ ${LIMIT}B`);
