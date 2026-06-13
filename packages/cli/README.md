# agent-interlock

**Deterministic governance gate for AI-agent pull requests.** One policy file —
protected paths plus reversibility-tiered merge rules, enforced in CI whatever tool
wrote the code.

Agents are fast and occasionally catastrophic. Reviewing every change kills the speed;
trusting every change kills the repo. Interlock is the dial between the two — and it's a
**fuse, not another AI**: deterministic globs and rules, the same verdict every time. No
LLM judges your PR.

This package is the CLI. The companion GitHub Action posts the verdict on every PR. Full
docs, the Action, and the design live at
**[github.com/interlock-dev/interlock](https://github.com/interlock-dev/interlock)**.

## Install & 10-minute path

```bash
npx agent-interlock init
```

1. `init` writes an `interlock.yml` (in `observe` mode) and prints a GitHub Actions
   workflow to paste.
2. Paste the workflow into `.github/workflows/interlock.yml`.
3. Open any PR — Interlock posts a tier verdict as a sticky comment, an
   `interlock:tier-N` label, and a job summary.
4. When you trust the verdicts, flip `mode: enforce` and make the `interlock` check
   required in branch protection. That's minute 9 of the 10.

## The tiers

| Tier | What | Default treatment |
| --- | --- | --- |
| **0** | Docs, tests, markdown — behaviour-neutral | Auto-merge candidate |
| **1** | Ordinary code | Normal review |
| **2** | Protected paths: CI config, auth, the policy file itself | Humans only |

A PR's tier is the **max** across its changed files; renames count both paths. The policy
is always read from the PR's **base** branch, so a PR cannot weaken the law that judges it.
`interlock.yml` protects itself by default — the gate cannot edit its own off-switch.

## CLI

| Command | Purpose |
| --- | --- |
| `agent-interlock init [--force]` | Scaffold `interlock.yml` + print the workflow |
| `agent-interlock check [--base <ref>] [--json]` | Classify the current branch's diff |
| `agent-interlock explain <path>` | Show which rule catches a path and its tier |

Exit codes: `0` = pass or warn-only · `1` = blocking violation (stronger than warn) ·
`2` = config/input error (missing or invalid policy, bad base ref, malformed path).

## License

Apache-2.0 · © 2026 Farshad Pasbani
