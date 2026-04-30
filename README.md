# BreachLab

BreachLab is a Codex-native breach rehearsal workflow for owned repositories. It helps a developer discover a plausible security issue, safely rehearse the breach locally, verify whether it is real, patch the root cause, add regression tests, replay the original attack, and leave behind a report, scorecard, and evidence trail.

Built for the OpenAI Hackathon 2026, BreachLab turns frontier AI cyber capability into a defensive developer workflow. The goal is not to create an "AI hacker" demo. The goal is to make security work more concrete, controlled, and useful inside the codebase a team already owns.

## Why This Matters

Traditional scanners often stop at warnings. BreachLab is designed to close the loop:

1. It maps the repository and proposes candidate breach simulations.
2. The developer chooses which candidate to investigate.
3. BreachLab confirms or rejects the issue with local evidence.
4. If confirmed, it patches the code and adds focused regression coverage.
5. It verifies that the original attack path is blocked.
6. It writes artifacts a team can review later.

For judges, the core idea is simple: BreachLab does not just say "this might be vulnerable." It shows the attack path, fixes it, proves the fix, and records what happened.

## What It Does

BreachLab currently focuses on safe, repo-local security rehearsal:

- Maps routes, auth boundaries, data models, tests, config, prompts, tool surfaces, URL fetchers, uploads, and shell execution signals.
- Produces conservative candidate breach simulations, using language like "plausible breach simulation" until evidence confirms the issue.
- Runs a mission-style workflow with Recon, Attacker, Judge, Forensics, Patch, Test, and Report roles.
- Supports a strong happy path for broken access control, especially cross-tenant or IDOR-style document access.
- Writes normalized artifacts under `breachlab/`, including discovery summaries, incident reports, replay timelines, scorecards, and patch diffs.
- Includes a deterministic sample SaaS app and benchmark harness so the workflow can be demonstrated and compared.
- Includes a Security Arena dashboard for the hackathon demo layer.

## Repository Tour

```text
breachlab/
  SKILL.md                         # Codex Skill instructions
  agents/openai.yaml               # Skill metadata
  references/                      # Breach catalog, role definitions, report format, safety policy
  scripts/repo_map.py              # Read-only security surface mapper
  scripts/write_artifacts.py       # Safe repo-local artifact writer

examples/sample-saas/
  src/                             # Deterministic Express demo app
  tests/                           # Focused regression tests
  README.md                        # Sample app demo notes

benchmarks/
  challenges/team-doc-idor.json    # Seeded broken access control challenge
  results/                         # Recorded workflow comparison results

dashboard/
  index.html                       # Security Arena demo dashboard
  app.js
  styles.css

docs/
  BREACHLAB_SPEC.md                # Product and workflow specification
  BREACHLAB_IMPLEMENTATION_PLAN.md # Hackathon build plan
  BREACHLAB_RESEARCH_VALIDATION.md # Research and market validation
  BREACHLAB_TWO_MINUTE_DEMO.md     # Suggested judge demo script
```

## Demo Path For Judges

The fastest way to understand the project is:

1. Read `docs/BREACHLAB_TWO_MINUTE_DEMO.md` for the intended live demo flow.
2. Open `dashboard/index.html` to see the Security Arena companion.
3. Inspect `examples/sample-saas/` for the seeded vulnerable app.
4. Read `breachlab/SKILL.md` to see how the Codex Skill drives a safe breach rehearsal.

The headline demo scenario is cross-tenant document access:

- A low-privilege user can access another team's document in vulnerable mode.
- BreachLab identifies the candidate, confirms the attack path, patches the authorization boundary, adds regression coverage, and verifies the original replay is blocked.

## Running The Sample SaaS App

```bash
cd examples/sample-saas
npm install
npm run dev
```

In vulnerable mode, this request demonstrates the broken access control replay:

```bash
curl -H "x-user-id: user-red" http://localhost:3000/api/documents/doc-blue-budget
```

Run the focused document tests:

```bash
npm test -- documents
```

## Running The Helpers

Map security-relevant surfaces in a repo:

```bash
python3 breachlab/scripts/repo_map.py examples/sample-saas
```

Record a benchmark result:

```bash
python3 tools/run_benchmark.py \
  --challenge benchmarks/challenges/team-doc-idor.json \
  --model gpt-demo \
  --workflow breachlab \
  --candidate-found \
  --breach-confirmed \
  --false-positive-avoided \
  --patch-produced \
  --regression-test-added \
  --original-replay-blocked \
  --tests-passed
```

## Current Benchmark Snapshot

The checked-in demo results for `team-doc-idor` show the value of the closed-loop workflow:

| Workflow | Score | Outcome |
| --- | ---: | --- |
| BreachLab | 100 | Candidate found, breach confirmed, patch produced, regression test added, replay blocked, tests passed |
| Single-agent baseline | 35 | Candidate found and breach confirmed, but no patch, regression test, blocked replay, or passing test proof |

These are hackathon demo results, not a broad scientific benchmark. They are included to make the evaluation shape clear: BreachLab is measured by whether it completes the defensive loop, not merely whether it notices a suspicious pattern.

## Safety Boundaries

BreachLab is intentionally defensive:

- Use it only on owned repositories, local apps, local containers, seeded benchmark apps, or explicitly authorized staging targets.
- Do not scan third-party systems without authorization.
- Do not use real credentials, payment data, or production secrets in replay.
- Keep exploit material scoped to local evidence, regression tests, and remediation.
- Treat discovery findings as candidates until Judge validates reproducible local evidence.

## Built For The Hackathon

BreachLab is a prototype, but the product direction is clear: make AI-assisted security work feel like a controlled incident rehearsal inside the developer environment. A team should be able to ask Codex to run BreachLab, choose a scenario, and receive not just a finding but a verified fix with durable proof.

