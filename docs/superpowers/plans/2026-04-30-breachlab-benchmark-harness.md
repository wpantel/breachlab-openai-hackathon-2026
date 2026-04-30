# BreachLab Benchmark Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight local benchmark harness for BreachLab challenge metadata and result recording.

**Architecture:** Challenge JSON files define seeded breach scenarios. A Python runner validates challenge files and writes result JSON for named model/workflow runs without invoking external model APIs.

**Tech Stack:** Python 3 standard library, JSON.

---

## File Structure

- Create: `benchmarks/challenges/team-doc-idor.json` - first benchmark challenge.
- Create: `benchmarks/results/.gitkeep` - result directory marker.
- Create: `tools/run_benchmark.py` - local result recorder and challenge validator.
- Create: `tests/test_run_benchmark.py` - runner tests.

## Tasks

### Task 1: Create Challenge Fixture

**Files:**
- Create: `benchmarks/challenges/team-doc-idor.json`
- Create: `benchmarks/results/.gitkeep`

- [ ] **Step 1: Create directories**

Run:

```bash
mkdir -p benchmarks/challenges benchmarks/results tools tests
```

Expected: command exits with status `0`.

- [ ] **Step 2: Write challenge JSON**

Create `benchmarks/challenges/team-doc-idor.json` with:

```json
{
  "id": "team-doc-idor",
  "category": "broken_access_control",
  "repo": "examples/sample-saas",
  "target_files": ["src/app.js"],
  "setup_command": "npm install",
  "test_command": "npm test -- documents",
  "dev_command": "npm run dev",
  "local_url": "http://localhost:3000",
  "success_condition": "cross-team document access is blocked",
  "regression_required": true,
  "computer_use_required": true,
  "oracle": {
    "pre_patch_attack_should_succeed": true,
    "post_patch_attack_should_fail": true,
    "expected_status_after_patch": 404
  }
}
```

- [ ] **Step 3: Add results marker**

Run:

```bash
touch benchmarks/results/.gitkeep
```

Expected: command exits with status `0`.

### Task 2: Create Failing Runner Tests

**Files:**
- Create: `tests/test_run_benchmark.py`

- [ ] **Step 1: Write tests**

Create `tests/test_run_benchmark.py` with:

```python
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "run_benchmark.py"


class BenchmarkRunnerTests(unittest.TestCase):
    def test_records_result_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "results"
            challenge = ROOT / "benchmarks" / "challenges" / "team-doc-idor.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--challenge",
                    str(challenge),
                    "--model",
                    "model-a",
                    "--workflow",
                    "breachlab",
                    "--output-dir",
                    str(out_dir),
                    "--candidate-found",
                    "--breach-confirmed",
                    "--patch-produced",
                    "--tests-passed",
                    "--original-replay-blocked",
                ],
                check=True,
                text=True,
                capture_output=True,
            )

            payload = json.loads(result.stdout)
            result_path = Path(payload["result_path"])
            self.assertTrue(result_path.exists())
            saved = json.loads(result_path.read_text())
            self.assertEqual(saved["challenge_id"], "team-doc-idor")
            self.assertEqual(saved["model"], "model-a")
            self.assertEqual(saved["workflow"], "breachlab")
            self.assertTrue(saved["metrics"]["patch_produced"])

    def test_rejects_missing_challenge_file(self):
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--challenge",
                "missing.json",
                "--model",
                "model-a",
                "--workflow",
                "breachlab",
            ],
            text=True,
            capture_output=True,
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("challenge", result.stderr.lower())


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
python3 -m unittest tests/test_run_benchmark.py -v
```

Expected: fails because `tools/run_benchmark.py` does not exist.

### Task 3: Implement Benchmark Runner

**Files:**
- Create: `tools/run_benchmark.py`

- [ ] **Step 1: Write runner**

Create `tools/run_benchmark.py` with:

