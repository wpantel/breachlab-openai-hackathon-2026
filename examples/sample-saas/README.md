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

Replay:

```bash
curl -H "x-user-id: user-red" http://localhost:3000/api/documents/doc-blue-budget
```

Expected vulnerable behavior: the red user can read the blue team document.

Run secure tests:

```bash
npm test -- documents
```
