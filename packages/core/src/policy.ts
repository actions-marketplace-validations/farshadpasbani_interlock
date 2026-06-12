import { parse as parseYaml } from "yaml";
import { z } from "zod";

export class PolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyError";
  }
}

const agentsSchema = z
  .object({
    accounts: z.array(z.string()).default([]),
    branches: z.array(z.string()).default([]),
    trailers: z.array(z.string()).default([]),
  })
  .strict()
  .default({});

export const policySchema = z
  .object({
    version: z.literal(1, {
      errorMap: () => ({ message: "only version: 1 is supported" }),
    }),
    mode: z.enum(["observe", "enforce"]).default("observe"),
    authors: z.object({ agents: agentsSchema }).strict().default({}),
    tiers: z
      .object({
        tier0: z.array(z.string()).default([]),
        tier2: z.array(z.string()).default([]),
      })
      .strict()
      .default({}),
    rules: z
      .object({
        "agent-on-tier2": z.enum(["block", "warn"]).default("block"),
        "human-on-tier2": z.enum(["warn", "require-review"]).default("warn"),
      })
      .strict()
      .default({}),
  })
  .strict();

export type Policy = z.infer<typeof policySchema>;

export function parsePolicy(yamlText: string): Policy {
  let doc: unknown;
  try {
    doc = parseYaml(yamlText);
  } catch (e) {
    throw new PolicyError(
      `interlock.yml is not valid YAML: ${(e as Error).message}`
    );
  }
  if (doc === null || doc === undefined) {
    throw new PolicyError("interlock.yml is empty");
  }
  const result = policySchema.safeParse(doc);
  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`
    );
    throw new PolicyError(`interlock.yml is invalid:\n${lines.join("\n")}`);
  }
  return result.data;
}
