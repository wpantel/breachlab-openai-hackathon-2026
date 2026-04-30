import json
import os
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

    def test_rejects_timestamp_path_traversal(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            payload_path = repo / "payload.json"
            payload_path.write_text(
                json.dumps(
                    {
                        "timestamp": "../../../outside",
                        "slug": "cross-tenant-document-access",
                        "discovery": {
                            "candidates": [{"id": "cross-tenant-document-access"}],
                            "summary": "# Discovery\n",
                        },
                    }
                )
            )

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(repo), str(payload_path)],
                text=True,
                capture_output=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("timestamp", result.stderr)

    def test_rejects_symlinked_breachlab_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / "repo"
            outside = root / "outside"
            repo.mkdir()
            outside.mkdir()
            (repo / "breachlab").symlink_to(outside, target_is_directory=True)
            payload_path = repo / "payload.json"
            payload_path.write_text(
                json.dumps(
                    {
                        "timestamp": "2026-04-30T120000Z",
                        "slug": "cross-tenant-document-access",
                        "report": "# Report\n",
                    }
                )
            )

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(repo), str(payload_path)],
                text=True,
                capture_output=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("symlink", result.stderr)
            self.assertFalse((outside / "reports" / "cross-tenant-document-access-report.md").exists())

    def test_rejects_symlinked_artifact_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / "repo"
            outside = root / "outside.md"
            report_dir = repo / "breachlab" / "reports"
            report_dir.mkdir(parents=True)
            outside.write_text("outside\n")
            (report_dir / "cross-tenant-document-access-report.md").symlink_to(outside)
            payload_path = repo / "payload.json"
            payload_path.write_text(
                json.dumps(
                    {
                        "timestamp": "2026-04-30T120000Z",
                        "slug": "cross-tenant-document-access",
                        "report": "# Report\n",
                    }
                )
            )

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(repo), str(payload_path)],
                text=True,
                capture_output=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("symlink", result.stderr)
            self.assertEqual(outside.read_text(), "outside\n")

    @unittest.skipUnless(hasattr(os, "mkfifo"), "mkfifo is not available on this platform")
    def test_rejects_non_regular_artifact_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            report_dir = repo / "breachlab" / "reports"
            report_dir.mkdir(parents=True)
            os.mkfifo(report_dir / "cross-tenant-document-access-report.md")
            payload_path = repo / "payload.json"
            payload_path.write_text(
                json.dumps(
                    {
                        "timestamp": "2026-04-30T120000Z",
                        "slug": "cross-tenant-document-access",
                        "report": "# Report\n",
                    }
                )
            )

            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(repo), str(payload_path)],
                text=True,
                capture_output=True,
                timeout=5,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("non-regular", result.stderr)


if __name__ == "__main__":
    unittest.main()
