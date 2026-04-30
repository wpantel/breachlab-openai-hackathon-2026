# BreachLab Spec Design

Version: 0.1
Status: Hackathon build spec

## One-Sentence Pitch

BreachLab is a Codex Skill that rehearses realistic breaches inside an owned repository, then verifies the issue, patches the code, adds regression tests, and generates an incident replay, scorecard, and report.

## Product Thesis

Traditional security tools tell developers what might be wrong. BreachLab shows how a plausible breach would unfold in their actual app, fixes the root cause, and leaves behind proof that the attack path is closed.

BreachLab is not a generic offensive hacking bot. It is an authorized, repo-native breach rehearsal system for developers and security teams.

## Core User Experience

The user opens Codex inside a repository and invokes BreachLab:

```text
Run BreachLab on this repo.
```

BreachLab performs broad discovery, presents a short menu of candidate breach simulations, asks the user to choose one, then runs an autonomous mission with specialized agents.

The primary interaction is:

```text
1. Invoke BreachLab.
2. Review candidate breach simulations.
3. Select one breach.
4. Watch agents verify, replay, patch, test, score, and report.
```

The user should not be quizzed. The product should feel like watching an expert security exercise unfold inside the repo.

## Product Names

- Product: BreachLab
- Visual mode: Security Arena
- Skill command candidates: `/breachlab`, `/security arena`
- Output folder: `breachlab/`

## Skill Package

BreachLab should be implemented as a normal, shareable Codex Skill folder:

```text
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
```

The skill should be self-contained and repo-first. Installation can later copy or symlink the skill folder into `~/.codex/skills/breachlab`.

Skill triggers should include prompts like:

- "Run BreachLab on this repo."
- "Simulate a breach."
- "Run a safe pentest drill."
- "Find and patch a plausible security breach."

## Repo-Local State And Consent

All BreachLab outputs belong under `breachlab/` in the target repository.

BreachLab may also create:

```text
breachlab/config.json
```

This config stores repo-local BreachLab preferences, such as whether the user has asked BreachLab not to prompt again before applying patches or running focused tests.

Important boundaries:

- `breachlab/config.json` controls only BreachLab's own product prompts.
- It does not override Codex platform permissions, sandbox rules, or user approvals.
- It must never recommend dangerous global permission bypasses.
- Before the first patch or focused test run, BreachLab should ask for approval unless repo-local config already records explicit consent.
- Discovery artifacts should be written every run, even when the user does not select a breach.

## Target User

- Startup engineers who do not have a dedicated security team
- Security engineers who want repeatable breach rehearsal artifacts
- Platform teams that want security checks inside code review
- AI app developers who need to test model/tool/prompt security paths

## Non-Goals

- Do not scan third-party targets without explicit authorization.
- Do not become a general exploit-generation product.
- Do not claim a vulnerability is confirmed during discovery.
- Do not produce reusable offensive tooling beyond local evidence and regression tests.
- Do not attempt to replace professional security review for high-risk systems.

## End-to-End Flow

### Phase 0: Initialization

BreachLab determines the repository context.

Inputs:

- Repository path
- Framework and language
- Package manager
- Test commands
- Dev server command, if available
- Local app URL, if already running
- User-approved staging URL, optional
- Write mode: propose patches or apply patches
- Repo-local BreachLab preferences from `breachlab/config.json`, if present

Expected status:

```text
BreachLab initialized.
Repository mapped.
Mode: breach discovery.
Status: deploying analyzer.
```

### Phase 1: Discovery

Goal: find plausible breach simulations for the current repository.

Discovery produces candidates, not confirmed vulnerabilities. Wording must remain conservative:

- candidate breach
- plausible breach simulation
- likely attack surface
- needs confirmation in Phase 2

Analyzer inspects:

- README and project documentation
- package manifests and dependency files
- route files, controllers, API handlers, RPC procedures
- auth middleware and session handling
- database schema, models, and query patterns
- environment examples and config files
- upload handlers and file operations
- outbound fetches and URL preview handlers
- shell execution and parser usage
- AI prompts, tools, model calls, retrieval code, and agent loops
- tests, fixtures, and seed data

Discovery agents:

