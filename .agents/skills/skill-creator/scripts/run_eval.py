#!/usr/bin/env python3
"""Run trigger evaluation for a skill description (CI / unattended automation).

Prefer the in-IDE workflow: spawn subagents with agents/trigger-eval.md instead
of calling this script from an active agent session.
"""

import argparse
import json
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from scripts.platform import (
    AgentBackend,
    detect_platform,
    find_project_root,
    resolve_backend,
    run_trigger_query,
)
from scripts.utils import parse_skill_md


def run_eval(
    eval_set: list[dict],
    skill_name: str,
    description: str,
    num_workers: int,
    timeout: int,
    project_root: Path,
    runs_per_query: int = 1,
    trigger_threshold: float = 0.5,
    model: str | None = None,
    backend: AgentBackend = AgentBackend.AUTO,
) -> dict:
    """Run the full eval set and return results."""
    resolved_backend = resolve_backend(backend.value) if backend == AgentBackend.AUTO else backend
    platform = detect_platform(project_root)
    results = []

    with ProcessPoolExecutor(max_workers=num_workers) as executor:
        future_to_info = {}
        for item in eval_set:
            for _run_idx in range(runs_per_query):
                future = executor.submit(
                    run_trigger_query,
                    item["query"],
                    skill_name,
                    description,
                    project_root,
                    timeout,
                    model,
                    resolved_backend,
                )
                future_to_info[future] = item

        query_triggers: dict[str, list[bool]] = {}
        query_items: dict[str, dict] = {}
        for future in as_completed(future_to_info):
            item = future_to_info[future]
            query = item["query"]
            query_items[query] = item
            if query not in query_triggers:
                query_triggers[query] = []
            try:
                query_triggers[query].append(future.result())
            except Exception as e:
                print(f"Warning: query failed: {e}", file=sys.stderr)
                query_triggers[query].append(False)

    for query, triggers in query_triggers.items():
        item = query_items[query]
        trigger_rate = sum(triggers) / len(triggers)
        should_trigger = item["should_trigger"]
        if should_trigger:
            did_pass = trigger_rate >= trigger_threshold
        else:
            did_pass = trigger_rate < trigger_threshold
        results.append({
            "query": query,
            "should_trigger": should_trigger,
            "trigger_rate": trigger_rate,
            "triggers": sum(triggers),
            "runs": len(triggers),
            "pass": did_pass,
        })

    passed = sum(1 for r in results if r["pass"])
    total = len(results)

    return {
        "skill_name": skill_name,
        "description": description,
        "platform": platform.value,
        "backend": resolved_backend.value,
        "results": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Run trigger evaluation for a skill description")
    parser.add_argument("--eval-set", required=True, help="Path to eval set JSON file")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--description", default=None, help="Override description to test")
    parser.add_argument("--num-workers", type=int, default=10, help="Number of parallel workers")
    parser.add_argument("--timeout", type=int, default=30, help="Timeout per query in seconds")
    parser.add_argument("--runs-per-query", type=int, default=3, help="Number of runs per query")
    parser.add_argument("--trigger-threshold", type=float, default=0.5, help="Trigger rate threshold")
    parser.add_argument(
        "--backend",
        default="auto",
        choices=["auto", "claude", "cursor-sdk", "manual"],
        help="Agent backend for trigger tests (default: auto-detect)",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model override for the selected backend (Claude CLI or Cursor SDK)",
    )
    parser.add_argument("--verbose", action="store_true", help="Print progress to stderr")
    args = parser.parse_args()

    if args.backend == "manual":
        print(
            "Use the in-IDE trigger eval loop instead (SKILL.md → Description Optimization).\n"
            "Spawn subagents with agents/trigger-eval.md — no CLI required.",
            file=sys.stderr,
        )
        sys.exit(1)

    eval_set = json.loads(Path(args.eval_set).read_text())
    skill_path = Path(args.skill_path)

    if not (skill_path / "SKILL.md").exists():
        print(f"Error: No SKILL.md found at {skill_path}", file=sys.stderr)
        sys.exit(1)

    name, original_description, _content = parse_skill_md(skill_path)
    description = args.description or original_description
    project_root = find_project_root()
    backend = AgentBackend(args.backend)

    if args.verbose:
        print(f"Platform: {detect_platform(project_root).value}", file=sys.stderr)
        print(f"Backend: {backend.value}", file=sys.stderr)
        print(f"Description: {description}", file=sys.stderr)

    output = run_eval(
        eval_set=eval_set,
        skill_name=name,
        description=description,
        num_workers=args.num_workers,
        timeout=args.timeout,
        project_root=project_root,
        runs_per_query=args.runs_per_query,
        trigger_threshold=args.trigger_threshold,
        model=args.model,
        backend=backend,
    )

    if args.verbose:
        summary = output["summary"]
        print(f"Results: {summary['passed']}/{summary['total']} passed", file=sys.stderr)
        for r in output["results"]:
            status = "PASS" if r["pass"] else "FAIL"
            rate_str = f"{r['triggers']}/{r['runs']}"
            print(
                f"  [{status}] rate={rate_str} expected={r['should_trigger']}: {r['query'][:70]}",
                file=sys.stderr,
            )

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
