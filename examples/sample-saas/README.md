# BreachLab Sample SaaS

This is a deterministic local demo app for BreachLab.

## Accounts

- `user-red`: member of `team-red`
- `user-blue`: member of `team-blue`
- `admin-red`: admin of `team-red`

Use the `x-user-id` header for API requests.

## Demo Routes

- `GET /api/documents/doc-red-roadmap`
- `GET /api/documents/doc-blue-budget`
- `POST /api/admin/export`
- `POST /api/preview`

## BreachLab Happy Path

Run the app in vulnerable mode:

```bash
npm run dev
```

Open the founder-facing demo UI:

```text
http://localhost:3000
```

Replay:

```bash
curl -H "x-user-id: user-red" http://localhost:3000/api/documents/doc-blue-budget
```

Expected vulnerable behavior: the red user can read the blue team document.

Run secure tests:

```bash
npm test -- documents
```

## Browser Replay Evidence

The sample app includes a portable Browser Replay Agent powered by Playwright.
It launches the Northstar Rooms UI twice:

- before: vulnerable mode, where `user-red` can view the Bluepeak private document
- after: secure mode, where the same browser path is blocked

Install Playwright's Chromium browser once if needed:

```bash
npx playwright install chromium
```

Run the replay:

```bash
npm run replay:browser
```

Expected artifacts:

```text
breachlab/evidence/cross-tenant-document-access-before.png
breachlab/evidence/cross-tenant-document-access-after.png
breachlab/evidence/cross-tenant-document-access-browser-replay.json
```

For a visible browser during the pitch:

```bash
npm run replay:browser -- --headed
```