- Surface Mapper: identifies routes, auth boundaries, sensitive data, and framework structure.
- Breach Ideator: turns surfaces into plausible breach scenarios.
- Risk Ranker: scores candidates by exploitability, impact, confidence, demo value, and ability to verify.

Discovery output:

```text
BreachLab Discovery Complete

I found 4 plausible breach simulations for this repo.

[1] Cross-Tenant Document Access
Category: Broken access control
Target: app/api/documents/[id]/route.ts
Impact: private workspace document exposure
Confidence: High
Simulation: low-privilege user changes an object id and accesses another workspace's document.

[2] Admin Export Abuse
Category: Privilege escalation
Target: app/api/admin/export/route.ts
Impact: bulk data export
Confidence: Medium
Simulation: authenticated non-admin user reaches an admin export endpoint.

[3] Support Bot Prompt Injection
Category: AI app security
Target: lib/support-bot/systemPrompt.ts
Impact: hidden instruction or customer context leakage
Confidence: Medium
Simulation: malicious user prompt causes the assistant to reveal protected context.

[4] Unsafe URL Preview
Category: Input and upload abuse
Target: app/api/preview/route.ts
Impact: server-side request forgery risk
Confidence: Medium
Simulation: user-controlled URL preview requests an internal-only address.

Which breach should I simulate?
```

### Phase 2: Breach Mission

Goal: confirm the selected candidate, simulate the breach, patch the root cause, add regression tests, and generate artifacts.

Agents:

- Recon Agent
- Attacker Agent
- Judge Agent
- Forensics Agent
- Patch Agent
- Test Agent
- Report Agent

The agents can run as separate Codex subagents when the user has explicitly authorized parallel agent work and platform rules allow it. Otherwise, BreachLab should execute the same role workflow sequentially in one agent and clearly note the fallback.

### Step 2.1: Recon

Recon maps the selected surface.

Responsibilities:

- Locate target files.
- Trace route flow.
- Identify auth checks.
- Identify data access patterns.
- Identify relevant tests and fixtures.
- Prepare context for Attacker and Patch agents.

Example status:

```text
Recon Agent
Mapped document route, session lookup, workspace membership model, and existing API tests.
```

### Step 2.2: Attack Confirmation

The Attacker Agent attempts to prove the selected breach path in a safe, local, authorized environment.

Evidence can be:

- Static proof from code flow
- Local request simulation
- Unit or integration test
- Browser replay using computer use
- Screenshot evidence from the local app

Example attack path:

```text
Breach confirmed.

Attack path:
1. Attacker authenticates as a normal workspace member.
2. Attacker opens their own document.
3. Attacker changes the document id in the route.
4. API fetches document by id only.
5. API returns another workspace's document without checking membership.
```

### Step 2.3: Judge Validation

Judge validates whether the breach is real.

Judge accepts only findings with:

- Clear affected target
- Reproducible local proof
- Meaningful impact
- Bounded scope
- Evidence that matches the selected category

Judge rejects:

- Vague scanner-style warnings
- Non-reproducible claims
- Out-of-scope network behavior
- Theoretical issues without an attack path
- Claims based only on suspicious names

Judge output:

```text
Judge Agent
Verdict: accepted
Reason: local replay demonstrates cross-workspace document access for a low-privilege user.
Severity: high
```

### Step 2.4: Computer-Use Replay

Computer use is the visual proof layer. It is optional for repos without a runnable UI, but it should be the centerpiece for web app demos.

Allowed target types:

- Localhost app started from the repo
- Local container
- User-approved staging environment
- Intentionally vulnerable benchmark app

Attacker Agent capabilities:

- Open the local app in a browser
- Log in with seeded or user-approved test credentials
- Click through visible UI
- Change route parameters or form inputs
- Upload safe test files
- Capture screenshots
- Record action timeline
- Replay the same steps after the patch

Guardrails:

- Use allowlisted hosts only.
- Prefer localhost or local containers.
- Never target third-party apps without explicit authorization.
- Do not enter real secrets, payment data, or private production credentials.
- Do not bypass CAPTCHAs or safety interstitials.
- Ask before submitting sensitive forms or changing persistent remote data.
- Keep exploit output as defensive evidence and regression tests.

Replay output:

```json
{
  "target": "http://localhost:3000",
  "steps": [
    { "action": "login", "account": "low_privilege_test_user" },
    { "action": "open", "path": "/documents/doc_1001" },
    { "action": "modify_path", "path": "/documents/doc_1002" },
    { "action": "observe", "result": "foreign_workspace_document_visible" }
  ],
  "screenshots": [
    "breachlab/evidence/cross-tenant-before.png"
  ]
}
```

### Step 2.5: Forensics Replay

Forensics turns the confirmed exploit into an incident narrative.

Responsibilities:

- Attack timeline
- Evidence board
- Estimated blast radius
- Detection signals
- Affected assets
- What defenders would observe

Example:

```text
Breach Replay: Cross-Tenant Document Access

00:00  Recon
       Attacker discovers document URLs in normal app navigation.

00:31  Initial Access
       Attacker logs in as a normal workspace member.

01:04  Probe
       Attacker opens /documents/doc_1001 and receives a permitted document.

01:21  Enumeration
       Attacker changes the id to /documents/doc_1002 and receives another workspace's document.

02:00  Exfiltration Risk
       Sensitive document content is visible in the browser.
```

### Step 2.6: Patch

Patch Agent remediates the root cause.

Responsibilities:

- Make scoped code edits.
- Preserve existing project patterns.
- Avoid unrelated refactors.
- Explain the root cause and fix.
- Prefer deny-by-default behavior.
- Avoid leaking object existence when appropriate.

Example remediation:

```text
Root cause:
The document route checked authentication but did not verify workspace membership.

Patch:
Scope document lookup by both document id and the authenticated user's workspace membership.
Return 404 for documents the user cannot access.
```

### Step 2.7: Regression Tests

Test Agent adds tests that prove the breach is closed.

Responsibilities:

- Follow existing test framework and style.
- Add focused regression tests.
- Run the narrowest useful test command.
- Run broader tests when risk is high and feasible.
- Report tests that could not be run.

Example:

```text
Added regression tests:
- allows user to access own workspace document
- blocks cross-workspace document access
- does not reveal whether unauthorized document exists
```

### Step 2.8: Verification Replay

Judge replays the original attack after the patch.

Success conditions:

- Original exploit no longer works.
- Regression test passes.
- Relevant app tests pass.
- No obvious new bypass was introduced.
- Computer-use replay now reaches a blocked state if UI replay is available.

Example:

```text
Verification passed.
Original replay now returns 404.
Focused API tests pass.
Patch accepted.
```

### Step 2.9: Report And Artifacts

Report Agent writes final artifacts under `breachlab/`. Discovery artifacts should be written for every run; simulation artifacts are written after a selected breach is investigated.

Recommended structure:

```text
breachlab/
  config.json
  discovery/
    2026-04-30T153000Z-candidates.json
    2026-04-30T153000Z-summary.md
  reports/
    selected-breach-report.md
  replays/
    selected-breach-timeline.json
  evidence/
    before.png
    after.png
  patches/
    selected-breach.diff
  scorecards/
    selected-breach.json
  dashboard/            # optional in skill v1
    selected-breach.html
```

Artifact contract:

- Discovery candidates: `breachlab/discovery/<timestamp>-candidates.json`
- Discovery summary: `breachlab/discovery/<timestamp>-summary.md`
- Report: `breachlab/reports/<slug>-report.md`
- Timeline: `breachlab/replays/<slug>-timeline.json`
- Scorecard: `breachlab/scorecards/<slug>.json`
- Patch diff: `breachlab/patches/<slug>.diff`
- Evidence: `breachlab/evidence/<slug>-before.png` and `breachlab/evidence/<slug>-after.png`, when computer-use replay is available

Patch diffs should be captured after remediation using normal `git diff` or equivalent read-only diff inspection.

Report contents:

- Title
- Executive summary
- Selected scenario
- Severity
- Affected files
- Attack path
- Evidence
- Root cause
- Remediation
- Tests added or changed
- Verification results
- Scorecard
- Residual risk
- Follow-up recommendations

## Breach Categories

MVP categories:

### 1. Broken Access Control

Examples:

- IDOR
- Missing ownership check
- Missing role check
- Tenant isolation failure
- Admin route reachable by authenticated non-admin users

Signals:

