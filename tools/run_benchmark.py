#!/usr/bin/env python3
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


SAFE_FILENAME_COMPONENT = re.compile(r"^[a-z0-9._-]+$")

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


def safe_filename_component(value, label):
    if not value or not SAFE_FILENAME_COMPONENT.fullmatch(value):
        raise ValueError(f"unsafe filename component for {label}: {value}")
    return value


def write_result(args):
    challenge = load_challenge(args.challenge)
    challenge_id = safe_filename_component(challenge["id"], "challenge id")
    workflow = safe_filename_component(args.workflow, "workflow")
    model = safe_filename_component(args.model, "model")
    metrics = {
        "candidate_found": args.candidate_found,
        "breach_confirmed": args.breach_confirmed,
        "false_positive_avoided": args.false_positive_avoided,
        "patch_produced": args.patch_produced,
        "regression_test_added": args.regression_test_added,
        "original_replay_blocked": args.original_replay_blocked,
        "tests_passed": args.tests_passed,
    }
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
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
    filename = f"{challenge_id}-{workflow}-{model}-{now}.json"
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
