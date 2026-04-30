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
