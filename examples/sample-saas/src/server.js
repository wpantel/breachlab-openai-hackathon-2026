const { createApp } = require("./app");

const port = Number(process.env.PORT || 3000);
const secureDocuments = process.env.SECURE_DOCUMENTS === "true";
const app = createApp({ secureDocuments });

app.listen(port, () => {
  console.log(`BreachLab sample SaaS listening on http://localhost:${port}`);
  console.log(`Document security mode: ${secureDocuments ? "secure" : "vulnerable"}`);
});
