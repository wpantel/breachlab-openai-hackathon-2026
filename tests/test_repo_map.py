import json
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "breachlab" / "scripts" / "repo_map.py"


def load_repo_map_module():
    spec = importlib.util.spec_from_file_location("repo_map_under_test", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


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

    def test_skips_symlinked_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / "repo"
            repo.mkdir()
            outside = root / "outside.js"
            outside.write_text('const app = express(); app.get("/api/secret", handler);')
            (repo / "src").mkdir()
            (repo / "src" / "linked.js").symlink_to(outside)

            data = self.run_map(repo)

            self.assertNotIn("src/linked.js", data["route_like_files"])
            self.assertNotIn("src/linked.js", data["routes"])

    def test_skips_oversized_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            oversized = 'const app = express(); app.get("/api/secret", handler);\n'
            oversized += "x" * 1_000_001
            (repo / "large.js").write_text(oversized)

            data = self.run_map(repo)

            self.assertNotIn("large.js", data["route_like_files"])
            self.assertNotIn("large.js", data["routes"])

    def test_prunes_ignored_directories_before_recursing(self):
        module = load_repo_map_module()
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "src").mkdir()
            (repo / "src" / "app.js").write_text('app.get("/api/documents", handler);')
            (repo / "node_modules").mkdir()
            (repo / "node_modules" / "ignored.js").write_text('app.get("/api/ignored", handler);')
            pruned_dirnames = []

            def fake_walk(root, topdown=True, followlinks=False):
                dirnames = ["node_modules", "src"]
                yield str(root), dirnames, []
                pruned_dirnames.append(tuple(dirnames))
                if "node_modules" in dirnames:
                    yield str(Path(root) / "node_modules"), [], ["ignored.js"]
                if "src" in dirnames:
                    yield str(Path(root) / "src"), [], ["app.js"]

            with patch.object(module.os, "walk", fake_walk):
                files = [path.relative_to(repo).as_posix() for path in module.iter_files(repo)]

            self.assertEqual(pruned_dirnames, [("src",)])
            self.assertEqual(files, ["src/app.js"])

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
