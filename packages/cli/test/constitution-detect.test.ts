import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectRepo, detectStack, parseRemote } from "../src/constitution/detect.js";

function tmp(files: Record<string, string>): string {
  const d = mkdtempSync(join(tmpdir(), "stack-"));
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(join(d, p, ".."), { recursive: true });
    writeFileSync(join(d, p), c);
  }
  return d;
}

describe("parseRemote", () => {
  it("parses https remotes", () => {
    expect(parseRemote("https://github.com/me/proj.git")).toEqual({ owner: "me", repo: "proj" });
    expect(parseRemote("https://github.com/me/proj")).toEqual({ owner: "me", repo: "proj" });
  });
  it("parses ssh remotes", () => {
    expect(parseRemote("git@github.com:me/proj.git")).toEqual({ owner: "me", repo: "proj" });
  });
  it("returns null on junk", () => {
    expect(parseRemote("")).toBeNull();
    expect(parseRemote("not a url")).toBeNull();
  });
});

describe("detectRepo", () => {
  it("derives owner/repo/handle/account from git", () => {
    const exec = (_c: string, args: string[]): string => {
      if (args[0] === "remote") return "git@github.com:me/proj.git\n";
      if (args[0] === "config") return "me@example.com\n";
      return "";
    };
    expect(detectRepo("/x", exec)).toEqual({
      owner: "me", repo: "proj", handle: "me", account: "me@example.com", detected: true,
    });
  });
  it("flags undetected when there is no remote", () => {
    const exec = (_c: string, args: string[]): string => {
      if (args[0] === "remote") throw new Error("no remote");
      return "";
    };
    const r = detectRepo("/x", exec);
    expect(r.detected).toBe(false);
    expect(r.owner).toBe("OWNER");
  });
});

describe("detectStack", () => {
  it("maps npm scripts when package.json present", () => {
    const d = tmp({ "package.json": JSON.stringify({ scripts: { test: "vitest", typecheck: "tsc --noEmit" } }) });
    const s = detectStack(d);
    expect(s.install).toBe("npm install");
    expect(s.test).toBe("npm test");
    expect(s.typecheck).toBe("npm run typecheck");
    expect(s.ciName).toBe("checks");
    expect(s.detected).toBe(true);
  });
  it("uses uv when pyproject + uv.lock present", () => {
    const d = tmp({ "pyproject.toml": "[project]", "uv.lock": "" });
    const s = detectStack(d);
    expect(s.install).toBe("uv sync");
    expect(s.test).toBe("uv run pytest");
  });
  it("falls back generically when nothing recognised", () => {
    const d = tmp({ "README.md": "x" });
    const s = detectStack(d);
    expect(s.detected).toBe(false);
    expect(s.test).toContain("TODO");
  });
});
