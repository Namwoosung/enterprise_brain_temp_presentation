"""Step 1 · 수집: read the source file as-is and write a collection record.

The original is never modified. The record (id, version, hash, times, source type) is what
lets later steps point back to the exact original and re-process only what changed.
"""
import time

from .common import ROOT, input_def, split_front_matter, sha256, write_artifact, artifact_path
import json


def run(input_id):
    d = input_def(input_id)
    path = ROOT / d["file"]
    raw = path.read_text(encoding="utf-8")
    meta, body = split_front_matter(raw)
    digest = sha256(raw)
    prev = None
    p = artifact_path(input_id, "collect")
    if p.exists():
        prev = json.loads(p.read_text(encoding="utf-8"))["record"]
    record = {
        "source_id": meta.get("doc_id"),
        "source_type": meta.get("kind"),
        "title": meta.get("title"),
        "file": d["file"],
        "sha256": digest,
        "bytes": len(raw.encode("utf-8")),
        "created_at": str(meta.get("date")),
        "ingested_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "version": 1 if not prev else (prev["version"] if prev["sha256"] == digest else prev["version"] + 1),
        "unchanged_since_last": bool(prev and prev["sha256"] == digest),
    }
    return write_artifact(input_id, "collect", {"step": "collect", "input": input_id, "record": record,
                                                "meta": meta, "raw": raw, "body": body})
