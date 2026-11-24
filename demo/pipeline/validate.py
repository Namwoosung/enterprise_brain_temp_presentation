"""Step 5 · 검증: decide what each candidate becomes.

Checks per fact: ontology schema · entity link · evidence really in the text · hedging (추정 표현) ·
system of record (기준 시스템: CMMS, alarm log) · reference documents.
Outcomes:
  approve            -> loaded as a confirmed fact
  hold               -> ReviewItem (needs a person or a source)
  reject             -> dropped, reason shown (malformed, or "추정" written as a confirmed cause)
  ontology_candidate -> relation / term not in ontology v1 (proposal for v1.1)
  question           -> unresolved reference, goes to the question queue
LLM output is never trusted on its own: a suspected claim is never promoted to confirmed, and a document
never overwrites the system of record - a mismatch is kept for review.
"""
import re

from .common import ontology, reference, config, class_of, read_artifact, write_artifact
from .clean import alias_index
from . import official


def _toks(s):
    return frozenset(t for t in re.split(r"[\s/·\-]+", str(s).casefold()) if t)


def _same_name(a, b):
    ta, tb = _toks(a), _toks(b)
    return bool(ta and tb) and len(ta & tb) / len(ta | tb) >= 0.6


def reference_support(p, s_uid, o_uid, value=None, any_predicate=False):
    """Reference documents whose facts state the same thing (and ones that state it reversed)."""
    hits, reverse = [], []
    for a in reference():
        for f in a["facts"]:
            if not any_predicate and f["p"] != p:
                continue
            if "value" in f and not any_predicate:
                if f["s"] == s_uid and f.get("value") == value:
                    hits.append(a)
                continue
            if f.get("s") == s_uid and f.get("o") == o_uid:
                hits.append(a)
            elif f.get("s") == o_uid and f.get("o") == s_uid:
                reverse.append(a)
    return hits, reverse


# CUSTOMIZE: the systems of record and which fields they own.
def official_check(f, sl, ol, input_kind):
    """None when no system of record owns this fact; else (ok, detail)."""
    o = ontology()
    p = f.get("predicate")
    spec = o["relations"].get(p) or o["property_facts"].get(p) or {}
    system = spec.get("official")
    if not system:
        return None
    if input_kind == "cmms_csv" and system == "cmms":
        return True, f"CMMS 원본 행 {f.get('row_line')} (기준 시스템 자체)"
    if system == "cmms":
        w = sl and sl.get("official") or (sl and sl.get("uid") and official.works().get(sl["uid"].split(":", 1)[1]))
        if not w:
            return False, "CMMS에서 대응하는 작업을 찾지 못함"
        problems = [r.split(": ", 1)[-1] for r in (sl.get("reasons") or []) if "불일치" in r]
        if p == "ON_EQUIPMENT" and ol and ol.get("uid") and w.get("equipment") != ol["uid"]:
            problems.append(f"설비 다름 (CMMS {w.get('equipment')})")
        if p == "USED_PART_TYPE" and ol and ol.get("uid") and w.get("part") != ol["uid"]:
            problems.append(f"부품 다름 (CMMS {w.get('part')})")
        if p == "WORK_STATUS" and f.get("value") != w.get("status"):
            problems.append(f"상태 다름: 문서 {f.get('value')} · CMMS {w.get('status')}")
        if problems:
            return False, f"CMMS {w['code']}와 불일치 — " + " · ".join(problems)
        return True, f"CMMS {w['code']}와 일치 ({w['source']})"
    if system == "alarm_log":
        s, ob = sl and sl.get("uid"), ol and ol.get("uid")
        for doc_id, af in official.alarm_facts():
            if af["s"] == s and af["o"] == ob:
                pr = af.get("props", {})
                return True, f"알람 로그 {doc_id}: {pr.get('count', '?')}회 · 마지막 {pr.get('last_at', '-')}"
        return False, "알람 로그에 해당 설비 · 알람 기록 없음"
    return None


