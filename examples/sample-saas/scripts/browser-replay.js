#!/usr/bin/env node
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");

const SLUG = "cross-tenant-document-access";
const DEFAULT_PORT = 3177;
const DEFAULT_SLOW_MS = 350;
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "breachlab", "evidence");

function parseArgs(argv) {
  const args = {
    mode: "both",
    port: DEFAULT_PORT,
    outDir: EVIDENCE_DIR,
    headed: false,
    video: true,
    slowMs: DEFAULT_SLOW_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") args.mode = argv[++index];
    else if (arg === "--port") args.port = Number(argv[++index]);
    else if (arg === "--out-dir") args.outDir = path.resolve(argv[++index]);
    else if (arg === "--headed") args.headed = true;
    else if (arg === "--no-video") args.video = false;
    else if (arg === "--slow-ms") args.slowMs = Number(argv[++index]);
    else if (arg === "--help") {
      console.log(`Usage: npm run replay:browser -- [--mode before|after|both] [--port 3177] [--out-dir breachlab/evidence] [--headed] [--no-video] [--slow-ms 350]`);
      process.exit(0);
    }
  }

  if (!["before", "after", "both"].includes(args.mode)) {
    throw new Error("--mode must be before, after, or both");
  }
  if (!Number.isInteger(args.port) || args.port < 1024 || args.port > 65535) {
    throw new Error("--port must be an integer between 1024 and 65535");
  }
  if (!Number.isInteger(args.slowMs) || args.slowMs < 0 || args.slowMs > 5000) {
    throw new Error("--slow-ms must be an integer between 0 and 5000");
  }

  return args;
}

async function pause(page, args) {
  if (args.slowMs > 0) {
    await page.waitForTimeout(args.slowMs);
  }
}

function waitForServer(url, timeoutMs = 10000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    function probe() {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(probe, 150);
      });
      request.setTimeout(1000, () => {
        request.destroy();
      });
    }
    probe();
  });
}

async function startServer({ port, secureDocuments }) {
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      SECURE_DOCUMENTS: secureDocuments ? "true" : "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let logs = "";
  let closed = false;
  const closePromise = new Promise((resolve) => {
    child.once("close", () => {
      closed = true;
      resolve();
    });
  });
  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(logs.trim());
    }
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(baseUrl);
  } catch (error) {
    child.kill();
    await closePromise;
    throw new Error(`${error.message}\nServer logs:\n${logs.trim()}`);
  }

  return {
    baseUrl,
    stop: async () => {
      if (!closed) child.kill();
      await closePromise;
    },
  };
}

async function withServer(options, callback) {
  const server = await startServer(options);
  try {
    return await callback(server.baseUrl);
  } finally {
    await server.stop();
  }
}

async function runBeforeReplay(page, baseUrl, screenshotPath, args) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await pause(page, args);
  await page.getByText("Red Team Roadmap").click();
  await page.getByRole("heading", { name: "Red Team Roadmap" }).waitFor();
  await pause(page, args);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await pause(page, args);
  await page.getByText("Blue Team Budget").click();
  await page.getByRole("heading", { name: "Blue Team Budget" }).waitFor();
  await pause(page, args);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    mode: "before",
    outcome: "leaked",
    url: page.url(),
    screenshot: path.relative(ROOT, screenshotPath),
    observed: "A low-privilege Redwell user can view the Bluepeak Finance private document.",
  };
}

async function runAfterReplay(page, baseUrl, screenshotPath, args) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await pause(page, args);
  await page.getByText("Blue Team Budget").click();
  await page.getByRole("heading", { name: "Document not found" }).waitFor();
  await pause(page, args);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    mode: "after",
    outcome: "blocked",
    url: page.url(),
    screenshot: path.relative(ROOT, screenshotPath),
    observed: "The same browser replay is blocked and returns a not-found state.",
  };
}

async function runReplay(args) {
  await fs.mkdir(args.outDir, { recursive: true });

  const beforePath = path.join(args.outDir, `${SLUG}-before.png`);
  const afterPath = path.join(args.outDir, `${SLUG}-after.png`);
  const videoPath = path.join(args.outDir, `${SLUG}-browser-replay.webm`);
  const summaryPath = path.join(args.outDir, `${SLUG}-browser-replay.json`);

  const browser = await chromium.launch({ headless: !args.headed, slowMo: args.slowMs });
  const contextOptions = { viewport: { width: 1440, height: 1000 } };
  if (args.video) {
    contextOptions.recordVideo = {
      dir: args.outDir,
      size: { width: 1440, height: 1000 },
    };
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const video = page.video();
  const summary = {
    breach_id: SLUG,
    generated_at: new Date().toISOString(),
    tool: "playwright",
    app: "Northstar Rooms",
    target: "localhost sample SaaS",
    video: args.video ? path.relative(ROOT, videoPath) : null,
    evidence: [],
  };

  try {
    if (args.mode === "before" || args.mode === "both") {
      const evidence = await withServer(
        { port: args.port, secureDocuments: false },
        (baseUrl) => runBeforeReplay(page, baseUrl, beforePath, args)
      );
      summary.evidence.push(evidence);
    }

    if (args.mode === "after" || args.mode === "both") {
      const evidence = await withServer(
        { port: args.port, secureDocuments: true },
        (baseUrl) => runAfterReplay(page, baseUrl, afterPath, args)
      );
      summary.evidence.push(evidence);
    }
  } finally {
    await context.close();
    if (args.video && video) {
      await video.saveAs(videoPath);
      await video.delete().catch(() => {});
    }
    await browser.close();
  }

  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  const written = summary.evidence.map((item) => item.screenshot).concat(path.relative(ROOT, summaryPath));
  if (summary.video) written.push(summary.video);
  console.log(JSON.stringify({ written }, null, 2));
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    await runReplay(args);
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    if (message.includes("Executable doesn't exist") || message.includes("browserType.launch")) {
      console.error(`${message}\n\nInstall the browser once with: npx playwright install chromium`);
    } else {
      console.error(message);
    }
    process.exit(1);
  }
}

main();
