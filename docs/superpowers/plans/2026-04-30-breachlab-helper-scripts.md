# BreachLab Helper Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build deterministic Python helpers for repository mapping and artifact writing.

**Architecture:** `repo_map.py` performs read-only static discovery and emits stable JSON. `write_artifacts.py` validates structured input and writes normalized BreachLab artifact files under a target repo.

**Tech Stack:** Python 3 standard library, `unittest`, JSON.

---

## File Structure

- Create: `breachlab/scripts/repo_map.py` - read-only repository mapper.
- Create: `breachlab/scripts/write_artifacts.py` - artifact writer.
- Create: `tests/test_repo_map.py` - scanner tests using temporary fixture repos.
- Create: `tests/test_write_artifacts.py` - artifact writer tests.

## Tasks

### Task 1: Create Failing Tests For Repo Mapping

**Files:**
- Create: `tests/test_repo_map.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_repo_map.py` with:

```python
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "breachlab" / "scripts" / "repo_map.py"


class RepoMapTests(unittest.TestCase):
    def run_map(self, repo):
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(repo)],
            check=True,
            text=True,
            capture_output=True,
        )
        return json.loads(result.stdout)

    def test_maps_next_style_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "package.json").write_text('{"scripts":{"test":"vitest","dev":"next dev"}}')
            (repo / "app" / "api" / "documents" / "[id]").mkdir(parents=True)
            (repo / "app" / "api" / "documents" / "[id]" / "route.ts").write_text(
                "export async function GET(req) { return db.document.findUnique({ where: { id: params.id } }); }"
            )
            (repo / "lib").mkdir()
            (repo / "lib" / "auth.ts").write_text("export function getSession() {}")
            (repo / ".env.example").write_text("OPENAI_API_KEY=sk-example")

            data = self.run_map(repo)

            self.assertEqual(data["root"], str(repo.resolve()))
            self.assertIn("package.json", data["manifests"])
            self.assertIn("app/api/documents/[id]/route.ts", data["routes"])
            self.assertIn("lib/auth.ts", data["auth_files"])
            self.assertIn(".env.example", data["env_config_files"])
            self.assertIn("app/api/documents/[id]/route.ts", data["route_like_files"])

    def test_minimal_repo_returns_empty_lists(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "README.md").write_text("# Minimal")

            data = self.run_map(repo)

            self.assertEqual(data["manifests"], [])
            self.assertEqual(data["routes"], [])
            self.assertEqual(data["tests"], [])

    def test_output_is_stable(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "b.test.ts").write_text("test('b', () => {})")
            (repo / "a.test.ts").write_text("test('a', () => {})")

            first = self.run_map(repo)
            second = self.run_map(repo)

            self.assertEqual(first, second)
            self.assertEqual(first["tests"], ["a.test.ts", "b.test.ts"])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
python3 -m unittest tests/test_repo_map.py -v
```

Expected: fails because `breachlab/scripts/repo_map.py` does not exist.

### Task 2: Implement Repo Mapper

**Files:**
- Create: `breachlab/scripts/repo_map.py`

- [ ] **Step 1: Write implementation**

Create `breachlab/scripts/repo_map.py` with:

