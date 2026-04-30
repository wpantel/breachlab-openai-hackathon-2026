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

    def test_rejects_unsafe_filename_component(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            challenge = repo / "challenge.json"
            challenge.write_text(
                json.dumps(
                    {
                        "id": "../escaped",
                        "category": "broken_access_control",
                        "repo": "examples/sample-saas",
                        "target_files": ["src/app.js"],
                        "setup_command": "npm install",
                        "test_command": "npm test -- documents",
                        "success_condition": "cross-team document access is blocked",
                        "oracle": {},
                    }
                )
            )
            out_dir = repo / "results"

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
                ],
                text=True,
                capture_output=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("unsafe filename component", result.stderr.lower())
            self.assertFalse((repo / "escaped-breachlab-model-a").exists())

    def test_same_second_runs_create_distinct_result_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_dir = Path(tmp) / "results"
            challenge = ROOT / "benchmarks" / "challenges" / "team-doc-idor.json"
            command = [
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
            ]

            first = subprocess.run(command, check=True, text=True, capture_output=True)
            second = subprocess.run(command, check=True, text=True, capture_output=True)

            first_path = Path(json.loads(first.stdout)["result_path"])
            second_path = Path(json.loads(second.stdout)["result_path"])
            self.assertNotEqual(first_path, second_path)
            self.assertTrue(first_path.exists())
            self.assertTrue(second_path.exists())
            self.assertEqual(len(list(out_dir.glob("*.json"))), 2)


if __name__ == "__main__":
    unittest.main()
