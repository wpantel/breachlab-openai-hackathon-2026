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

    def test_detects_express_route_registrations(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "src").mkdir()
            (repo / "src" / "app.js").write_text(
                'const express = require("express"); '
                "const app = express(); "
                'app.get("/api/documents/:id", handler); '
                'app.post("/api/admin/export", handler);'
            )

            data = self.run_map(repo)

            self.assertIn("src/app.js", data["route_like_files"])
            self.assertIn("src/app.js", data["routes"])

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
