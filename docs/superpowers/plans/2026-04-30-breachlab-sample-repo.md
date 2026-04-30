# BreachLab Sample Repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic sample SaaS app with seeded breach candidates and one reliable broken-access-control happy path.

**Architecture:** A tiny Express app stores seeded users, teams, documents, and admin state in memory. The vulnerable document endpoint returns documents by id only; the fixed behavior scopes by the authenticated user's team.

**Tech Stack:** Node.js, Express, Jest, Supertest.

---

## File Structure

- Create: `examples/sample-saas/package.json` - scripts and dependencies.
- Create: `examples/sample-saas/src/data.js` - deterministic seed data.
- Create: `examples/sample-saas/src/app.js` - Express routes and vulnerability toggle.
- Create: `examples/sample-saas/src/server.js` - local dev server.
- Create: `examples/sample-saas/tests/documents.test.js` - access-control regression tests.
- Create: `examples/sample-saas/README.md` - demo credentials and route map.
- Create: `examples/sample-saas/.env.example` - harmless config with a secrets-hygiene signal.

## Tasks

### Task 1: Create Package And Seed Data

**Files:**
- Create: `examples/sample-saas/package.json`
- Create: `examples/sample-saas/src/data.js`

- [ ] **Step 1: Create directories**

Run:

```bash
mkdir -p examples/sample-saas/src examples/sample-saas/tests
```

Expected: command exits with status `0`.

- [ ] **Step 2: Write `package.json`**

Create `examples/sample-saas/package.json` with:

```json
{
  "name": "breachlab-sample-saas",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "node src/server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "express": "^4.18.3"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 3: Write seed data**

Create `examples/sample-saas/src/data.js` with:

```javascript
const users = {
  "user-red": { id: "user-red", name: "Riley Reader", teamId: "team-red", role: "member" },
  "user-blue": { id: "user-blue", name: "Blair Builder", teamId: "team-blue", role: "member" },
  "admin-red": { id: "admin-red", name: "Avery Admin", teamId: "team-red", role: "admin" },
};

const documents = {
  "doc-red-roadmap": {
    id: "doc-red-roadmap",
    teamId: "team-red",
    title: "Red Team Roadmap",
    body: "Q2 launch plan for the red workspace.",
  },
  "doc-blue-budget": {
    id: "doc-blue-budget",
    teamId: "team-blue",
    title: "Blue Team Budget",
    body: "Private budget notes for the blue workspace.",
  },
};

module.exports = { users, documents };
```

### Task 2: Write Failing Access-Control Tests

**Files:**
- Create: `examples/sample-saas/tests/documents.test.js`

- [ ] **Step 1: Write tests**

Create `examples/sample-saas/tests/documents.test.js` with:

```javascript
const request = require("supertest");
const { createApp } = require("../src/app");

