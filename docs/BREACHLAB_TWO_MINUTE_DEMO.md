# BreachLab Two-Minute Demo Run-Through

## Demo Goal

Show BreachLab as a safe, repo-local way for developers to turn frontier AI cyber capability into defensive security work. The demo should make one idea unmistakable: BreachLab does not just find a possible issue. It rehearses a realistic breach, verifies it, patches it, adds a regression test, and documents the fix.

## 0:00-0:15 - Opening Hook

**Say:**

> As frontier AI becomes cyber-capable, developers need safe tools that turn those capabilities into defensive workflows. BreachLab lets any developer run a controlled breach rehearsal on their own repo, then verifies, patches, tests, and documents the fix.

Then add:

> Instead of asking developers to interpret a long static scan report, BreachLab shows them a realistic attack path in their actual codebase, and then closes the loop.

**Show:**

- Codex open inside the sample SaaS repo.
- The repo should already be ready so the first action feels fast and intentional.

**Highlight:**

- Frontier AI creates new security risk, but BreachLab redirects that capability into safe defensive workflows.
- The workflow is local, authorized, and developer-controlled.

## 0:15-0:40 - Start The BreachLab Skill

**Say:**

> Here, we are in a small SaaS app. We invoke the BreachLab skill, and it begins by mapping the repo: routes, auth boundaries, data models, tests, and any AI or tool-calling surfaces.

Then:

> It does not immediately claim everything is vulnerable. It proposes plausible breach simulations and lets the developer choose what to test.

**Show:**

- Run the BreachLab skill from Codex.
- Show BreachLab mapping the repository.
- Show a short list of candidate breach simulations.

**Good candidate options to show:**

- Cross-tenant document access.
- Admin export abuse.
- Prompt or tool injection path, if the sample repo supports it.

**Highlight:**

- BreachLab speaks in terms of plausible simulations before confirmation.
- The developer stays in control by choosing which rehearsal to run.
- This is more actionable than a generic vulnerability list.

## 0:40-1:10 - Run The Controlled Breach

**Say:**

> We will select cross-tenant document access. BreachLab now runs a controlled rehearsal: first as a recon agent, then as an attacker, then as a judge that verifies whether the breach actually worked.

Then:

> The key point is that this is local, authorized, and reproducible. We are not generating vague advice. We are producing evidence: here is the request, here is the broken authorization boundary, and here is the impact.

**Show:**

- Select the cross-tenant document access scenario.
- Show the controlled attack attempt.
- Show evidence that a low-privilege user can access data they should not see.

**Highlight:**

- The breach is demonstrated against the local repo, not an external target.
- BreachLab verifies the issue instead of assuming it exists.
- The output should feel like evidence, not speculation.

## 1:10-1:40 - Patch, Test, And Verify

**Say:**

> Once the issue is confirmed, BreachLab moves into defensive mode. It patches the root cause, adds a regression test, and reruns the same breach attempt.

Then:

> Now the original attack fails, and the regression test captures the expected behavior so this does not silently come back later.

**Show:**

- A small code diff or patch summary.
- The new regression test.
- The rerun where the original breach attempt now fails.
- Passing test output.

**Highlight:**

- The product is not an "AI hacker" demo.
- The core value is a closed-loop defensive workflow.
- Patching and regression tests are first-class outputs, not afterthoughts.

## 1:40-2:00 - Conclusion And Artifact

**Say:**

> At the end, BreachLab leaves behind a developer-ready incident package: what was tested, what succeeded, what changed, and how we know the fix works.

Close with:

> That is the shift BreachLab is built around: frontier cyber capability, redirected into safe, repo-local security practice. Developers do not just get a warning. They get a rehearsal, a fix, a test, and a record they can trust.

**Show:**

- The final report or incident package.
- A concise scorecard or summary of the rehearsal.
- The passing regression test as proof that the fix is durable.

**Highlight:**

- BreachLab leaves artifacts a team can review later.
- The output can support code review, security review, or a post-fix audit trail.
- The demo ends on trust and proof, not fear.

## Key Messages To Repeat

- BreachLab is safe and controlled: owned repo, local rehearsal, developer-approved flow.
- BreachLab is repo-native: it works where developers already are, inside Codex.
- BreachLab is evidence-based: it confirms whether a breach path actually works.
- BreachLab is defensive by design: it patches, tests, and verifies.
- BreachLab leaves a useful artifact: a report, replay, and regression test record.

## Demo Tone

The demo should feel calm, capable, and practical. The emotional arc is:

1. Frontier AI creates real security pressure.
2. Developers need safe ways to use that capability defensively.
3. BreachLab turns a risky capability into a controlled workflow.
4. The result is not just a warning. It is a verified fix with proof.
