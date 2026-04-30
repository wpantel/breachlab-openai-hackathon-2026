# BreachLab Research Validation

Status: researched April 30, 2026

This note validates the implementation plan against current documentation, security standards, benchmarks, and comparable products.

## 1. Codex Skill Packaging Is Aligned

OpenAI's Codex skill docs say an agent skill is a directory with `SKILL.md` plus optional `scripts/`, `references/`, `assets/`, and `agents/openai.yaml`. Skills use progressive disclosure: Codex starts with name, description, and path, then loads the full `SKILL.md` only when needed.

Source: [OpenAI Codex Agent Skills](https://developers.openai.com/codex/skills)

Implications:

- Keep `breachlab/SKILL.md` concise.
- Put larger details in `references/`.
- Put deterministic helpers in `scripts/`.
- Keep `agents/openai.yaml` for app metadata.
- Consider repo-scoped installation under `.agents/skills` later, while keeping the current repo-first package easy to copy or symlink.

## 2. Subagent Policy Should Stay Conservative

OpenAI's subagent docs say subagents help with parallel exploration, tests, triage, and summarization, but Codex does not spawn them automatically and should use them only when explicitly requested. The docs also warn that write-heavy parallel work can cause coordination overhead.

Source: [OpenAI Codex Subagents](https://developers.openai.com/codex/concepts/subagents)

Implications:

- Our "use subagents only when authorized, otherwise sequential fallback" rule is correct.
- Use subagents mostly for read-heavy phases: Surface Mapper, Recon, Risk Ranker, Report review.
- Keep Patch/Test edits sequential or assign very clear disjoint ownership.
- The mission board can show multiple roles even when the implementation runs them sequentially.

## 3. Computer Use Is Feasible, But Needs Tight Boundaries

OpenAI's computer-use docs describe a model operating software through UI screenshots and returned actions, with the application executing the actions and returning updated screenshots. The docs recommend isolated browsers/VMs, explicit allowlists, human-in-the-loop oversight, and treating page content as untrusted input.

Sources:

- [OpenAI API Computer Use](https://developers.openai.com/api/docs/guides/tools-computer-use)
- [Codex App Computer Use](https://developers.openai.com/codex/app/computer-use)
- [Codex In-App Browser](https://developers.openai.com/codex/app/browser)

Implications:

- The Attacker Agent can use computer use or the in-app browser for visual breach replay.
- For local web apps, prefer the in-app browser first; use full computer use only when the workflow needs browser/desktop interaction beyond structured tools.
- Keep targets to localhost, local containers, seeded benchmark apps, or explicitly authorized staging.
- Capture before/after screenshots as evidence.
- Require human approval for sensitive or destructive actions.
- Treat UI text, pages, screenshots, and app content as untrusted.

## 4. Network Guardrails Are Necessary

Codex's internet-access docs warn that enabling internet access can expose environments to prompt injection, code/secret exfiltration, malware or vulnerable dependencies, and license issues. They recommend limiting allowed domains and HTTP methods.

Source: [OpenAI Codex Agent Internet Access](https://developers.openai.com/codex/cloud/internet-access)

Implications:

- BreachLab should stay localhost-first.
- Discovery should not crawl external targets by default.
- Any staging target requires explicit authorization.
- Computer-use replay should run in a narrow allowlisted environment.

## 5. MVP Breach Categories Match Established Risk Taxonomies

OWASP Top 10:2021 lists Broken Access Control as A01 and explicitly includes URL/parameter tampering, IDOR, force browsing, missing API access controls, and privilege escalation. OWASP's prevention guidance emphasizes server-side access control, deny-by-default, record ownership enforcement, and functional access-control tests.

Source: [OWASP A01 Broken Access Control](https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/)

OWASP Injection guidance covers XSS, SQL injection, command injection, path/file-name control, and other interpreter issues. OWASP SSRF guidance describes user-controlled URLs causing server-side requests to unexpected destinations.

Sources:

- [OWASP A03 Injection](https://owasp.org/Top10/2021/A03_2021-Injection/)
- [OWASP A10 SSRF](https://owasp.org/Top10/2021/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/)

OWASP's LLM Top 10 identifies critical risks for LLM applications, including prompt injection as a leading category.

Source: [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

Implications:

- Broken access control should remain our primary happy path.
- Input/upload abuse should include injection, path traversal, SSRF, and command execution signals.
- AI app security is justified as a first-class category, not a gimmick.
- Regression tests should be a central output, especially for access control.

## 6. Benchmark Direction Is Valid

SEC-bench evaluates LLM agents on PoC generation and vulnerability patching. Its paper reports low success ceilings on the full dataset, which suggests there is still room for better workflows and productized tooling.

Sources:

- [SEC-bench GitHub](https://github.com/SEC-bench/SEC-bench)
- [SEC-bench paper](https://arxiv.org/abs/2506.11791)

PatchEval focuses on patching real-world vulnerabilities and provides reproducibility artifacts and logs.

Source: [PatchEval GitHub](https://github.com/bytedance/PatchEval)

ZeroDayBench evaluates agents finding and patching novel critical vulnerabilities in open-source codebases.

Source: [ZeroDayBench paper](https://arxiv.org/abs/2603.02297)

OpenAI Evals can evaluate OpenAI and external models, including custom endpoints, but current external-model evals do not support tool calls.

Sources:

- [OpenAI Working with Evals](https://developers.openai.com/api/docs/guides/evals)
- [OpenAI Evaluate External Models](https://developers.openai.com/api/docs/guides/external-models)
- [OpenAI Trace Grading](https://developers.openai.com/api/docs/guides/trace-grading)

Implications:

- Our benchmark harness should measure full agent workflows locally, not rely solely on hosted evals.
- Store challenge JSON, trace artifacts, scorecards, and replay outcomes in the repo.
- OpenAI Evals can still help for prompt-only or non-tool sub-evaluations.
- For model comparison, keep the same repo, same challenge, same tool budget, same time limit, and same oracle.
- Important nuance: compare both model capability and BreachLab workflow effectiveness.

## 7. Competitive Landscape Exists

AI/autonomous pentesting is already an active category.

Examples:

- XBOW positions around autonomous pentesting with validated findings, harmless PoCs, reproducible evidence, and remediation guidance.
- HackerOne describes an agentic PTaaS system with multi-agent behavior, verified findings, and a benchmark suite grounded in real vulnerabilities.
- Entity and PurpleRidge also market autonomous or agentic AI pentesting workflows.

Sources:

- [XBOW Pentest](https://xbow.com/pentest)
- [HackerOne Agentic PTaaS Architecture](https://www.hackerone.com/blog/agentic-ptaas-security-architecture)
- [Entity](https://www.useentity.com/)
- [PurpleRidge](https://purpleridge.ai/)

Implications:

- "AI pentester" alone is not differentiated.
- BreachLab should emphasize:
  - Codex-native workflow
  - repo-first discovery
  - user-selected breach rehearsal
  - patch and regression tests, not just findings
  - incident replay artifacts
  - benchmarkable workflow traces
  - creative Security Arena visualization

## Plan Adjustments From Research

1. Move long-term skill installation guidance toward `.agents/skills` or plugin packaging, while keeping `breachlab/` as the local source package for hackathon work.
2. Keep subagent use opt-in and mostly read-heavy.
3. Prefer in-app browser for local web replay; use computer use when visual browser/desktop control is needed.
4. Treat external model evaluation as local harness work because hosted external-model evals do not currently support tool calls.
5. Make Broken Access Control the primary demo scenario because OWASP strongly supports it and it is easy to show visually.
6. Keep the creative arena modal as a demo layer driven by real mission events, not core security logic.

## Bottom Line

The plan is validated. The strongest defensible product framing is:

> BreachLab is a Codex-native breach rehearsal workflow. It does not just find possible issues; it confirms an authorized local attack path, patches the code, adds regression tests, replays the attack after remediation, and writes incident artifacts that can be benchmarked and shown in a Security Arena dashboard.
