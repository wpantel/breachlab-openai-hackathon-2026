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
