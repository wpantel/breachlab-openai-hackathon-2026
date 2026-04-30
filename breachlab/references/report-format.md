# Report Format

## Artifact Paths

Discovery:

```text
breachlab/discovery/2026-04-30T120000Z-candidates.json
breachlab/discovery/2026-04-30T120000Z-summary.md
```

Simulation:

```text
breachlab/reports/cross-tenant-document-access-report.md
breachlab/replays/cross-tenant-document-access-timeline.json
breachlab/scorecards/cross-tenant-document-access.json
breachlab/patches/cross-tenant-document-access.diff
breachlab/evidence/cross-tenant-document-access-before.png
breachlab/evidence/cross-tenant-document-access-after.png
```

## Markdown Report Example

```markdown
# BreachLab Incident Replay: Cross-Tenant Document Access

## Executive Summary

BreachLab confirmed a broken access control flaw in the document API. A low-privilege user from the red workspace could access a private blue workspace document by changing the document id. The route now scopes document lookup by authenticated workspace membership, and regression tests verify cross-workspace access returns 404.

## Scenario

- Category: broken_access_control
- Severity: high
- Affected files: app/api/documents/[id]/route.ts, tests/api/documents.test.ts

## Attack Path

1. Attacker authenticates as user-red, a member of team-red.
2. Attacker requests /api/documents/doc-blue-budget.
3. Vulnerable route returns the blue workspace document because lookup used document id only.

## Evidence

- Proof type: local_test
- Before patch: cross-team document request returned 200 and Blue Team Budget.
- After patch: same request returned 404 and Document not found.

## Root Cause

The document route checked authentication but did not verify that the requested document belonged to the authenticated user's workspace.

## Remediation

The route now scopes document lookup by both document id and workspace membership derived from the server-side session.

## Tests

- Added: blocks cross-workspace document access
- Commands run: npm test -- documents
- Result: pass

## Scorecard

- Exploitability: 8.9/10
- Blast radius: 7.4/10
- Detection difficulty: 6.5/10
- Patch confidence: 9.0/10
- Regression coverage: 8.6/10
- Before risk: high
- After risk: low

## Residual Risk

Other object lookup routes should be reviewed for the same ownership pattern.

## Follow-Up Recommendations

- Add authorization regression tests for all routes that fetch data by object id.
- Add anomaly detection for repeated document id probing.
```

## Timeline JSON

```json
{
  "breach_id": "cross-tenant-document-access",
  "title": "Cross-Tenant Document Access",
  "events": [
    {
      "time": "00:00",
      "phase": "Recon",
      "event": "Attacker discovers document route",
      "evidence": "route map"
    }
  ]
}
```

## Scorecard JSON

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

## Discovery Candidates JSON

```json
{
  "generated_at": "2026-04-30T00:00:00Z",
  "repo": "repo-name",
  "candidates": [
    {
      "id": "cross-tenant-document-access",
      "title": "Cross-Tenant Document Access",
      "category": "broken_access_control",
      "target_files": ["app/api/documents/[id]/route.ts"],
      "impact": "Private workspace document exposure",
      "confidence": "high",
      "simulation": "Low-privilege user changes an object id and accesses another workspace's document.",
      "phase": "candidate"
    }
  ]
}
```
