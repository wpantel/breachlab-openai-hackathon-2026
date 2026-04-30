# Breach Catalog

Use this during Phase 1 discovery and Phase 2 candidate-specific reasoning.

## Broken Access Control

Signals:

- Routes with object identifiers in path or query parameters.
- Database lookups by `id` without owner, workspace, org, tenant, or role constraints.
- Admin routes protected only by authentication.
- Client-controlled role, user id, workspace id, or tenant id values.
- Models named user, account, team, workspace, org, tenant, project, document, invoice, export, invite, membership, role, or permission.

Candidate template:

```json
{
  "id": "cross-tenant-object-access",
  "title": "Cross-Tenant Object Access",
  "category": "broken_access_control",
  "target_files": ["app/api/documents/[id]/route.ts"],
  "impact": "Private workspace data exposure",
  "confidence": "high",
  "simulation": "Low-privilege user changes an object id and receives another workspace's data.",
  "phase": "candidate"
}
```

Patch strategy:

- Derive identity and authorization from server-side session.
- Scope data lookup by both object id and owner/workspace/tenant membership.
- Return `404` or `403` consistently without leaking unauthorized object existence.
- Add regression tests for allowed access and cross-boundary denial.

## Secrets And Tokens

Signals:

- `.env`, `.env.example`, `README`, CI files, deployment files, and logs.
- Key-like strings with prefixes such as `sk_`, `pk_`, `ghp_`, `xoxb-`, `AKIA`, `-----BEGIN`.
- Token creation code using weak randomness or long-lived secrets.
- JWT/session claims that expose internal permissions or tenant identifiers.

Candidate template:

```json
{
  "id": "unsafe-secret-workflow",
  "title": "Unsafe Secret Workflow",
  "category": "secrets_and_tokens",
  "target_files": [".env.example", "README.md"],
  "impact": "Credential leakage or unsafe key reuse",
  "confidence": "medium",
  "simulation": "Attacker discovers reusable test or staging token patterns from repository guidance.",
  "phase": "candidate"
}
```

Patch strategy:

- Remove committed secrets and replace them with placeholders.
- Add safe examples that cannot be confused with real keys.
- Scrub logs that print tokens.
- Add secret-pattern tests or preflight checks when project style supports them.

## AI App Security

Signals:

- System prompts, model calls, tool definitions, retrieval code, agent loops, support bots, and assistant routes.
- Tools that read private data, send messages, export data, or mutate state.
- Model output used directly in authorization, shell commands, SQL, file paths, or outbound requests.
- Missing tool authorization or missing separation between user prompt and trusted instructions.

Candidate template:

```json
{
  "id": "support-bot-prompt-injection",
  "title": "Support Bot Prompt Injection",
  "category": "ai_app_security",
  "target_files": ["lib/support-bot/systemPrompt.ts"],
  "impact": "Hidden instruction or customer context leakage",
  "confidence": "medium",
  "simulation": "Malicious user prompt causes the assistant to reveal protected context or call an unsafe tool.",
  "phase": "candidate"
}
```

Patch strategy:

- Add tool-level authorization checks.
- Treat user content as untrusted data.
- Avoid placing secrets in prompts.
- Add tests for prompt injection strings and unauthorized tool calls.

## Input And Upload Abuse

Signals:

- File upload, archive extraction, image processing, URL preview, webhook, parser, import, or export endpoints.
- `fetch`, `axios`, `request`, `child_process`, `exec`, `spawn`, `path.join`, `fs.readFile`, `fs.writeFile`, and deserialization calls near user input.
- User-controlled URL, filename, path, command, template, query, or parser input.

Candidate template:

```json
{
  "id": "unsafe-url-preview",
  "title": "Unsafe URL Preview",
  "category": "input_and_upload_abuse",
  "target_files": ["app/api/preview/route.ts"],
  "impact": "Server-side request forgery risk",
  "confidence": "medium",
  "simulation": "User-controlled URL preview attempts to request an internal-only address.",
  "phase": "candidate"
}
```

Patch strategy:

- Parse URLs with standard libraries.
- Block private, loopback, link-local, and metadata address ranges.
- Use allowlists for external hosts when practical.
- Normalize and constrain file paths under a safe root.
- Add regression tests for malicious URLs, traversal paths, and denied commands.
