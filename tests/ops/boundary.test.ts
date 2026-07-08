import { describe, expect, it } from "vitest";
import { divide, multiply } from "@/index";

// Directed boundary vectors the differential PRNG (exponents in [-50, 50]) never reaches.
// Every expected value here was derived by exact reasoning and cross-checked against the
// built library; the polyfill is WRONG at the subnormal boundary (returns 0 / off by ~1e33),
// so these cannot be covered by the differential suite and must be pinned directly.

describe("directed overflow → max-normal vs Infinity", () => {
  const MAX_NORMAL = "9.999999999999999999999999999999999e+6144";
  // 1e6144 * 10 = 1e6145 overflows emax=6144. Round-toward-zero modes clamp to the
  // largest finite (max-normal); round-to-nearest and round-away overflow to Infinity.
  it.each([
    ["trunc", MAX_NORMAL],
    ["floor", MAX_NORMAL], // floor of a positive over-max rounds toward zero → max-normal
    ["ceil", "Infinity"],
    ["halfEven", "Infinity"],
  ] as const)("multiply(1e6144, 10, {%s}) === %j", (mode, expected) => {
    expect(multiply("1e6144", "10", { roundingMode: mode })).toBe(expected);
  });

  it.each([
    ["trunc", "-" + MAX_NORMAL],
    ["ceil", "-" + MAX_NORMAL], // ceil of a negative over-max rounds toward zero → -max-normal
    ["floor", "-Infinity"],
    ["halfEven", "-Infinity"],
  ] as const)("multiply(-1e6144, 10, {%s}) === %j", (mode, expected) => {
    expect(multiply("-1e6144", "10", { roundingMode: mode })).toBe(expected);
  });
});

describe("directed subnormal boundary (gradual underflow to quantum 1e-6176)", () => {
  // Values below the smallest quantum round half-even to the nearest representable multiple.
  it.each([
    ["1e-6176", "0.5", "0"],       // 5e-6177 is exactly half → nearest even (0)
    ["3e-6176", "0.5", "2e-6176"], // 1.5e-6176 half → nearest even (2, not 1)
    ["1e-6176", "0.6", "1e-6176"], // 6e-6177 > half → up to 1e-6176
  ] as const)("multiply(%j, %j, {halfEven}) === %j", (a, b, expected) => {
    expect(multiply(a, b, { roundingMode: "halfEven" })).toBe(expected);
  });

  it("divide(1e-6176, 2, {halfEven}) === '0' (5e-6177 half → even)", () => {
    expect(divide("1e-6176", "2", { roundingMode: "halfEven" })).toBe("0");
  });
});
