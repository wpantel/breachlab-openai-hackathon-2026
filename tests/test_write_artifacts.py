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
                    "summary": "# Discovery\n\nOne candidate found.\n",
                },
                "report": "# Report\n\nConfirmed and patched.\n",
                "timeline": {"events": [{"time": "00:00", "phase": "Recon", "event": "Mapped route"}]},
                "scorecard": {"breach_id": "cross-tenant-document-access", "confirmed": True},
                "patch_diff": "diff --git a/file b/file\n",
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
