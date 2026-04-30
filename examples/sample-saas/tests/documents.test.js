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
