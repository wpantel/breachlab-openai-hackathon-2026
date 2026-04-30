# BreachLab Implementation Plan

Status: Hackathon execution plan
Source: merged BreachLab spec design

Research validation: see `BREACHLAB_RESEARCH_VALIDATION.md` for source-backed rationale and plan adjustments.

## Goal

Build BreachLab as a repo-first Codex Skill plus a visual hackathon companion.

BreachLab should:

1. Analyze an owned repository.
2. Present plausible breach simulations, not confirmed vulnerabilities.
3. Let the user select one candidate.
4. Run a breach mission with Recon, Attacker, Judge, Forensics, Patch, Test, and Report roles.
5. Produce proof, patch, regression tests, verification, scorecard, and artifacts.
6. Optionally visualize the mission in a Security Arena dashboard with a creative 2D arena modal.

The MVP should be reliable on a seeded sample repo while remaining useful on arbitrary repos.

## Product Decisions

- Product name: `BreachLab`
- Visual mode: `Security Arena`
- Skill folder: `breachlab/`
- Repo-local output folder in target repos: `breachlab/`
- Sample repo: generic SaaS-like app, not AcmePay-branded
- First polished path: JavaScript or TypeScript web apps, preferably Next.js-style routes
- Safety stance: authorized, repo-local, localhost-first, non-destructive
- Dashboard stance: separate hackathon companion, not required inside the shareable skill v1
- Computer-use stance: optional visual proof layer for localhost or explicitly authorized targets

## Repository Structure

Target structure for this repo:

```text
breachlab-openai-hackathon-2026/
  BREACHLAB_IMPLEMENTATION_PLAN.md
  breachlab/
    SKILL.md
    agents/
      openai.yaml
    references/
      breach-catalog.md
      agent-roles.md
      report-format.md
      safety-policy.md
    scripts/
      repo_map.py
      write_artifacts.py
  dashboard/
    index.html
    styles.css
    app.js
  examples/
    sample-saas/
      ...
  benchmarks/
    challenges/
      ...
    fixtures/
      ...
    results/
      .gitkeep
  tools/
    run_benchmark.py
```

## Workstreams

### Track A: Codex Skill Package

Deliverable: `breachlab/` skill folder.

Tasks:

- Create `breachlab/SKILL.md` with frontmatter containing only `name` and `description`.
- Define trigger cases:
  - "Run BreachLab on this repo."
  - "Simulate a breach."
  - "Run a safe pentest drill."
  - "Find and patch a plausible security breach."
- Define Phase 0 initialization:
  - Identify repo root.
  - Detect framework/language/package manager.
  - Detect likely test/dev commands.
  - Read `breachlab/config.json` if present in the target repo.
- Define Phase 1 discovery:
  - Run or emulate repo mapping.
  - Produce candidate breach simulations with conservative wording.
  - Write discovery artifacts every run.
  - Ask the user to select a candidate before Phase 2.
- Define Phase 2 mission:
  - Recon maps target flow.
  - Attacker confirms safe local proof.
  - Judge validates or rejects the finding.
  - Forensics builds incident replay.
  - Patch fixes root cause.
  - Test adds regression coverage.
  - Judge verifies original replay is blocked.
  - Report writes artifacts.
- Define subagent policy:
  - Use parallel agents only if the user explicitly asks for or authorizes subagents.
  - Otherwise run the same roles sequentially and state the fallback.
- Define patch/test consent:
  - Before first patch/test run, ask for BreachLab-specific consent.
  - If the user says "don't ask again," persist that preference in target repo `breachlab/config.json`.
  - Never treat this file as platform permission bypass.
- Add `breachlab/agents/openai.yaml` for UI metadata.

Acceptance criteria:

- Skill can guide a complete discovery-to-report flow from instructions alone.
- Skill clearly distinguishes candidates from confirmed breaches.
- Skill refuses or narrows unsafe external-target requests.
- Skill package is self-contained and installable later into `~/.codex/skills/breachlab`.

### Track B: Skill References

Deliverable: `breachlab/references/*.md`.

Files:

- `breach-catalog.md`
- `agent-roles.md`
- `report-format.md`
- `safety-policy.md`

Tasks:

- `breach-catalog.md` covers four MVP categories:
  - Broken access control
  - Secrets and tokens
  - AI app security
  - Input and upload abuse
- Each category includes:
  - Signals
  - Candidate templates
  - Evidence examples
  - Patch strategy hints
  - Regression test ideas
- `agent-roles.md` defines:
  - Inputs
  - Responsibilities
  - Outputs
  - Handoff expectations
  - Sequential fallback behavior
- `report-format.md` defines:
  - Markdown report template
  - Timeline JSON schema
  - Scorecard JSON schema
  - Discovery JSON schema
  - Artifact naming rules
- `safety-policy.md` defines:
  - Authorized targets only
  - Localhost-first rule
  - No real credentials
  - No third-party scanning
  - No destructive actions
  - Computer-use boundaries

Acceptance criteria:

- `SKILL.md` stays concise and links to references only when needed.
- References provide enough detail to make outputs consistent.
- Safety rules are explicit and reusable.