- Routes with object ids
- Database lookups by id only
- Auth checks without ownership checks
- Admin paths
- Role fields in schema
- Workspace, team, org, tenant, project, or document models

### 2. Secrets And Tokens

Examples:

- Committed API keys
- Unsafe `.env.example`
- Weak token generation
- Overexposed JWT claims
- Missing token rotation guidance

Signals:

- `.env`, `.env.example`, README setup instructions
- Token creation code
- JWT/session code
- Suspicious key-like strings
- Logs that may print credentials

### 3. AI App Security

Examples:

- Prompt injection
- System prompt leakage
- Unsafe tool calling
- Missing tool authorization
- Model output used in sensitive workflows without validation

Signals:

- System prompts
- OpenAI or LLM SDK usage
- Tool definitions
- Retrieval code
- Chatbot/support bot modules
- Agent loops and tool routers

### 4. Input And Upload Abuse

Examples:

- Path traversal
- Unsafe file upload
- SSRF
- Command injection
- Unsafe deserialization

Signals:

- Upload endpoints
- File path joins
- Shell execution
- URL fetchers
- User-controlled parsers
- Archive extraction

## Candidate Breach Schema

```json
{
  "id": "cross-tenant-document-access",
  "title": "Cross-Tenant Document Access",
  "category": "broken_access_control",
  "target_files": ["app/api/documents/[id]/route.ts"],
  "impact": "Private workspace document exposure",
  "confidence": "high",
  "verification_difficulty": "medium",
  "demo_value": "high",
  "simulation": "Low-privilege user changes a document id and accesses another workspace's document.",
  "phase": "candidate"
}
```

## Scorecard Schema

```json
{
  "breach_id": "cross-tenant-document-access",
  "category": "broken_access_control",
  "confirmed": true,
  "severity": 8.7,
  "exploitability": 8.9,
  "blast_radius": 7.4,
  "detection_difficulty": 6.5,
  "patch_confidence": 9.0,
  "regression_coverage": 8.6,
  "before_risk": "high",
  "after_risk": "low",
  "original_replay_blocked": true,
  "tests_passed": true
}
```

## Benchmark Harness

The benchmark harness lets BreachLab evaluate:

- Different models using the same BreachLab workflow
- Different workflows using the same model
- BreachLab versus scanner-only baselines
- BreachLab versus single-agent baselines

Benchmark principle:

```text
Same repo, same seeded challenge, same time limit, same tool budget, same judge oracle.
```

Benchmark dimensions:

- Candidate found
- Candidate correctly ranked
- Breach confirmed
- False positive avoided
- Patch produced
- Regression test added
- Original attack blocked
- Tests still pass
- Artifact quality
- Time
- Token cost
- Tool calls

Benchmark challenge schema:

```json
{
  "id": "team-doc-idor",
  "category": "broken_access_control",
  "repo": "sample-team-portal",
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

Comparable runs:

```text
BreachLab + Model A
BreachLab + Model B
BreachLab + Model C
Single-agent baseline + Model A
Scanner-only baseline
Human-authored ground truth patch
```

Important claim discipline:

```text
We are benchmarking both model capability and workflow effectiveness.
```

The strongest hackathon claim is likely:

```text
The multi-agent breach rehearsal workflow closes more seeded breaches than a scanner-only or single-agent flow under the same budget.
```

## Sample Repo Requirements

The sample repo should feel like a small real SaaS app, not a toy.

Working concept:

```text
TeamPortal
```

Features:

- Login with seeded test users
- Workspaces or teams
- Projects or documents
- Admin-only export or invite endpoint
- File upload or URL preview
- Support chatbot or AI assistant
- Basic tests

Seeded breach candidates:

- Broken access control: cross-team document or project access
- Privilege escalation: non-admin can call export or invite endpoint
- AI app security: support assistant leaks hidden instructions or calls unsafe tool
- Input abuse: URL preview SSRF or unsafe upload path
- Secrets hygiene: unsafe env/config pattern

The sample repo should include deterministic seed data and test credentials so computer-use replay is reliable.

## Security Arena Dashboard

The dashboard is the visual companion to the Codex Skill.

For the hackathon, the dashboard can live as a separate demo app. The first shareable skill package does not need to include dashboard generation, as long as the skill emits report, replay, and scorecard artifacts that a dashboard can consume later.

Required views:

- Discovery results
- Selected breach
- Agent mission board
- Creative arena modal
- Computer-use replay status
- Before and after risk
- Attack replay timeline
- Evidence cards
- Patch summary
- Test results
- Scorecard
- Benchmark comparison

Mission board agents:

```text
Recon       Maps target surface
Attacker    Confirms breach using code, requests, tests, or browser
Judge       Validates exploit and verifies patch
Forensics   Builds incident replay and blast radius
Patch       Fixes root cause
Test        Adds regression coverage
Report      Writes artifacts
```

### Creative Arena Modal

The creative arena modal is an optional hackathon visual layer that appears during Phase 2. It should make the red/blue/judge loop instantly legible to judges without changing the underlying BreachLab workflow.

The modal shows simple 2D characters or tokens in an arena:

- Attacker: attempts the breach replay.
- Defender: patches and strengthens the app.
- Judge: validates the exploit and verifies the fix.

The animation must be driven by real BreachLab mission events, not random gameplay. The modal is a visualization of workflow state.

Example event mapping:

```text
recon_started       Scout enters the arena and reveals the target map
breach_confirmed    Attacker lands a hit and risk meter rises
judge_accepted      Judge badge appears and locks the finding
forensics_started   Timeline trail animates behind the attacker
patch_applied       Defender builds a shield around the vulnerable route
tests_passed        Shield hardens and coverage meter fills
replay_blocked      Attacker replay bounces off the shield
report_written      Scorecard appears and mission completes
```

Event schema:

```json
[
  { "type": "recon_started", "label": "Recon mapped the target route" },
  { "type": "breach_confirmed", "label": "Attacker confirmed cross-tenant access" },
  { "type": "judge_accepted", "label": "Judge accepted the evidence" },
  { "type": "patch_applied", "label": "Defender patched the root cause" },
  { "type": "tests_passed", "label": "Regression tests passed" },
  { "type": "replay_blocked", "label": "Original replay is blocked" },
  { "type": "report_written", "label": "Incident report written" }
]
```

MVP implementation can use plain HTML, CSS, and JavaScript:

- Modal overlay
- Attacker, defender, and judge tokens
- Risk meter
- Patch confidence meter
- Event captions
- CSS animations for hit, shield, verify, and blocked replay states

This should remain optional. The core product value is still verified breach rehearsal, patching, tests, artifacts, and benchmark results.

## MVP Scope

Must have:

- Codex Skill spec for BreachLab
- Phase 1 discovery flow
- Candidate breach menu
- User selects one breach
- Phase 2 mission board
- One confirmed breach path
- Scoped patch
- Regression test
- Final Markdown report
- Scorecard JSON
- Seeded sample repo
- Deterministic repo map helper
- Normalized artifact writer

Should have:

- Computer-use attacker replay on localhost
- Before and after screenshots
- Judge verification replay
- Benchmark challenge schema
- At least two model/workflow comparison runs
- Multiple candidate categories in discovery
- Static dashboard or visual companion app
- Creative arena modal driven by mission events

Nice to have:

- Real pull request generation
- Persistent drill history
- Multiple frameworks
- CI integration
- Cloud/staging target support
- Dashboard generated from actual scorecard JSON

## Demo Script

### Step 1: Invoke

```text
Run BreachLab on this repo.
```

Expected:

```text
BreachLab initialized.
Scanning repository.
Deploying discovery agents.
```

### Step 2: Discovery

Show candidate breaches.

Narration:

```text
BreachLab adapts the breach menu to the actual repo. It does not claim anything is confirmed yet.
```

### Step 3: Select

User selects the strongest candidate, preferably broken access control.

```text
Simulate 1.
```

### Step 4: Mission Board

Show agents moving through states:

```text
Recon       running
Attacker    queued
Judge       queued
Forensics   queued
Patch       queued
Test        queued
Report      queued
```

### Step 5: Computer-Use Replay

Attacker opens the local app, logs in as a low-privilege test user, performs the breach path, and captures evidence.

### Step 6: Judge Confirms

Expected:

```text
Breach confirmed.
The low-privilege user can access another workspace's private document.
```

### Step 7: Patch And Test

Expected:

```text
Files changed:
- app/api/documents/[id]/route.ts
- tests/api/documents.test.ts

