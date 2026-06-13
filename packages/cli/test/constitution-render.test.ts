import { describe, expect, it } from "vitest";
import {
  buildValues, fillPlaceholders, germlinePaths, OUTPUT_MAP,
} from "../src/constitution/render.js";
import type { RepoInfo, StackCommands } from "../src/constitution/detect.js";

const repo: RepoInfo = { owner: "me", repo: "proj", handle: "me", account: "me@x.com", detected: true };
const stack: StackCommands = {
  install: "npm install", test: "npm test", lint: "# none", typecheck: "npm run typecheck",
  format: "# none", run: "# none", ciName: "checks", detected: true,
};

describe("germlinePaths", () => {
  it("is the fixed protected set", () => {
    expect(germlinePaths()).toEqual([
      "docs/agents/**", ".github/workflows/**", ".github/CODEOWNERS", "interlock.yml",
    ]);
  });
});

describe("buildValues", () => {
  it("fills all placeholders with no {{ }} left when applied", () => {
    const v = buildValues(repo, stack);
    expect(v.OWNER).toBe("me");
    expect(v.REPO).toBe("proj");
    expect(v.OWNER_HANDLE).toBe("me");
    expect(v.TEST_CMD).toBe("npm test");
    expect(v.CI_CHECK_NAME).toBe("checks");
    expect(v.GERMLINE_GLOBS).toContain("- `docs/agents/**`");
    expect(v.GERMLINE_GLOBS).toContain("- `interlock.yml`");
  });
});

describe("fillPlaceholders", () => {
  it("replaces every {{KEY}} present in values", () => {
    const out = fillPlaceholders("a {{OWNER}}/{{REPO}} z", buildValues(repo, stack));
    expect(out).toBe("a me/proj z");
    expect(out).not.toMatch(/\{\{/);
  });
  it("provides a generic project-description value", () => {
    const v = buildValues(repo, stack);
    expect(v.PROJECT_DESCRIPTION).toMatch(/proj/);
  });
});

describe("OUTPUT_MAP", () => {
  it("maps template keys to canonical repo paths", () => {
    expect(OUTPUT_MAP["CONSTITUTION.md"]).toBe("docs/agents/CONSTITUTION.md");
    expect(OUTPUT_MAP["field-guide.md"]).toBe("docs/agents/README.md");
    expect(OUTPUT_MAP["CODEOWNERS"]).toBe(".github/CODEOWNERS");
    expect(OUTPUT_MAP["adapters/claude-SKILL.md"]).toBe(".claude/skills/master-loop/SKILL.md");
  });
});
