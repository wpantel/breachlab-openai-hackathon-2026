# Agent Roles

BreachLab can run these roles as subagents only when the user explicitly authorizes subagent work. Otherwise, run them sequentially in the main agent and report that fallback.

## Recon Agent

Inputs:

- Selected candidate JSON.
- Repository map.
- Relevant files and tests.

Responsibilities:

- Locate target files.
- Trace route or function flow.
- Identify auth checks and data boundaries.
- Identify test fixtures and seed data.

Output:

```json
{
  "role": "recon",
  "status": "complete",
  "target_files": ["app/api/documents/[id]/route.ts"],
  "auth_flow": "session user is read before document lookup",
  "data_boundary": "workspace membership",
  "test_targets": ["tests/api/documents.test.ts"]
}
```

## Attacker Agent

Responsibilities:

- Confirm the selected candidate with safe local evidence.
- Prefer test proof, local request proof, static proof, or approved localhost browser replay.
- Record prerequisites and expected impact.

Output:

```json
{
  "role": "attacker",
  "verdict": "confirmed",
  "proof_type": "local_test",
  "attack_path": [
    "Authenticate as low-privilege user",
    "Request another workspace's document id",
    "Observe document content returned"
  ]
}
```

## Judge Agent

Responsibilities:

- Accept only reproducible, scoped, meaningful evidence.
- Reject vague warnings, out-of-scope targets, non-reproducible claims, and suspicious names without proof.
- Re-run or inspect the original proof after patching.

Output:

```json
{
  "role": "judge",
  "verdict": "accepted",
  "reason": "Local test demonstrates cross-workspace access before patch and denial after patch.",
  "severity": "high"
}
```

## Forensics Agent

Responsibilities:

- Build incident replay timeline.
- Estimate affected assets and blast radius from available repo data.
- List likely detection signals.

Output:

```json
{
  "role": "forensics",
  "timeline": [
    { "time": "00:00", "phase": "Recon", "event": "Attacker discovers document route" },
    { "time": "01:04", "phase": "Probe", "event": "Attacker changes document id" }
  ],
  "blast_radius": "private workspace documents exposed through direct id access"
}
```

## Patch Agent

Responsibilities:

- Patch the root cause with the smallest maintainable change.
- Preserve project style.
- Avoid unrelated refactors.
- Prefer deny-by-default authorization.

Output:

```json
{
  "role": "patch",
  "files_changed": ["app/api/documents/[id]/route.ts"],
  "summary": "Scoped document lookup by authenticated workspace membership."
}
```

## Test Agent

Responsibilities:

- Add regression coverage in existing test style.
- Run focused tests first.
- Report commands that could not be run.

Output:

```json
{
  "role": "test",
  "tests_added": ["blocks cross-workspace document access"],
  "commands": ["npm test -- documents"],
  "result": "pass"
}
```

## Report Agent

Responsibilities:

- Write Markdown report, timeline JSON, scorecard JSON, and patch diff.
- Reference evidence files when present.
- Include residual risk and follow-up recommendations.

Output:

```json
{
  "role": "report",
  "artifacts": [
    "breachlab/reports/cross-tenant-document-access-report.md",
    "breachlab/replays/cross-tenant-document-access-timeline.json",
    "breachlab/scorecards/cross-tenant-document-access.json"
  ]
}
```
