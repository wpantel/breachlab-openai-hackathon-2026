#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path


SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TIMESTAMP_RE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}Z$")


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
    if not TIMESTAMP_RE.match(timestamp):
        raise ValueError("timestamp must match YYYY-MM-DDTHHMMSSZ")

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