```python
#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path


IGNORE_DIRS = {
    ".git",
    ".next",
    ".turbo",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "__pycache__",
}

MANIFEST_NAMES = {
    "package.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "package-lock.json",
    "requirements.txt",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
}

AUTH_RE = re.compile(r"(auth|session|passport|nextauth|clerk|supabase|middleware)", re.I)
SCHEMA_RE = re.compile(r"(schema|model|prisma|migration)", re.I)
ENV_RE = re.compile(r"(^\.env|env\.example|config|settings)", re.I)
AI_RE = re.compile(r"(openai|anthropic|llm|prompt|assistant|agent|tool)", re.I)
UPLOAD_RE = re.compile(r"(upload|multipart|formdata|multer|busboy|file)", re.I)
SHELL_RE = re.compile(r"(child_process|exec\(|spawn\(|subprocess|os\.system)", re.I)
FETCH_RE = re.compile(r"(fetch\(|axios|request\(|http\.get|https\.get|urlpreview|preview)", re.I)


def rel(path, root):
    return path.relative_to(root).as_posix()


def iter_files(root):
    for path in sorted(root.rglob("*")):
        if any(part in IGNORE_DIRS for part in path.parts):
            continue
        if path.is_file():
            yield path


def safe_text(path):
    try:
        return path.read_text(errors="ignore")
    except OSError:
        return ""


def is_route(path):
    name = path.name.lower()
    parts = [part.lower() for part in path.parts]
    return (
        name in {"route.ts", "route.js", "route.tsx", "route.jsx"}
        or "routes" in parts
        or "controllers" in parts
        or "api" in parts
    )


def has_any(text, patterns):
    return any(pattern.search(text) for pattern in patterns)


def map_repo(root):
    root = root.resolve()
    data = {
        "root": str(root),
        "manifests": [],
        "routes": [],
        "route_like_files": [],
        "auth_files": [],
        "schema_model_files": [],
        "env_config_files": [],
        "tests": [],
        "ai_prompt_files": [],
        "upload_handlers": [],
        "shell_execution_files": [],
        "url_fetchers": [],
        "dependency_manifests": [],
    }

    for path in iter_files(root):
        path_rel = rel(path, root)
        lower = path_rel.lower()
        text = safe_text(path)

        if path.name in MANIFEST_NAMES:
            data["manifests"].append(path_rel)
            data["dependency_manifests"].append(path_rel)
        if is_route(path):
            data["route_like_files"].append(path_rel)
            if "/api/" in f"/{lower}" or lower.endswith("/route.ts") or lower.endswith("/route.js"):
                data["routes"].append(path_rel)
        if AUTH_RE.search(path_rel) or AUTH_RE.search(text):
            data["auth_files"].append(path_rel)
        if SCHEMA_RE.search(path_rel):
            data["schema_model_files"].append(path_rel)
        if ENV_RE.search(path.name) or lower.endswith((".env", ".env.example")):
            data["env_config_files"].append(path_rel)
        if lower.endswith((".test.ts", ".test.js", ".spec.ts", ".spec.js", "_test.py")) or "/tests/" in f"/{lower}":
            data["tests"].append(path_rel)
        if AI_RE.search(path_rel) or AI_RE.search(text):
            data["ai_prompt_files"].append(path_rel)
        if UPLOAD_RE.search(path_rel) or UPLOAD_RE.search(text):
            data["upload_handlers"].append(path_rel)
        if SHELL_RE.search(text):
            data["shell_execution_files"].append(path_rel)
        if FETCH_RE.search(text):
            data["url_fetchers"].append(path_rel)

    for key, value in data.items():
        if isinstance(value, list):
            data[key] = sorted(set(value))
    return data


def main():
    parser = argparse.ArgumentParser(description="Map repository security-relevant surfaces.")
    parser.add_argument("repo", nargs="?", default=".", help="Repository root")
    parser.add_argument("--output", help="Optional JSON output path")
    args = parser.parse_args()

    data = map_repo(Path(args.repo))
    payload = json.dumps(data, indent=2, sort_keys=True)
    if args.output:
        Path(args.output).write_text(payload + "\n")
    else:
        print(payload)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run tests to verify pass**

Run:

```bash
python3 -m unittest tests/test_repo_map.py -v
```

Expected: all tests pass.

### Task 3: Create Failing Tests For Artifact Writer

**Files:**
- Create: `tests/test_write_artifacts.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_write_artifacts.py` with:

```python
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "breachlab" / "scripts" / "write_artifacts.py"


class WriteArtifactsTests(unittest.TestCase):
    def run_writer(self, repo, payload):
        payload_path = repo / "payload.json"
        payload_path.write_text(json.dumps(payload))
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(repo), str(payload_path)],
            check=True,
            text=True,
            capture_output=True,
        )
        return json.loads(result.stdout)

    def test_writes_discovery_and_simulation_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            payload = {
                "timestamp": "2026-04-30T120000Z",
                "slug": "cross-tenant-document-access",
                "discovery": {
                    "candidates": [{"id": "cross-tenant-document-access"}],
                    "summary": "# Discovery\n\nOne candidate found.\n"
                },
                "report": "# Report\n\nConfirmed and patched.\n",
                "timeline": {"events": [{"time": "00:00", "phase": "Recon", "event": "Mapped route"}]},
                "scorecard": {"breach_id": "cross-tenant-document-access", "confirmed": True},
                "patch_diff": "diff --git a/file b/file\n"
            }

            result = self.run_writer(repo, payload)

            for written in result["written"]:
                self.assertTrue((repo / written).exists(), written)
            scorecard = json.loads((repo / "breachlab" / "scorecards" / "cross-tenant-document-access.json").read_text())
            self.assertTrue(scorecard["confirmed"])

    def test_requires_slug(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            payload_path = repo / "payload.json"
            payload_path.write_text(json.dumps({"timestamp": "2026-04-30T120000Z"}))

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(repo), str(payload_path)],
                text=True,
                capture_output=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("slug", result.stderr)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
