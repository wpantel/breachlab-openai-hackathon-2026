---
name: breachlab
description: Use when the user asks Codex to run BreachLab, simulate a breach, run a safe pentest drill, discover plausible security breach scenarios, or patch and report an authorized repo-local security issue. BreachLab runs a defensive discovery and breach rehearsal workflow for owned repositories.
---

# BreachLab

BreachLab is a defensive, repo-local breach rehearsal workflow. Use it only for owned repositories, localhost apps, local containers, seeded benchmark apps, or explicitly authorized staging targets.

## Core Flow

1. Initialize: identify repo root, app stack, package manager, likely test commands, likely dev server command, and repo-local `breachlab/config.json` preferences.
2. Discover: run a broad, conservative scan and produce plausible breach simulations. Do not call candidates confirmed vulnerabilities.
3. Ask: present a short candidate menu and wait for the user to choose one candidate before Phase 2.
4. Rehearse: run Recon, Attacker, Browser Replay, Judge, Forensics, Patch, Test, and Report roles for the selected candidate.
5. Verify: replay the original safe proof after patching and report whether it is blocked.
6. Write: emit artifacts under the target repo's `breachlab/` folder.

## Required Wording

During discovery, use:

- candidate breach
- plausible breach simulation
- likely attack surface
- needs confirmation in Phase 2

Do not use:

- confirmed vulnerability
- proven exploit
- compromised

until Judge accepts reproducible local evidence in Phase 2.

## References

Load references only when needed:

- `references/breach-catalog.md`: use during discovery and candidate ranking.
- `references/agent-roles.md`: use during Phase 2 mission execution.
- `references/report-format.md`: use before writing artifacts.
- `references/safety-policy.md`: use before any attack replay, computer-use workflow, network target, patch, or test run.

## Discovery Output

Present 3-6 candidates when possible:

```text
BreachLab Discovery Complete

I found 4 plausible breach simulations for this repo.

[1] Cross-Tenant Document Access
Category: Broken access control
Target: app/api/documents/[id]/route.ts
Impact: private workspace document exposure
Confidence: High
Simulation: low-privilege user changes an object id and accesses another workspace's document.

Which breach should I simulate?
```

Write discovery artifacts every run:

```text
breachlab/discovery/2026-04-30T120000Z-candidates.json
breachlab/discovery/2026-04-30T120000Z-summary.md
```

## Phase 2 Mission

Run roles sequentially unless the user explicitly authorizes subagents.

- Recon: maps target files, auth flow, data access, tests, and fixtures.
- Attacker: confirms the selected breach with static proof, local tests, localhost requests, or approved computer-use replay.
- Browser Replay: when a localhost UI is available, captures approved before/after browser evidence using Codex browser-use if available, a repo-provided Playwright helper if present, or a manual localhost replay fallback.
- Judge: accepts only reproducible, scoped, meaningful findings.
- Forensics: writes incident timeline, evidence board, blast radius, and detection notes.
- Patch: makes the smallest safe remediation that preserves project style.
- Test: adds focused regression coverage and runs the narrowest useful command.
- Report: writes final report, timeline, scorecard, patch diff, and evidence references.

## Consent

Before first patch or focused test run, ask for BreachLab-specific consent unless `breachlab/config.json` already records explicit user preference. This file controls only BreachLab prompts. It does not bypass Codex platform permissions or user approvals.

## Artifacts

After selected mission, write:

```text
breachlab/reports/cross-tenant-document-access-report.md
breachlab/replays/cross-tenant-document-access-timeline.json
breachlab/scorecards/cross-tenant-document-access.json
breachlab/patches/cross-tenant-document-access.diff
breachlab/evidence/cross-tenant-document-access-before.png
breachlab/evidence/cross-tenant-document-access-after.png
breachlab/evidence/cross-tenant-document-access-browser-replay.json
breachlab/evidence/cross-tenant-document-access-browser-replay.webm
```

Evidence images are required only when browser or computer-use replay is available.

## Browser Replay Agent

For UI-backed web apps, prefer a safe localhost browser replay after Attacker finds a credible proof path.

Order of preference:

1. Use Codex browser-use or in-app browser tools when available and the target is localhost or explicitly authorized staging.
2. Use a repo-provided Playwright helper when present, such as `npm run replay:browser` in the BreachLab sample app.
3. Fall back to request/test evidence and clearly report that browser evidence was unavailable.

The replay must be defensive and narrow:

- use seeded demo users or test credentials only
- avoid real customer data and production secrets
- capture before evidence showing the issue
- replay the same path after remediation
- capture after evidence showing the original path is blocked
- write screenshots and replay JSON under `breachlab/evidence/`
- save a replay video when the browser tooling supports recording

## Safety

Never scan third-party targets without explicit authorization. Never use real credentials, payment data, destructive actions, CAPTCHA bypass, safety bypasses, or persistent offensive tooling. Keep exploit artifacts defensive: evidence, local proofs, and regression tests.
