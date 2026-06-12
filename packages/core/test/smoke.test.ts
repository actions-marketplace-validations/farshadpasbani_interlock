import { describe, expect, it } from "vitest";
import { VERSION } from "../src/index.js";

describe("scaffold", () => {
  it("imports the core package", () => {
    expect(VERSION).toBe("0.1.0");
  });
});
