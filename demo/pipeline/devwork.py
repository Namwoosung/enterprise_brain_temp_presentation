"""'구현 내용' panel: docs/dev_work.yaml + the real source / definition text it points to.

Every ref is resolved from the files on disk when the page asks, so the panel cannot drift from
the code. tests/test_pipeline.py checks that every ref still resolves.
"""
import ast
import re
from pathlib import Path

import yaml

from .common import ROOT, config, env

DEV_WORK = ROOT / "docs" / "dev_work.yaml"
MAX_LINES = 150         # longer snippets are cut (the panel says so and shows the full line range)
KIND_ORDER = ["code", "define", "prompt", "config", "llm", "platform"]


def load():
    return yaml.safe_load(DEV_WORK.read_text(encoding="utf-8"))


def _read_lines(rel):
    p = ROOT / rel
    if not p.exists():
        raise FileNotFoundError(f"dev_work.yaml: file not found: {rel}")
    return p.read_text(encoding="utf-8").splitlines()


def _symbol_range(rel, symbol):
    """(first, last) 1-based lines of a function / class / constant, or 'Class.method'."""
    tree = ast.parse((ROOT / rel).read_text(encoding="utf-8"))
    nodes, parts = tree.body, symbol.split(".")
    found = None
    for i, part in enumerate(parts):
        found = None
        for n in nodes:
            name = getattr(n, "name", None)
            if name is None and isinstance(n, (ast.Assign, ast.AnnAssign)):
                targets = n.targets if isinstance(n, ast.Assign) else [n.target]
                name = next((t.id for t in targets if isinstance(t, ast.Name)), None)
            if name == part:
                found = n
                break
        if found is None:
            raise KeyError(f"dev_work.yaml: symbol '{symbol}' not found in {rel}")
        nodes = getattr(found, "body", [])
    start = min([found.lineno] + [d.lineno for d in getattr(found, "decorator_list", [])])
    return start, found.end_lineno


def _yaml_range(rel, key):
    """(first, last) lines of the YAML block for a dotted key, comments included as written."""
    lines = _read_lines(rel)
    lo, hi, parent_indent = 0, len(lines), -1
    for part in key.split("."):
        pat = re.compile(r"^(\s*)" + re.escape(part) + r"\s*:")
        hit = None
        for i in range(lo, hi):
            m = pat.match(lines[i])
            if m and len(m.group(1)) > parent_indent:
                hit, indent = i, len(m.group(1))
                break
        if hit is None:
            raise KeyError(f"dev_work.yaml: key '{key}' not found in {rel}")
        end = hi
        for j in range(hit + 1, hi):
            s = lines[j]
            if s.strip() and not s.lstrip().startswith("#") and len(s) - len(s.lstrip()) <= indent:
                end = j
                break
        while end > hit + 1 and not lines[end - 1].strip():
            end -= 1
        lo, hi, parent_indent = hit, end, indent
    return lo + 1, hi


def _special(name):
    if name == "prompt_system":
        from .extract import SYSTEM, schema_text, known_entities_text, PROMPT_VERSION
        text = SYSTEM.format(schema=schema_text(), known=known_entities_text())
        return {"path": f"pipeline/extract.py · SYSTEM 채운 결과 · {PROMPT_VERSION}", "text": text,
                "start": 1, "end": len(text.splitlines()), "total": len(text.splitlines()), "truncated": False}
    if name == "llm_settings":
        c = config()["llm"]
        rows = [("LLM_BASE_URL (.env)", env("LLM_BASE_URL", "http://localhost:10000/v1")),
                ("LLM_MODEL (.env)", env("LLM_MODEL", "local-llm")),
                ("LLM_MODE (.env)", env("LLM_MODE", "auto") + "   # live = 호출 후 저장 · replay = 이전 호출 재생"),
                ("LLM_JSON_MODE (.env)", env("LLM_JSON_MODE", "true") + "   # response_format=json_object"),
                ("LLM_EXTRA_BODY (.env)", env("LLM_EXTRA_BODY", "") or "(없음)"),
                ("LLM_TIMEOUT (.env)", env("LLM_TIMEOUT", "300") + " 초"),
                ("temperature (config/demo.yaml)", str(c["temperature"])),
                ("max_tokens (config/demo.yaml)", str(c["max_tokens"])),
                ("저장 위치", "runs/recorded/<입력id>_extract.json")]
        text = "\n".join(f"{k:32} {v}" for k, v in rows)
        return {"path": ".env · config/demo.yaml llm", "text": text, "start": 1, "end": len(rows),
                "total": len(rows), "truncated": False}
    raise KeyError(f"dev_work.yaml: unknown special '{name}'")


def resolve_ref(ref):
    if not ref:
        return None
    if "special" in ref:
        return _special(ref["special"])
    rel = ref["file"]
    lines = _read_lines(rel)
    if "symbol" in ref:
        a, b = _symbol_range(rel, ref["symbol"])
    elif "key" in ref:
        a, b = _yaml_range(rel, ref["key"])
    elif "lines" in ref:
        a, b = ref["lines"][0], min(ref["lines"][1], len(lines))
    else:
        a, b = 1, len(lines)
    shown_b = min(b, a + MAX_LINES - 1)
    return {"path": rel, "start": a, "end": b, "total": len(lines), "truncated": shown_b < b,
            "text": "\n".join(lines[a - 1:shown_b])}


def _code_files():
    """Lines of code we wrote, per file (pipeline / server / scripts / web)."""
    out = {}
    for pat in ("pipeline/*.py", "server/*.py", "scripts/*.py", "web/*.js", "web/*.html", "web/*.css"):
        for p in sorted(ROOT.glob(pat)):
            n = len(p.read_text(encoding="utf-8").splitlines())
            if n:
                out[p.relative_to(ROOT).as_posix()] = n
    return out


def build():
    d = load()
    steps = {}
    for sid, s in d["steps"].items():
        items = []
        for it in s.get("items", []):
            items.append({**it, "snippet": resolve_ref(it.get("ref"))})
        counts = {}
        for it in items:
            counts[it["kind"]] = counts.get(it["kind"], 0) + 1
        steps[sid] = {**s, "items": items, "counts": counts, "notes": (d.get("notes") or {}).get(sid, {})}
    return {"steps": steps, "code_files": _code_files()}


def check():
    """Problems in dev_work.yaml (missing file / symbol / key / unknown kind)."""
    errors = []
    for sid, s in load()["steps"].items():
        for it in s.get("items", []):
            if it.get("kind") not in KIND_ORDER:
                errors.append(f"{sid}: unknown kind {it.get('kind')}")
            try:
                resolve_ref(it.get("ref"))
            except Exception as e:  # noqa: BLE001
                errors.append(f"{sid} · {it.get('title')}: {e}")
    return errors