Focused tests pass.
```

### Step 8: Replay After Patch

Computer-use attacker replays the same steps.

Expected:

```text
Original attack now returns 404.
Judge verification passed.
```

### Step 9: Artifacts

Expected:

```text
Artifacts written:
- breachlab/reports/cross-tenant-document-access-report.md
- breachlab/replays/cross-tenant-document-access-timeline.json
- breachlab/evidence/before.png
- breachlab/evidence/after.png
- breachlab/scorecards/cross-tenant-document-access.json
- breachlab/dashboard/cross-tenant-document-access.html (optional visual companion)
```

### Step 10: Pitch Takeaway

```text
Security tools tell developers what might be wrong. BreachLab rehearses the breach, fixes the code, and leaves behind the tests, replay, scorecard, and incident report.
```

## Open Design Questions

1. Should computer-use replay be required for the demo path, or optional when a dev server is unavailable?
2. Which sample repo stack gives us the fastest reliable demo: Next.js, Express, or FastAPI?
3. How many benchmark scenarios can we realistically seed during the hackathon?
4. Do we compare models directly, workflows directly, or both?

## Build Plan

### Track A: Codex Skill

- Create the shareable `breachlab/` skill package.
- Add Phase 1 and Phase 2 instructions.
- Add candidate schema and output templates.
- Add safety and authorization guardrails.
- Add artifact-writing instructions.
- Add `agents/openai.yaml`.
- Add references for breach catalog, agent roles, report format, and safety policy.
- Add repo-local config handling for BreachLab consent.

### Track B: Deterministic Helpers

- Add `scripts/repo_map.py` for read-only repository mapping.
- Add `scripts/write_artifacts.py` for normalized discovery, report, timeline, scorecard, and diff paths.
- Validate scripts against fixture repos.
- Keep helpers optional enough that BreachLab can still proceed manually if a script fails.

### Track C: Dashboard

- Rebrand prototype from Security Arena to BreachLab.
- Add discovery menu.
- Add mission board with all agents.
- Add computer-use replay panel.
- Add scorecard and benchmark comparison.
- Make data load from JSON or inline fixtures.

### Track D: Sample Repo

- Build small SaaS-like web app.
- Add seeded users and data.
- Seed at least two breach candidates.
- Add one deterministic broken access control scenario.
- Add tests that fail before patch and pass after patch.

### Track E: Benchmark Harness

- Define challenge JSON schema.
- Add runner script that resets repo, runs BreachLab/baseline, and records metrics.
- Support multiple model labels and workflow labels.
- Generate scorecard JSON.

## Validation Plan

Skill validation:

- Verify `SKILL.md` frontmatter has only `name` and `description`.
- Verify `agents/openai.yaml` matches the skill purpose.
- Run the skill validation flow from `skill-creator` when the package exists.

Script validation:

- Run `repo_map.py` against fixture directories for a Next.js/Prisma-style app, a generic Node/Express-style app, and a minimal repo with no obvious web surface.
- Confirm the scanner is read-only and produces stable JSON.
- Run `write_artifacts.py` with sample candidate/report data and confirm paths and JSON are valid.

Workflow validation:

- Phase 1 on a seeded web app finds at least one broken access control candidate.
- Phase 1 on a repo with LLM prompt/tool files finds an AI app security candidate.
- Phase 1 on a repo with `.env.example` and suspicious token patterns finds a secrets hygiene candidate.
- Phase 2 for a selected access-control path produces proof, patch, focused test, report, replay, scorecard, and diff.
- Consent flow writes `breachlab/config.json` only after explicit "don't ask again" language.
- Sequential fallback still completes the role workflow when subagents are unavailable or not authorized.

## Final Product Description

BreachLab is a Codex Skill that brings an autonomous breach rehearsal team into a developer's repo. It first discovers plausible breach scenarios tailored to the codebase. Then the developer chooses one, and BreachLab uses specialized agents to verify the exploit, replay the incident, patch the vulnerability, add regression tests, rerun the original attack, and generate an incident report with evidence and a scorecard.

It is part security scanner, part breach simulation, part remediation engineer, and part incident report generator.