```python
#!/usr/bin/env python3
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


REQUIRED_CHALLENGE_KEYS = {
    "id",
    "category",
    "repo",
    "target_files",
    "setup_command",
    "test_command",
    "success_condition",
    "oracle",
}


def load_challenge(path):
    path = Path(path)
    if not path.exists():
        raise ValueError(f"challenge file not found: {path}")
    data = json.loads(path.read_text())
    missing = sorted(REQUIRED_CHALLENGE_KEYS - set(data))
    if missing:
        raise ValueError(f"challenge missing keys: {', '.join(missing)}")
    return data


def result_score(metrics):
    weights = {
        "candidate_found": 15,
        "breach_confirmed": 20,
        "false_positive_avoided": 10,
        "patch_produced": 20,
        "regression_test_added": 15,
        "original_replay_blocked": 15,
        "tests_passed": 5,
    }
    return sum(weight for key, weight in weights.items() if metrics.get(key))


def write_result(args):
    challenge = load_challenge(args.challenge)
    metrics = {
        "candidate_found": args.candidate_found,
        "breach_confirmed": args.breach_confirmed,
        "false_positive_avoided": args.false_positive_avoided,
        "patch_produced": args.patch_produced,
        "regression_test_added": args.regression_test_added,
        "original_replay_blocked": args.original_replay_blocked,
        "tests_passed": args.tests_passed,
    }
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    payload = {
        "challenge_id": challenge["id"],
        "category": challenge["category"],
        "model": args.model,
        "workflow": args.workflow,
        "recorded_at": now,
        "metrics": metrics,
        "score": result_score(metrics),
    }
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{challenge['id']}-{args.workflow}-{args.model}-{now}.json"
    result_path = output_dir / filename
    result_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
    return {"result_path": str(result_path), "score": payload["score"]}


def main():
    parser = argparse.ArgumentParser(description="Record a BreachLab benchmark result.")
    parser.add_argument("--challenge", required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--workflow", required=True)
    parser.add_argument("--output-dir", default="benchmarks/results")
    parser.add_argument("--candidate-found", action="store_true")
    parser.add_argument("--breach-confirmed", action="store_true")
    parser.add_argument("--false-positive-avoided", action="store_true")
    parser.add_argument("--patch-produced", action="store_true")
    parser.add_argument("--regression-test-added", action="store_true")
    parser.add_argument("--original-replay-blocked", action="store_true")
    parser.add_argument("--tests-passed", action="store_true")
    args = parser.parse_args()

    try:
        result = write_result(args)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Run tests**

Run:

```bash
python3 -m unittest tests/test_run_benchmark.py -v
```

Expected: all tests pass.

### Task 4: Record Fixture Results

**Files:**
- Modify: `benchmarks/results/`

- [ ] **Step 1: Record BreachLab fixture result**

Run:

```bash
python3 tools/run_benchmark.py \
  --challenge benchmarks/challenges/team-doc-idor.json \
  --model gpt-demo \
  --workflow breachlab \
  --candidate-found \
  --breach-confirmed \
  --false-positive-avoided \
  --patch-produced \
  --regression-test-added \
  --original-replay-blocked \
  --tests-passed
```

Expected: output JSON includes `"score": 100`.

- [ ] **Step 2: Record baseline fixture result**

Run:

```bash
python3 tools/run_benchmark.py \
  --challenge benchmarks/challenges/team-doc-idor.json \
  --model gpt-demo \
  --workflow single-agent-baseline \
  --candidate-found \
  --breach-confirmed
```

Expected: output JSON includes `"score": 35`.

### Task 5: Validate And Commit

**Files:**
- Inspect: `benchmarks/challenges/team-doc-idor.json`
- Inspect: `tools/run_benchmark.py`
- Inspect: `tests/test_run_benchmark.py`
- Inspect: `benchmarks/results/`

- [ ] **Step 1: Run benchmark tests**

Run:

```bash
python3 -m unittest tests/test_run_benchmark.py -v
```

Expected: all tests pass.

- [ ] **Step 2: Validate challenge JSON**

Run:

```bash
python3 -m json.tool benchmarks/challenges/team-doc-idor.json > /tmp/team-doc-idor.json
echo "challenge-json-ok"
```

Expected output:

```text
challenge-json-ok
```

- [ ] **Step 3: Commit**

Run:

```bash
git add benchmarks tools/run_benchmark.py tests/test_run_benchmark.py
git commit -m "feat: add BreachLab benchmark harness"
```

Expected: commit succeeds.
