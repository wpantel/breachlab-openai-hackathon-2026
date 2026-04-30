# BreachLab Codex Skill Implementation Plan

## Summary

Create a shareable, repo-first Codex Skill named `breachlab` that turns Codex into a sandboxed pentest-team workflow for repository-local security drills. The written implementation should target a broad useful v1, with the most polished happy path for Next.js/Prisma-style apps, and conservative best-effort support for other stacks.

The skill will not include the AcmePay demo app in v1. AcmePay is only the fake sample vulnerable app described in the product plan and can be built later as a separate demo repository.

## Key Interfaces

- Skill package:
  - Create a normal skill folder named `breachlab/`.
  - Include `SKILL.md`, `agents/openai.yaml`, `references/`, and `scripts/`.
  - Keep the skill folder self-contained and shareable by committing it to a repository; installation later can copy or symlink `breachlab/` into `~/.codex/skills/breachlab`.

- User invocation:
  - Trigger on prompts like "Run BreachLab on this repo," "simulate a breach," "run a safe pentest drill," or "find and patch a plausible security breach."
  - Phase 1 always performs discovery and presents candidate breach simulations.
  - Phase 2 starts only after the user selects a candidate.

- Repo-local state and artifacts:
  - Write all BreachLab output under `breachlab/` in the target repo.
  - Use `breachlab/config.json` for explicit per-repo preferences, including consent to auto-patch/test after the user says "don't ask again."
  - Write discovery artifacts every run.
  - Write simulation artifacts after a selected breach is investigated.

- Platform permissions:
  - BreachLab's consent file controls only BreachLab's own "ask before patch/test" behavior.
  - It must still respect Codex sandboxing and platform approval requirements.
  - Do not rely on or recommend dangerous global permission bypass modes.

## Implementation Changes

- `SKILL.md` should define the complete workflow:
  - Initialize BreachLab, identify repo stack, and run conservative discovery.
  - Present breach candidates as "plausible simulations," never confirmed vulnerabilities.
  - Ask for candidate selection.
  - Before first patch/test run, ask whether BreachLab may patch and run focused tests; if the user says "don't ask again," persist that in `breachlab/config.json`.
  - After selection, run the pentest-team phase with Recon, Exploit, Forensics, Patch, Test, and Report roles.
  - Spawn Codex sub-agents for role work when platform rules and current user authorization allow it; otherwise execute the same roles sequentially in one agent and clearly note the fallback.
  - Keep all exploit simulation repo-local, sandboxed, non-destructive, and limited to static proof, tests, mocks, fixtures, or localhost-only checks.

- References:
  - `references/breach-catalog.md`: four v1 categories with concrete templates: broken access control, secrets/tokens, AI app security, and input/upload abuse.
  - `references/agent-roles.md`: responsibilities, inputs, outputs, and handoff expectations for each role.
  - `references/report-format.md`: Markdown report structure, JSON timeline structure, JSON scorecard structure, and artifact naming rules.
  - `references/safety-policy.md`: non-destructive simulation rules, disallowed actions, localhost-only rule, no external targets, and no real credential use.

- Scripts:
  - `scripts/repo_map.py`: deterministic read-only scanner that outputs JSON for manifests, routes/controllers, auth/session files, schemas/models, env/config files, tests, AI/prompt files, upload handlers, shell execution, URL fetchers, and dependency manifests.
  - `scripts/write_artifacts.py`: helper for creating normalized report/timeline/scorecard/discovery files under `breachlab/`.
  - No static dashboard in v1.

- Artifact contract:
  - Discovery: `breachlab/discovery/<timestamp>-candidates.json` and `breachlab/discovery/<timestamp>-summary.md`.
  - Simulation: `breachlab/reports/<slug>-report.md`, `breachlab/replays/<slug>-timeline.json`, `breachlab/scorecards/<slug>.json`, and `breachlab/patches/<slug>.diff`.
  - Scorecards include exploitability, blast radius, detection difficulty, patch confidence, regression coverage, before risk, and after risk.
  - Patch diffs are captured after remediation using normal git diff or equivalent read-only diff inspection.

- Patch/test behavior:
  - Use test-first proof when practical: create or adapt a focused regression test that demonstrates the issue, then patch, then rerun focused tests.
  - If a failing exploit test is impractical, use a static proof and add post-fix regression coverage.
  - Preserve project style and make the smallest viable remediation.
  - Never broaden scope into unrelated refactors.

## Test Plan

- Skill validation:
  - Run the skill validation script from `skill-creator` after implementation.
  - Verify `SKILL.md` frontmatter has only `name` and `description`.
  - Verify `agents/openai.yaml` matches the skill purpose.

- Script tests:
  - Run `repo_map.py` against at least three fixture repos or fixture directories:
    - Next.js/Prisma app with API routes and schema.
    - Generic Node/Express-style app.
    - Minimal repo with no obvious web surface.
  - Confirm scanner is read-only and produces stable JSON.
  - Run artifact writer with sample candidate/report data and confirm paths and JSON are valid.

- Workflow scenarios:
  - Phase 1 on a vulnerable Next.js/Prisma repo finds at least one broken access control candidate.
  - Phase 1 on a repo with OpenAI/LLM prompt files finds an AI app security candidate.
  - Phase 1 on a repo with `.env.example` and suspicious token patterns finds a secrets hygiene candidate.
  - Phase 2 selected IDOR path produces proof, patch, focused test, report, replay, scorecard, and diff.
  - Consent flow writes `breachlab/config.json` after explicit "don't ask again," and future runs in the same repo skip BreachLab's patch/test prompt while still respecting platform approvals.
  - Subagent unavailable path still completes the role workflow sequentially.

## Assumptions And Defaults

- Distribution default: repo-first skill folder committed as `breachlab/`, installable later into `~/.codex/skills`.
- MVP default: broad useful v1, with Next.js/Prisma as the most polished path.
- Safety default: all breach tests are sandboxed, repo-local, non-destructive, and never target external systems.
- Approval default: use `breachlab/config.json` for per-repo BreachLab consent.
- Artifact default: write discovery artifacts every run and simulation artifacts every selected run.
- Patch default: test-first when practical, static proof fallback when not.
- Dashboard default: excluded from v1.
- Demo app default: AcmePay is out of scope for this implementation plan.
