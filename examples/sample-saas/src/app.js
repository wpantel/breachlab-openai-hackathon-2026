const express = require("express");
const { users, documents } = require("./data");

function currentUser(req) {
  const userId = req.header("x-user-id");
  return users[userId] || null;
}

function pageShell(title, body) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #17202a;
        --muted: #667085;
        --line: #d8dee8;
        --panel: #ffffff;
        --soft: #f4f7fb;
        --accent: #0f766e;
        --accent-strong: #115e59;
        --warn: #b45309;
        --danger: #b42318;
        --blue: #2563eb;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: #eef2f7;
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }
      a { color: inherit; text-decoration: none; }
      .app {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 248px minmax(0, 1fr);
      }
      .sidebar {
        background: #16202d;
        color: #e6edf5;
        padding: 24px 18px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 800;
        font-size: 18px;
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: linear-gradient(135deg, #14b8a6, #2563eb);
        display: grid;
        place-items: center;
        color: #ffffff;
        font-weight: 900;
      }
      .nav {
        display: grid;
        gap: 6px;
      }
      .nav a, .tenant {
        border-radius: 8px;
        padding: 10px 12px;
        color: #c9d5e4;
        font-size: 14px;
      }
      .nav a.active {
        background: rgba(255,255,255,0.12);
        color: #ffffff;
      }
      .tenant {
        margin-top: auto;
        background: rgba(255,255,255,0.08);
        line-height: 1.45;
      }
      .tenant strong { display: block; color: #ffffff; }
      .main {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .topbar {
        min-height: 72px;
        background: rgba(255,255,255,0.92);
        border-bottom: 1px solid var(--line);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 30px;
      }
      .search {
        width: min(440px, 44vw);
        border: 1px solid var(--line);
        background: var(--soft);
        border-radius: 8px;
        padding: 11px 14px;
        color: var(--muted);
        font-size: 14px;
      }
      .user-chip {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--muted);
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #dbeafe;
        color: #1d4ed8;
        display: grid;
        place-items: center;
        font-weight: 800;
      }
      .content {
        width: min(1220px, calc(100vw - 248px));
        padding: 28px 30px 42px;
      }
      .headline {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        margin-bottom: 22px;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1.05;
      }
      .headline p, .muted {
        color: var(--muted);
      }
      .headline p {
        margin: 10px 0 0;
        max-width: 660px;
        font-size: 15px;
        line-height: 1.6;
      }
      .status-pill {
        white-space: nowrap;
        border: 1px solid #fed7aa;
        background: #fff7ed;
        color: var(--warn);
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 700;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .metric, .panel, .doc-card, .activity-item {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: 0 12px 28px rgba(21, 31, 46, 0.06);
      }
      .metric {
        padding: 16px;
        min-height: 112px;
      }
      .metric span {
        display: block;
        color: var(--muted);
        font-size: 13px;
        margin-bottom: 10px;
      }
      .metric strong {
        display: block;
        font-size: 28px;
        line-height: 1;
      }
      .metric small {
        display: block;
        margin-top: 12px;
        color: var(--accent);
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
        gap: 18px;
        align-items: start;
      }
      .panel {
        padding: 18px;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }
      h2 {
        margin: 0;
        font-size: 18px;
      }
      .button {
        border: 1px solid var(--accent);
        background: var(--accent);
        color: #ffffff;
        border-radius: 8px;
        padding: 9px 12px;
        font-weight: 800;
        font-size: 13px;
      }
      .doc-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .doc-card {
        padding: 16px;
        min-height: 174px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .doc-card.flagged {
        border-color: #fda29b;
      }
      .doc-meta {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
      }
      .doc-card h3 {
        margin: 0;
        font-size: 18px;
      }
      .doc-card p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.5;
      }
      .doc-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        font-size: 13px;
      }
      .tag {
        border-radius: 999px;
        padding: 5px 9px;
        background: #ecfdf3;
        color: #027a48;
        font-weight: 800;
      }
      .tag.danger {
        background: #fef3f2;
        color: var(--danger);
      }
      .chart {
        height: 190px;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
        align-items: end;
        padding: 12px;
        border-radius: 8px;
        background: var(--soft);
      }
      .bar {
        min-height: 24px;
        border-radius: 6px 6px 0 0;
        background: linear-gradient(180deg, #2dd4bf, #0f766e);
      }
      .activity {
        display: grid;
        gap: 10px;
      }
      .activity-item {
        padding: 13px;
        display: grid;
        grid-template-columns: 10px 1fr;
        gap: 10px;
        align-items: start;
        box-shadow: none;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--blue);
        margin-top: 5px;
      }
      .dot.warn { background: var(--warn); }
      .dot.danger { background: var(--danger); }
      .activity-item strong {
        display: block;
        font-size: 14px;
        margin-bottom: 3px;
      }
      .activity-item span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .document-page {
        max-width: 920px;
      }
      .document-paper {
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 34px;
        box-shadow: 0 16px 38px rgba(21, 31, 46, 0.08);
      }
      .document-paper h1 {
        font-size: 34px;
        margin-bottom: 12px;
      }
      .document-paper p {
        color: #344054;
        line-height: 1.7;
        font-size: 16px;
      }
      @media (max-width: 980px) {
        .app { grid-template-columns: 1fr; }
        .sidebar { display: none; }
        .content { width: 100%; padding: 22px; }
        .metrics, .grid, .doc-grid { grid-template-columns: 1fr; }
        .headline { flex-direction: column; }
        .topbar { padding: 0 20px; }
        .search { width: 50vw; }
      }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>`;
}

function dashboardPage() {
  return pageShell(
    "Northstar Rooms",
    `<div class="app">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">N</span><span>Northstar Rooms</span></div>
        <nav class="nav" aria-label="Workspace">
          <a class="active" href="/">Command Center</a>
          <a href="/documents/doc-red-roadmap">Deal Rooms</a>
          <a href="/documents/doc-red-roadmap">Customer Docs</a>
          <a href="/documents/doc-blue-budget">Partner Vault</a>
          <a href="/">Audit Log</a>
          <a href="/">Integrations</a>
        </nav>
        <div class="tenant">
          <strong>Redwell Health</strong>
          Founder workspace<br />
          Signed in as Riley Reader
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="search">Search customers, rooms, invoices, docs</div>
          <div class="user-chip"><span>Riley Reader</span><span class="avatar">RR</span></div>
        </header>
        <section class="content">
          <div class="headline">
            <div>
              <h1>Customer operating room</h1>
              <p>Northstar Rooms centralizes customer documents, procurement notes, implementation plans, and support escalations for B2B teams.</p>
            </div>
            <span class="status-pill">Founder concern: frontier-model attack surface rising</span>
          </div>

          <section class="metrics" aria-label="Workspace metrics">
            <article class="metric"><span>Active customers</span><strong>48</strong><small>+6 this month</small></article>
            <article class="metric"><span>Private documents</span><strong>1,284</strong><small>93 updated today</small></article>
            <article class="metric"><span>Open deal rooms</span><strong>17</strong><small>4 procurement reviews</small></article>
            <article class="metric"><span>Risk signals</span><strong>3</strong><small>Needs security review</small></article>
          </section>

          <div class="grid">
            <section class="panel">
              <div class="panel-header">
                <div>
                  <h2>Workspace documents</h2>
                  <p class="muted">Demo user: user-red should only access Redwell Health records.</p>
                </div>
                <a class="button" href="/documents/doc-red-roadmap">Open room</a>
              </div>
              <div class="doc-grid">
                <a class="doc-card" href="/documents/doc-red-roadmap">
                  <div class="doc-meta"><span>Redwell Health</span><span>Updated 12m ago</span></div>
                  <h3>Red Team Roadmap</h3>
                  <p>Launch timeline, customer milestones, implementation owners, and executive blockers.</p>
                  <div class="doc-footer"><span class="tag">Allowed</span><span>doc-red-roadmap</span></div>
                </a>
                <a class="doc-card flagged" href="/documents/doc-blue-budget">
                  <div class="doc-meta"><span>Bluepeak Finance</span><span>Private tenant</span></div>
                  <h3>Blue Team Budget</h3>
                  <p>Private budget notes, renewal targets, procurement constraints, and customer-specific pricing.</p>
                  <div class="doc-footer"><span class="tag danger">Should be isolated</span><span>doc-blue-budget</span></div>
                </a>
              </div>
            </section>

            <aside class="activity">
              <section class="panel">
                <div class="panel-header"><h2>Access volume</h2><span class="muted">7 days</span></div>
                <div class="chart" aria-label="Access volume chart">
                  <span class="bar" style="height: 42%"></span>
                  <span class="bar" style="height: 64%"></span>
                  <span class="bar" style="height: 52%"></span>
                  <span class="bar" style="height: 76%"></span>
                  <span class="bar" style="height: 69%"></span>
                  <span class="bar" style="height: 88%"></span>
                  <span class="bar" style="height: 58%"></span>
                </div>
              </section>
              <section class="panel">
                <div class="panel-header"><h2>Live audit feed</h2><span class="muted">Now</span></div>
                <div class="activity">
                  <div class="activity-item"><span class="dot"></span><div><strong>Riley opened Redwell roadmap</strong><span>Normal workspace access from founder account.</span></div></div>
                  <div class="activity-item"><span class="dot warn"></span><div><strong>Partner vault link copied</strong><span>Object ids are visible in browser routes.</span></div></div>
                  <div class="activity-item"><span class="dot danger"></span><div><strong>Cross-tenant document reachable</strong><span>BreachLab will verify whether this is real or only a simulation candidate.</span></div></div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </div>`
  );
}

function documentPage(document) {
  return pageShell(
    `${document.title} | Northstar Rooms`,
    `<div class="app">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">N</span><span>Northstar Rooms</span></div>
        <nav class="nav" aria-label="Workspace">
          <a href="/">Command Center</a>
          <a class="active" href="/documents/${document.id}">Customer Docs</a>
          <a href="/">Audit Log</a>
        </nav>
        <div class="tenant">
          <strong>${document.teamId === "team-red" ? "Redwell Health" : "Bluepeak Finance"}</strong>
          Customer record<br />
          Document id: ${document.id}
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="search">Customer document viewer</div>
          <div class="user-chip"><span>Riley Reader</span><span class="avatar">RR</span></div>
        </header>
        <section class="content document-page">
          <div class="headline">
            <div>
              <h1>${document.title}</h1>
              <p>${document.teamId === "team-red" ? "Redwell Health workspace" : "Bluepeak Finance private tenant"}</p>
            </div>
            <a class="button" href="/">Back to command center</a>
          </div>
          <article class="document-paper">
            <p>${document.body}</p>
            <p class="muted">This page is intentionally simple. BreachLab uses the underlying route and API behavior as the security drill target.</p>
          </article>
        </section>
      </main>
    </div>`
  );
}

function blockedDocumentPage() {
  return pageShell(
    "Document not found | Northstar Rooms",
    `<div class="app">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">N</span><span>Northstar Rooms</span></div>
        <nav class="nav" aria-label="Workspace">
          <a href="/">Command Center</a>
          <a class="active" href="/">Customer Docs</a>
          <a href="/">Audit Log</a>
        </nav>
        <div class="tenant">
          <strong>Redwell Health</strong>
          Founder workspace<br />
          Signed in as Riley Reader
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="search">Customer document viewer</div>
          <div class="user-chip"><span>Riley Reader</span><span class="avatar">RR</span></div>
        </header>
        <section class="content document-page">
          <div class="headline">
            <div>
              <h1>Document not found</h1>
              <p>The requested customer record is unavailable to this workspace.</p>
            </div>
            <a class="button" href="/">Back to command center</a>
          </div>
          <article class="document-paper">
            <p><strong>Access blocked.</strong> Northstar Rooms does not reveal whether another tenant's private document exists.</p>
            <p class="muted">This is the expected after-state when BreachLab replays the original cross-tenant browser path after remediation.</p>
          </article>
        </section>
      </main>
    </div>`
  );
}

function createApp(options = {}) {
  const secureDocuments = options.secureDocuments !== false;
  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => {
    res.type("html").send(dashboardPage());
  });

  app.get("/documents/:id", (req, res) => {
    const user = currentUser(req) || users["user-red"];
    const document = documents[req.params.id];
    if (!document) {
      return res.status(404).send(blockedDocumentPage());
    }
    if (secureDocuments && document.teamId !== user.teamId) {
      return res.status(404).send(blockedDocumentPage());
    }
    return res.type("html").send(documentPage(document));
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
