import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("imports the barrel without side effects", async () => {
    const mod = await import("@/index");
    expect(mod).toBeDefined();
  });
});