def check_fact(f, links):
    o = ontology()
    rels = {k: v for k, v in o["relations"].items() if v.get("fact")}
    pfs = o["property_facts"]
    sl = links.get(f.get("subject_link"))
    ol = links.get(f.get("object_link")) if f.get("object_link") else None
    checks = []
    p = f.get("predicate")

    def cls(l):
        return (l.get("class_hint") if l and l["decision"] == "new" else class_of(l and l.get("uid"))) if l else None
    s_cls, o_cls = cls(sl), cls(ol)
    # 1. schema
    if p in rels:
        r = rels[p]
        ok = (s_cls in (None, r["from"])) and (o_cls in (None, r["to"]))
        checks.append({"name": "스키마", "ok": ok,
                       "detail": f"{p}: {r['from']} → {r['to']}" + ("" if ok else f" · 실제 {s_cls} → {o_cls}")})
    elif p in pfs:
        enum = o["classes"][pfs[p]["class"]]["enums"][pfs[p]["property"]]
        ok = f.get("value") in enum and s_cls in (None, pfs[p]["class"])
        checks.append({"name": "스키마", "ok": ok, "detail": f"{p} = {f.get('value')} (허용: {', '.join(enum)})"})
    else:
        checks.append({"name": "스키마", "ok": False, "detail": f"온톨로지에 없는 관계 {p}"})
    # 2. entity links
    decisions = [l["decision"] for l in (sl, ol) if l]
    ent_ok = all(d in ("same", "new") for d in decisions)
    ent_detail = " · ".join(f"{l['surface']} → {l.get('name') or '미연결'} ({l['decision']} {l['score']})"
                            for l in (sl, ol) if l)
    checks.append({"name": "개체 연결", "ok": True if ent_ok else (None if "nil" not in decisions else False),
                   "detail": ent_detail})
    return checks, sl, ol


