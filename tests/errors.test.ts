import { describe, expect, it } from "vitest";
import { DecimalError } from "@/errors";

describe("DecimalError", () => {
  it("carries a code and works with instanceof", () => {
    const e = new DecimalError("bad", "INVALID_INPUT");
    expect(e).toBeInstanceOf(DecimalError);
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe("INVALID_INPUT");
    expect(e.name).toBe("DecimalError");
  });
});