python3 -m unittest tests/test_write_artifacts.py -v
```

Expected: fails because `breachlab/scripts/write_artifacts.py` does not exist.

### Task 4: Implement Artifact Writer

**Files:**
- Create: `breachlab/scripts/write_artifacts.py`

- [ ] **Step 1: Write implementation**

Create `breachlab/scripts/write_artifacts.py` with:

```python
#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def require(data, key):
    value = data.get(key)
    if not value:
        raise ValueError(f"Missing required field: {key}")
    return value


def write_text(path, content, written, root):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    written.append(path.relative_to(root).as_posix())


def write_json(path, content, written, root):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(content, indent=2, sort_keys=True) + "\n")
    written.append(path.relative_to(root).as_posix())


def write_artifacts(repo, data):
    repo = repo.resolve()
    slug = require(data, "slug")
    timestamp = require(data, "timestamp")
    if not SLUG_RE.match(slug):
        raise ValueError("slug must be lowercase kebab-case")

    base = repo / "breachlab"
    written = []

    discovery = data.get("discovery")
    if discovery:
        write_json(
            base / "discovery" / f"{timestamp}-candidates.json",
            discovery.get("candidates", []),
            written,
            repo,
        )
        write_text(
            base / "discovery" / f"{timestamp}-summary.md",
            discovery.get("summary", "# BreachLab Discovery\n"),
            written,
            repo,
        )

    if "report" in data:
        write_text(base / "reports" / f"{slug}-report.md", data["report"], written, repo)
    if "timeline" in data:
        write_json(base / "replays" / f"{slug}-timeline.json", data["timeline"], written, repo)
    if "scorecard" in data:
        write_json(base / "scorecards" / f"{slug}.json", data["scorecard"], written, repo)
    if "patch_diff" in data:
        write_text(base / "patches" / f"{slug}.diff", data["patch_diff"], written, repo)

    return {"written": written}


def main():
    parser = argparse.ArgumentParser(description="Write normalized BreachLab artifacts.")
    parser.add_argument("repo", help="Target repository root")
    parser.add_argument("payload", help="JSON payload file")
    args = parser.parse_args()

    try:
        data = json.loads(Path(args.payload).read_text())
        result = write_artifacts(Path(args.repo), data)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Run tests to verify pass**

Run:

```bash
python3 -m unittest tests/test_write_artifacts.py -v
```

Expected: all tests pass.

### Task 5: Run Full Helper Test Suite And Commit

**Files:**
- Inspect: `breachlab/scripts/repo_map.py`
- Inspect: `breachlab/scripts/write_artifacts.py`
- Inspect: `tests/test_repo_map.py`
- Inspect: `tests/test_write_artifacts.py`

- [ ] **Step 1: Run helper tests**

Run:

```bash
python3 -m unittest tests/test_repo_map.py tests/test_write_artifacts.py -v
```

Expected: all tests pass.

- [ ] **Step 2: Verify scripts have no third-party imports**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
for path in [Path("breachlab/scripts/repo_map.py"), Path("breachlab/scripts/write_artifacts.py")]:
    text = path.read_text()
    assert "requests" not in text
    assert "yaml" not in text
print("stdlib-ok")
PY
```

Expected output:

```text
stdlib-ok
```

- [ ] **Step 3: Commit**

Run:

```bash
git add breachlab/scripts tests/test_repo_map.py tests/test_write_artifacts.py
git commit -m "feat: add BreachLab helper scripts"
```

Expected: commit succeeds.