def run(input_id):
    cl = read_artifact(input_id, "clean")
    rs = read_artifact(input_id, "resolve")
    vcfg = config()["validate"]
    rels = ontology()["relations"]
    links = {l["link_id"]: l for l in rs["links"]}
    chunks = {c["chunk_id"]: c for c in cl["chunks"]}
    kind = cl["kind"]
    results = []
    for f in rs["facts"]:
        checks, sl, ol = check_fact(f, links)
        p = f.get("predicate")
        ev = (f.get("evidence") or "").strip()
        text = chunks.get(f.get("chunk_id"), {}).get("text", "")
        ev_ok = bool(ev) and (ev in text or ev.rstrip(".") in text)
        checks.append({"name": "근거 문장", "ok": ev_ok,
                       "detail": "원문에서 찾음" if ev_ok else "근거 구절이 조각 텍스트에 없음"})
        # hedging: "추정 · 예정" in the evidence can't be a confirmed statement
        cert = f.get("certainty")
        hedge = [w for w in vcfg["hedge_words"] if w in ev]
        if cert == "confirmed" and hedge:
            cert_ok, cert_detail = False, f"근거에 '{'·'.join(hedge)}' — 확정으로 볼 수 없음"
        else:
            cert_ok = cert == "confirmed"
            cert_detail = "확정 표현" if cert_ok else "추정 표현 — 확정으로 올리지 않음"
        checks.append({"name": "확신도", "ok": cert_ok, "detail": cert_detail})
        # system of record
        oc = official_check(f, sl, ol, kind)
        if oc is not None:
            checks.append({"name": "기준 시스템", "ok": oc[0], "detail": oc[1]})
        # reference documents (already in the baseline KG?)
        hits, reverse = reference_support(p, sl and sl.get("uid"), ol and ol.get("uid"), f.get("value"))
        if hits or reverse or oc is None:
            src_detail = (", ".join(f"{a['id']} ({a['system']})" for a in hits) if hits else "뒷받침하는 문서 없음")
            if reverse and not hits:
                src_detail += f" · 반대 방향 사실은 있음({', '.join(a['id'] for a in reverse)}) → 방향 오류 의심"
            checks.append({"name": "문서 대조", "ok": True if hits else None, "detail": src_detail})
        risk = "high" if p in vcfg["high_risk"] else "normal"
        c = {x["name"]: x for x in checks}
        if c["스키마"]["ok"] is False or not ev_ok:
            decision, reason = "reject", "형식 오류" if c["스키마"]["ok"] is False else "근거 문장 불일치"
        elif p == "CONFIRMED_CAUSE" and not cert_ok:
            decision, reason = "reject", "근거는 추정 — 확정 원인으로 올릴 수 없음 (SUSPECTED_CAUSE 후보로 다시)"
        elif c["개체 연결"]["ok"] is False:
            decision, reason = "hold", "개체를 찾지 못함 (참조 무결성)"
        elif oc is not None and oc[0] is False:
            decision, reason = "hold", "기준 시스템과 불일치 — 덮어쓰지 않고 기록"
        elif not cert_ok:
            decision = "hold"
            reason = (f"근거에 '{'·'.join(hedge)}' — 확정된 사실로 볼 수 없음" if cert == "confirmed"
                      else "추정 — 사람 확인 필요") + (" (고위험)" if risk == "high" else "")
        elif c["개체 연결"]["ok"] is None:
            decision, reason = "hold", "개체 연결 검토 필요" + (" (참조 무결성 의심)" if any(
                "참조 무결성" in r for l in (sl, ol) if l for r in l.get("reasons", [])) else "")
        elif oc is not None:
            decision, reason = "approve", "이미 기준 KG에 있음" if hits else "기준 시스템과 일치"
        elif hits:
            decision, reason = "approve", "이미 기준 KG에 있음"
        elif reverse:
            decision, reason = "hold", "방향 오류 의심"
        elif risk == "high" and not rels.get(p, {}).get("hedged"):
            decision, reason = "hold", "근거 문서 없음 (고위험)"
        else:
            decision, reason = "approve", "원문 근거로 승인"
        results.append({"fact_id": f["fact_id"], "fact": f, "checks": checks, "decision": decision,
                        "reason": reason, "risk": risk,
                        "certainty": "suspected" if (cert == "confirmed" and not cert_ok) else cert,
                        "subject": sl, "object": ol, "sources": [a["id"] for a in hits]})
    # structured rows are one unit: if one value of a row is held, the whole row waits
    for line in {r["fact"].get("row_line") for r in results if r["fact"].get("method") == "rule"}:
        row = [r for r in results if r["fact"].get("row_line") == line]
        held = [r for r in row if r["decision"] != "approve"]
        if held:
            for r in row:
                if r["decision"] == "approve":
                    r["decision"], r["reason"] = "hold", f"같은 행의 {held[0]['fact']['predicate']} 보류 → 행 단위로 대기"
    # out-of-ontology relations -> ontology candidates
    candidates = []
    for oo in rs["out_of_ontology"]:
        subs = [links[i] for i in oo["subject_links"]]
        ob = links[oo["object_link"]]
        candidates.append({"kind": "relation", "id": oo["oo_id"], "name": oo.get("suggested_relation"),
                           "phrase": oo.get("relation_phrase"), "chunk_id": oo.get("chunk_id"),
                           "evidence": oo.get("evidence"),
                           "between": [x for x in [s.get("name") or s["surface"] for s in subs]
                                       + [ob.get("name") or ob["surface"]] if x],
                           "between_uids": [s.get("uid") for s in subs] + [ob.get("uid")],
                           "from_class": class_of(subs[0].get("uid")) if subs else None,
                           "to_class": class_of(ob.get("uid")) or "(새 개념)",
                           "topic": ob["surface"] or "(새 개념)", "sources": []})
    # unknown terms -> term candidates (only if really unknown)
    terms = []
    for t in rs["unknown_terms"]:
        l = links[t["link"]]
        if l["decision"] == "same":
            terms.append({**t, "decision": "drop", "reason": f"사전에 있음 → {l['name']}"})
        else:
            terms.append({**t, "decision": "term_candidate", "reason": "사전 · 마스터에 없음 → 용어 후보"})
    # unresolved references -> question queue (unless the link step resolved them)
    questions = []
    for q in rs["unresolved_references"]:
        l = links[q["link"]]
        if l["decision"] in ("same", "review") and l.get("uid"):
            questions.append({**q, "decision": "resolved_by_link", "reason": f"연결 단계에서 {l['name']} ({l['decision']} {l['score']})"})
        else:
            questions.append({**q, "decision": "question", "reason": q.get("why") or "대상 불명"})
    # lexicon hidden-label proposals from STT pronunciation fixes
    idx = alias_index()
    lex = []
    for n in cl["normalizations"]:
        spoken = n.get("spoken") or (n["surface"] if n["method"] == "발음 복원" else None)
        entries = idx.get(str(n["result"]).casefold())
        if spoken and entries and len({e["ref"] for e in entries}) == 1:
            lex.append({"spoken": spoken, "written": n["result"], "ref": entries[0]["ref"], "pref": entries[0]["pref"],
                        "chunk_id": n["chunk_id"]})
    summary = {}
    for r in results:
        summary[r["decision"]] = summary.get(r["decision"], 0) + 1
    return write_artifact(input_id, "validate", {
        "step": "validate", "input": input_id, "doc_id": cl["doc_id"], "results": results,
        "ontology_candidates": candidates, "term_candidates": terms, "questions": questions,
        "lexicon_candidates": lex, "summary": summary})