### Track C: Deterministic Helpers

Deliverables:

- `breachlab/scripts/repo_map.py`
- `breachlab/scripts/write_artifacts.py`

`repo_map.py` tasks:

- Read-only scanner.
- Output stable JSON.
- Detect:
  - package manifests
  - route/controller/API files
  - auth/session files
  - schema/model files
  - env/config files
  - tests and fixtures
  - AI/prompt/tool files
  - upload/file handlers
  - shell execution patterns
  - URL fetchers
  - dependency manifests
- Avoid network calls.
- Avoid writing files unless explicitly passed an output path.

`write_artifacts.py` tasks:

- Normalize artifact paths under target repo `breachlab/`.
- Write:
  - `discovery/<timestamp>-candidates.json`
  - `discovery/<timestamp>-summary.md`
  - `reports/<slug>-report.md`
  - `replays/<slug>-timeline.json`
  - `scorecards/<slug>.json`
  - `patches/<slug>.diff`
- Validate JSON before writing.
- Create directories as needed.

Acceptance criteria:

- Helpers run with the system Python standard library only.
- Scanner is deterministic and read-only by default.
- Artifact writer produces valid paths and JSON.

### Track D: Sample Repo

Deliverable: `examples/sample-saas/`.

Purpose:

Provide a deterministic demo repo for the end-to-end BreachLab flow.

Recommended app shape:

- Login with seeded test users
- Teams or workspaces
- Documents or projects
- Admin-only export/invite endpoint
- URL preview or upload endpoint
- Support chatbot or AI assistant prompt/tool file
- Focused tests

Seeded candidates:

- Broken access control:
  - Low-privilege user can access another team's document or project.
- Privilege escalation:
  - Non-admin can reach export/invite behavior.
- AI app security:
  - Support assistant leaks hidden instruction/context or has unsafe tool access.
- Input abuse:
  - URL preview or upload path is unsafe.
- Secrets hygiene:
  - Suspicious env/example/config pattern.

MVP implementation choice:

- Build the smallest working web app that supports one full computer-use replay.
- Broken access control should be the most reliable happy path.

Acceptance criteria:

- App can run locally.
- Seed data and test credentials are deterministic.
- At least one vulnerability can be confirmed before patch.
- The same path is blocked after patch.
- Focused tests fail before remediation and pass after remediation, or a static proof fallback is documented.

### Track E: Security Arena Dashboard

Deliverable: `dashboard/` static app.

Purpose:

Make the BreachLab mission visible for the hackathon creative rubric.

Views:

- Discovery results
- Selected breach
- Agent mission board
- Computer-use replay status
- Creative arena modal
- Before/after risk state
- Attack replay timeline
- Evidence cards
- Patch summary
- Test results
- Scorecard
- Benchmark comparison

Creative arena modal:

- Modal opens during Phase 2.
- Shows simple 2D attacker, defender, and judge characters/tokens.
- Animations are driven by mission events, not random gameplay.
- Event mapping:
  - `recon_started`: map reveals
  - `breach_confirmed`: attacker lands hit, risk rises
  - `judge_accepted`: judge badge appears
  - `forensics_started`: timeline trail appears
  - `patch_applied`: defender builds shield
  - `tests_passed`: coverage meter fills
  - `replay_blocked`: attack bounces off shield
  - `report_written`: scorecard appears

Implementation:

- Plain HTML/CSS/JS is enough.
- Use inline fixture data first.
- Later load real `scorecards/*.json` and `replays/*.json` if time allows.

Acceptance criteria:

- Dashboard shows the full discovery-to-report story.
- Creative modal can be triggered from a mission event sequence.
- UI is demoable from a local file or simple dev server.

### Track F: Benchmark Harness

Deliverables:

- `benchmarks/challenges/*.json`
- `tools/run_benchmark.py`
- `benchmarks/results/.gitkeep`

Benchmark goals:

- Compare BreachLab workflow across model backends.
- Compare BreachLab against scanner-only or single-agent baselines.
- Keep claims precise: benchmark workflow effectiveness and model capability.

Challenge schema:

```json
{
  "id": "team-doc-idor",
  "category": "broken_access_control",
  "repo": "examples/sample-saas",
  "target_files": ["app/api/documents/[id]/route.ts"],
  "setup_command": "npm install",
  "test_command": "npm test -- documents",
  "dev_command": "npm run dev",
  "local_url": "http://localhost:3000",
  "success_condition": "cross-team document access is blocked",
  "regression_required": true,
  "computer_use_required": true,
  "oracle": {
    "pre_patch_attack_should_succeed": true,
    "post_patch_attack_should_fail": true,
    "expected_status_after_patch": 404
  }
}
```

Metrics:

- Candidate found
- Candidate correctly ranked
- Breach confirmed
- False positive avoided
- Patch produced
- Regression test added
- Original replay blocked
- Tests still pass
- Artifact quality
- Time
- Token/tool budget
- Final score

Acceptance criteria:

- At least one benchmark challenge exists.
- Runner can record a result JSON for a named model/workflow run.
- Results are suitable for dashboard display.

## Artifact Contract

Discovery artifacts, written every run:

```text
breachlab/discovery/<timestamp>-candidates.json
breachlab/discovery/<timestamp>-summary.md
```

Simulation artifacts, written after selected mission:

```text
breachlab/reports/<slug>-report.md
breachlab/replays/<slug>-timeline.json
breachlab/scorecards/<slug>.json
breachlab/patches/<slug>.diff
breachlab/evidence/<slug>-before.png
breachlab/evidence/<slug>-after.png
```

Scorecard fields:

- `breach_id`
- `category`
- `confirmed`
- `severity`
- `exploitability`
- `blast_radius`
- `detection_difficulty`
- `patch_confidence`
- `regression_coverage`
- `before_risk`
- `after_risk`
- `original_replay_blocked`
- `tests_passed`

## Computer-Use Boundaries

Computer use is feasible and should be the demo proof layer, but only inside clear boundaries.

Allowed:

- Localhost app started from the repo
- Local container
- User-approved staging target
- Seeded benchmark target

Not allowed:

- Unapproved third-party targets
- Real credentials or payment data
- CAPTCHAs or safety bypasses
- Destructive remote actions
- Persistent offensive tooling

Computer-use attacker should produce:

- Action timeline
- Screenshots before and after patch
- Replay evidence
- A verification result after patch

## Validation Plan

Skill validation:

- Check `SKILL.md` frontmatter has only `name` and `description`.
- Check `agents/openai.yaml` matches skill purpose.
- Run skill validation from `skill-creator` if available.

Script validation:

- Run `repo_map.py` against:
  - a Next.js/route-style fixture
  - a generic Node/Express-style fixture
  - a minimal repo with no web surface
- Confirm read-only behavior.
- Confirm stable JSON.
- Run `write_artifacts.py` with sample data.

Workflow validation:

- Phase 1 finds at least one broken access control candidate in sample repo.
- Phase 1 finds AI app security candidate when prompt/tool files exist.
- Phase 1 finds secrets hygiene candidate from env/config signals.
- Phase 2 selected access-control path produces proof, patch, focused test, report, replay, scorecard, and diff.
- Consent flow writes `breachlab/config.json` only after explicit "don't ask again" language.
- Sequential fallback completes the role workflow when subagents are unavailable or unauthorized.

Dashboard validation:

- Dashboard opens locally.
- Mission board updates through event sequence.
- Creative modal plays each major state.
- Scorecard and timeline render from fixture data.

Benchmark validation:

- At least one challenge JSON exists.
- Benchmark runner writes a result JSON.
- Dashboard can display benchmark fixture results.

## Hackathon Execution Order

### Milestone 1: Skeleton

- Create skill folder.
- Create references.
- Create helper script stubs.
- Create dashboard folder.
- Create sample repo folder.

### Milestone 2: Skill Core

- Implement `SKILL.md`.
- Implement breach catalog and role references.
- Implement report/scorecard schemas.
- Implement safety policy.

### Milestone 3: Discovery And Artifacts

- Implement `repo_map.py`.
- Implement `write_artifacts.py`.
- Generate discovery candidates from sample repo signals.
- Write discovery artifacts.

### Milestone 4: Sample Happy Path

- Build seeded sample app.
- Seed one broken access control scenario.
- Add test or static proof path.
- Make patch path deterministic.

### Milestone 5: Dashboard Demo

- Rebrand current Security Arena prototype to BreachLab.
- Add mission board.
- Add creative arena modal.
- Add replay timeline and scorecard panels.
- Wire to fixture event data.

### Milestone 6: Benchmark Proof

- Add first challenge JSON.
- Add benchmark result schema.
- Add one or two fixture results for model/workflow comparison.

### Milestone 7: End-To-End Rehearsal

- Run the demo script from invocation to report.
- Verify artifacts are written.
- Verify dashboard tells the same story.
- Tighten pitch language and fallback notes.

## Demo Script

1. Open the sample repo in Codex.
2. Run: `Run BreachLab on this repo.`
3. BreachLab maps the repo and writes discovery artifacts.
4. BreachLab presents candidate breach simulations.
5. User selects the broken access control candidate.
6. Mission board starts.
7. Computer-use attacker replays the breach locally.
8. Judge confirms the finding.
9. Forensics builds the incident replay.
10. Patch agent remediates the root cause.
11. Test agent adds regression coverage.
12. Judge replays the original attack and confirms it is blocked.
13. Report agent writes artifacts.
14. Dashboard shows scorecard and creative arena completion.

Pitch line:

```text
Security tools tell developers what might be wrong. BreachLab rehearses the breach, fixes the code, and leaves behind the tests, replay, scorecard, and incident report.
```

## Near-Term Task Split

Parallel-friendly split:

- Person A: Codex Skill package and references
- Person B: sample repo and seeded vulnerability
- Person C: dashboard and creative arena modal
- Person D: benchmark schema and runner

Critical path:

```text
Skill skeleton -> sample repo happy path -> dashboard fixture -> E2E rehearsal
```

The dashboard can use fixture data while the skill catches up. The skill can emit artifacts before the dashboard consumes them. The benchmark harness can start with synthetic results and become real after the sample repo is stable.