describe("Document API authorization", () => {
  test("allows a user to read their own team document", async () => {
    const app = createApp({ secureDocuments: true });

    const response = await request(app)
      .get("/api/documents/doc-red-roadmap")
      .set("x-user-id", "user-red");

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Red Team Roadmap");
  });

  test("blocks cross-team document access", async () => {
    const app = createApp({ secureDocuments: true });

    const response = await request(app)
      .get("/api/documents/doc-blue-budget")
      .set("x-user-id", "user-red");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Document not found");
  });

  test("demonstrates the seeded vulnerable behavior for BreachLab replay", async () => {
    const app = createApp({ secureDocuments: false });

    const response = await request(app)
      .get("/api/documents/doc-blue-budget")
      .set("x-user-id", "user-red");

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Blue Team Budget");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd examples/sample-saas && npm test -- documents
```

Expected: fails because `src/app.js` does not exist.

### Task 3: Implement Express App

**Files:**
- Create: `examples/sample-saas/src/app.js`
- Create: `examples/sample-saas/src/server.js`

- [ ] **Step 1: Write app code**

Create `examples/sample-saas/src/app.js` with:

```javascript
const express = require("express");
const { users, documents } = require("./data");

function currentUser(req) {
  const userId = req.header("x-user-id");
  return users[userId] || null;
}

function createApp(options = {}) {
  const secureDocuments = options.secureDocuments !== false;
  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => {
    res.type("html").send(`
      <main>
        <h1>BreachLab Sample SaaS</h1>
        <p>Use x-user-id: user-red for the low-privilege replay.</p>
        <a href="/documents/doc-red-roadmap">Own document</a>
        <a href="/documents/doc-blue-budget">Cross-team document</a>
      </main>
    `);
  });

  app.get("/documents/:id", (req, res) => {
    const user = currentUser(req) || users["user-red"];
    const document = documents[req.params.id];
    if (!document) {
      return res.status(404).send("<h1>Document not found</h1>");
    }
    if (secureDocuments && document.teamId !== user.teamId) {
      return res.status(404).send("<h1>Document not found</h1>");
    }
    return res.type("html").send(`<h1>${document.title}</h1><p>${document.body}</p>`);
  });

  app.get("/api/documents/:id", (req, res) => {
    const user = currentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const document = documents[req.params.id];
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (secureDocuments && document.teamId !== user.teamId) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json(document);
  });

  app.post("/api/admin/export", (req, res) => {
    const user = currentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json({ exported: true, documents: Object.keys(documents).length });
  });

  app.post("/api/preview", (req, res) => {
    const url = String(req.body.url || "");
    return res.json({ previewRequested: url });
  });

  return app;
}

module.exports = { createApp };
```

- [ ] **Step 2: Write server code**

Create `examples/sample-saas/src/server.js` with:

```javascript
const { createApp } = require("./app");

const port = Number(process.env.PORT || 3000);
const secureDocuments = process.env.SECURE_DOCUMENTS === "true";
const app = createApp({ secureDocuments });

app.listen(port, () => {
  console.log(`BreachLab sample SaaS listening on http://localhost:${port}`);
  console.log(`Document security mode: ${secureDocuments ? "secure" : "vulnerable"}`);
});
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
cd examples/sample-saas && npm install
```

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 4: Run tests**

Run:

```bash
cd examples/sample-saas && npm test -- documents
```

Expected: all tests pass.

### Task 4: Add Demo Docs And Signals

**Files:**
- Create: `examples/sample-saas/README.md`
- Create: `examples/sample-saas/.env.example`
- Create: `examples/sample-saas/src/support-bot-prompt.js`

- [ ] **Step 1: Write README**

Create `examples/sample-saas/README.md` with:

```markdown
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
```

- [ ] **Step 2: Write `.env.example`**

Create `examples/sample-saas/.env.example` with:

```text
PORT=3000
SECURE_DOCUMENTS=false
PAYMENT_PROVIDER_KEY=replace-with-local-test-key
OPENAI_API_KEY=replace-with-local-development-key
```

- [ ] **Step 3: Write AI prompt signal file**

Create `examples/sample-saas/src/support-bot-prompt.js` with:

```javascript
const supportBotSystemPrompt = `
You are the support assistant for the sample SaaS.
Never reveal internal workspace documents.
Only summarize documents after server-side authorization succeeds.
`;

module.exports = { supportBotSystemPrompt };
```

### Task 5: Validate Sample Repo And Commit

**Files:**
- Inspect: `examples/sample-saas/**/*`

- [ ] **Step 1: Run sample tests**

Run:

```bash
cd examples/sample-saas && npm test -- documents
```

Expected: all tests pass.

- [ ] **Step 2: Verify route responds in vulnerable mode**

Run:

```bash
cd examples/sample-saas
node src/server.js &
SERVER_PID=$!
sleep 1
curl -s -H "x-user-id: user-red" http://localhost:3000/api/documents/doc-blue-budget | grep -q "Blue Team Budget"
kill $SERVER_PID
echo "vulnerable-replay-ok"
```

Expected output:

```text
vulnerable-replay-ok
```

- [ ] **Step 3: Commit**

Run:

```bash
git add examples/sample-saas
git commit -m "feat: add BreachLab sample SaaS app"
```

Expected: commit succeeds.
