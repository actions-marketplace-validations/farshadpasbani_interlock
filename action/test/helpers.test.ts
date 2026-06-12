import { describe, expect, it, vi } from "vitest";
import {
  buildComment,
  extractTrailers,
  mapFiles,
  MARKER,
  withRetry,
} from "../src/helpers.js";
import type { Verdict } from "@interlock-dev/core";

describe("mapFiles", () => {
  it("maps GitHub API file entries to ChangedFile", () => {
    expect(
      mapFiles([
        { filename: "docs/a.md", status: "modified" },
        { filename: "b.ts", status: "added" },
        { filename: "c.ts", status: "removed" },
        { filename: "new.ts", status: "renamed", previous_filename: "old.ts" },
      ])
    ).toEqual([
      { path: "docs/a.md", status: "modified" },
      { path: "b.ts", status: "added" },
      { path: "c.ts", status: "removed" },
      { path: "new.ts", previousPath: "old.ts", status: "renamed" },
    ]);
  });

  it("maps unknown statuses to modified", () => {
    expect(mapFiles([{ filename: "x", status: "changed" }])[0]?.status).toBe(
      "modified"
    );
  });
});

describe("extractTrailers", () => {
  it("pulls trailer-shaped lines from commit messages", () => {
    const trailers = extractTrailers([
      "feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>",
      "fix: y",
    ]);
    expect(trailers).toEqual([
      "Co-Authored-By: Claude <noreply@anthropic.com>",
    ]);
  });
});

describe("buildComment", () => {
  const verdict: Verdict = {
    tier: 2,
    authorClass: "agent",
    mode: "enforce",
    perFile: [{ path: "interlock.yml", tier: 2, matchedRule: "interlock.yml" }],
    violations: [
      { kind: "agent-on-tier2", setting: "block", paths: ["interlock.yml"] },
    ],
    requirements: ["BLOCKED — agent-on-tier2: interlock.yml"],
  };

  it("contains the marker, a table, and the gating outcome", () => {
    const md = buildComment(verdict, {
      shouldFail: true,
      reasons: ["agent-on-tier2: blocked (interlock.yml)"],
    });
    expect(md).toContain(MARKER);
    expect(md).toContain("| `interlock.yml` | 2 |");
    expect(md).toContain("❌");
  });
});

describe("withRetry", () => {
  it("retries once then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("flake"))
      .mockResolvedValueOnce("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("gives up after two attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("down"));
    await expect(withRetry(fn)).rejects.toThrow("down");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
