"""Systems of record ("기준 시스템") that document claims are checked against.

cmms      : maintenance work orders = baseline master works + CMMS history facts + the latest CMMS export
alarm_log : equipment alarm history facts
A property has ONE system of record (e.g. completion time = CMMS). A document that disagrees is not
used to overwrite it: the mismatch is recorded and sent to review.
CUSTOMIZE: point these at your own CMMS / EES exports.
"""
from functools import lru_cache

from .common import config, entities, reference, read_csv_rows, uid


def _norm_dt(v):
    from .clean import _norm_dt as n
    return n(v, config()["cleaning"]["cmms"]["datetime_formats"])[0]


def _part_uid(text):
    from .clean import alias_index
    hits = alias_index().get((text or "").strip().casefold(), [])
    refs = {h["ref"] for h in hits if h["ref"].startswith("PartType:")}
    return refs.pop() if len(refs) == 1 else None


@lru_cache(None)
def works():
    """wo code -> {code, equipment, part, status, started_at, completed_at, source}."""
    out = {}
    for e in entities():
        if e["class"] == "MaintenanceWork":
            out[e["code"]] = {"code": e["code"], "status": e.get("status"), "started_at": e.get("started_at"),
                              "completed_at": e.get("completed_at"), "source": "CMMS-HIST"}
    for d in reference():
        if d.get("official") != "cmms":
            continue
        for f in d["facts"]:
            code = f["s"].split(":", 1)[1]
            if code in out and f["p"] == "ON_EQUIPMENT":
                out[code]["equipment"] = f["o"]
            if code in out and f["p"] == "USED_PART_TYPE":
                out[code]["part"] = f["o"]
    cmms = next((i for i in config()["inputs"] if i["id"] == "cmms"), None)
    if cmms:
        for r in read_csv_rows(cmms["file"]):
            out[r["wo_id"]] = {"code": r["wo_id"], "status": r["status"],
                               "equipment": uid("Equipment", r["fab"], r["eq_code"]),
                               "part": _part_uid(r["part"]), "started_at": _norm_dt(r["started_at"]),
                               "completed_at": _norm_dt(r["completed_at"]),
                               "source": f"{cmms['meta']['doc_id']} 행 {r['_line']}"}
    return out


@lru_cache(None)
def alarm_facts():
    return [(d["id"], f) for d in reference() if d.get("official") == "alarm_log"
            for f in d["facts"] if f["p"] == "RAISED_ALARM"]


def work_date(w):
    """The date a document would use for this work: completion if done, else the planned start."""
    v = w.get("completed_at") if w.get("status") == "completed" else w.get("started_at")
    return (v or "")[:10] or None
