// tests/dectest/provenance.test.ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = ["dqAdd", "dqSubtract", "dqMultiply", "dqDivide", "dqRemainder"] as const;

// The ICU licence permits redistribution only while the copyright notice is retained.
// A well-meaning "strip the noisy header" edit would silently break that condition.
const IBM_NOTICE = "Copyright (c) IBM Corporation, 1981, 2008.  All rights reserved.";

describe("vendored decTest fixtures", () => {
  it.each(FIXTURES)("%s.decTest retains the IBM copyright notice", (name) => {
    const source = readFileSync(join(HERE, `${name}.decTest`), "utf8");
    expect(source).toContain(IBM_NOTICE);
  });

  it("ships the ICU licence text alongside the fixtures", () => {
    const licence = readFileSync(join(HERE, "ICU-LICENSE.txt"), "utf8");
    expect(licence).toContain("Permission is hereby granted, free of charge");
  });
});
