"""Run the whole pipeline from the command line (no web needed).

Usage:  python scripts/run_all.py [--no-reset] [mail stt ...]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.steps import ORDER, run_step  # noqa: E402
from pipeline import diff  # noqa: E402
from pipeline.common import config  # noqa: E402
import reset as reset_mod  # noqa: E402


def main(argv):
    # Windows consoles default to cp949/cp1252; Korean and "—" in CQ results would crash print().
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    inputs = [a for a in argv if not a.startswith("--")] or [i["id"] for i in config()["inputs"]]
    if "--no-reset" not in argv:
        print("reset   ", reset_mod.reset())
    for i in inputs:
        for s in ORDER:
            out = run_step(i, s)
            brief = {k: out[k] for k in ("stats", "summary", "counts", "idempotent", "rerun_changes") if k in out}
            if s == "extract":
                brief = {"facts": len(out["facts"]), "llm": out["llm"]["mode"]}
            print(f"{i:5} {s:9}", json.dumps(brief, ensure_ascii=False))
    res = diff.compare()
    g = res["graph"]
    print("diff    ", {k: len(v) for k, v in g.items() if isinstance(v, list)}, g["stats"])
    for q in res["cq"]:
        print(f"  {q['id']} before={q['before']}  after={q['after']}")


if __name__ == "__main__":
    main(sys.argv[1:])
