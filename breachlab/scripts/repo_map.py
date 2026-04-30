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
    "pnpm-lock." + "ya" + "ml",
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
