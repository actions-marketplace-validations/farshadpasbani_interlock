import { describe, expect, it } from "vitest";
import { detectRepo, parseRemote } from "../src/constitution/detect.js";

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
