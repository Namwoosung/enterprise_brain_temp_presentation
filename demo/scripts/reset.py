"""Reset the demo graph to run 0 (baseline KG) and clear run artifacts.

Usage:  python scripts/reset.py [--force]
Refuses to wipe a database that holds non-demo data unless --force is given.
"""
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline import graph  # noqa: E402
from pipeline.common import runs_dir, config  # noqa: E402
from pipeline import diff  # noqa: E402


def reset(force=False):
    if graph.node_count() and not graph.is_demo_db() and not force:
        raise SystemExit("database has data that the demo did not create. use --force to wipe it.")
    graph.wipe()
    graph.create_constraints()
    graph.load_baseline()
    for i in config()["inputs"]:  # clear step artifacts (recordings are kept)
        shutil.rmtree(runs_dir() / i["id"], ignore_errors=True)
    diff.snapshot_cq("run0")
    return graph.stats()


if __name__ == "__main__":
    print("reset ->", reset("--force" in sys.argv))
