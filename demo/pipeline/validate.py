"""Step 5 · 검증: decide what each candidate becomes.

Checks per fact: ontology schema · entity link · evidence really in the text ·
supporting article in the news corpus (원천 대조) · certainty.
Outcomes:
  approve            -> loaded as a confirmed fact
  hold               -> ReviewItem (needs a person or a source)
  reject             -> dropped, reason shown (malformed)
  ontology_candidate -> relation / term not in ontology v1 (proposal for v1.1)
  question           -> unresolved reference, goes to the question queue
LLM output is never trusted on its own: a suspected claim is never promoted to confirmed.
"""
import re

from .common import ontology, corpus, config, class_of, read_artifact, write_artifact
from .clean import alias_index


def _toks(s):
    return frozenset(t for t in re.split(r"[\s/·\-]+", str(s).casefold()) if t)


def _same_name(a, b):
    ta, tb = _toks(a), _toks(b)
    return bool(ta and tb) and len(ta & tb) / len(ta | tb) >= 0.6


def _match_side(corpus_side, uid, name):
    if isinstance(corpus_side, str):
        return corpus_side == uid
    if isinstance(corpus_side, dict):
        n = corpus_side.get("new") or corpus_side.get("name")
        return bool(n) and _same_name(n, name)
    return False


# CUSTOMIZE: the "source of truth" here is the news corpus. For another domain, check against
# the official system instead (CMMS / ERP table, contract register, ...).
def _same_key(p, a_props, b_props):
    """Key properties (ontology `key`, e.g. SUPPLIES.item) must agree when both sides give them."""
    for k in ontology()["relations"].get(p, {}).get("key", []):
        a, b = (a_props or {}).get(k), (b_props or {}).get(k)
        if a and b and str(a).casefold() != str(b).casefold():
            return False
    return True


def supporting_articles(p, s_uid, s_name, o_uid, o_name, value=None, any_predicate=False, props=None):
    hits, reverse = [], []
    for a in corpus():
        for f in a["facts"]:
            if not any_predicate and f["p"] != p:
                continue
            if not any_predicate and not _same_key(p, props, f.get("props")):
                continue
            s_ok = _match_side(f.get("s"), s_uid, s_name)
            if p == "PRODUCT_STATUS" and not any_predicate:
                if s_ok and f.get("value") == value:
                    hits.append(a)
                continue
            o_side = f.get("o") if "o" in f else f.get("o_new")
            if s_ok and _match_side(o_side, o_uid, o_name):
                hits.append(a)
            elif _match_side(f.get("s"), o_uid, o_name) and _match_side(o_side, s_uid, s_name):
                reverse.append(a)
    return hits, reverse


def check_fact(f, links):
    o = ontology()
    rels = {k: v for k, v in o["relations"].items() if v.get("fact")}
    pfs = o["property_facts"]
    sl = links.get(f.get("subject_link"))
    ol = links.get(f.get("object_link")) if f.get("object_link") else None
    checks = []
    p = f.get("predicate")
    s_cls = "Product" if sl and sl["decision"] == "new" else class_of(sl and sl.get("uid"))
    o_cls = ("Product" if ol and ol["decision"] == "new" else class_of(ol and ol.get("uid"))) if ol else None
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
    # 3. evidence present in the chunk text
    return checks, sl, ol, s_cls, o_cls


def run(input_id):
    cl = read_artifact(input_id, "clean")
    rs = read_artifact(input_id, "resolve")
    vcfg = config()["validate"]
    links = {l["link_id"]: l for l in rs["links"]}
    chunks = {c["chunk_id"]: c for c in cl["chunks"]}
    baseline_ids = {a["id"] for a in corpus() if a.get("baseline")}
    results = []
    for f in rs["facts"]:
        checks, sl, ol, s_cls, o_cls = check_fact(f, links)
        ev = (f.get("evidence") or "").strip()
        text = chunks.get(f.get("chunk_id"), {}).get("text", "")
        ev_ok = bool(ev) and (ev in text or ev.rstrip(".") in text)
        checks.append({"name": "근거 문장", "ok": ev_ok,
                       "detail": "원문에서 찾음" if ev_ok else "근거 구절이 조각 텍스트에 없음"})
        hits, reverse = supporting_articles(f.get("predicate"), sl and sl.get("uid"), sl and sl.get("name"),
                                            ol and ol.get("uid"), ol and ol.get("name"), f.get("value"),
                                            props=f.get("props"))
        new_hits = [a for a in hits if a["id"] not in baseline_ids]
        old_hits = [a for a in hits if a["id"] in baseline_ids]
        src_detail = (", ".join(f"{a['id']} {a['publisher']} {a['date']}" for a in hits) if hits
                      else "뒷받침하는 기사 없음")
        if reverse and not hits:
            src_detail += f" · 반대 방향 사실은 있음({', '.join(a['id'] for a in reverse)}) → 방향 오류 의심"
        checks.append({"name": "원천 대조", "ok": bool(hits), "detail": src_detail})
        cert = f.get("certainty")
        checks.append({"name": "확신도", "ok": cert == "confirmed",
                       "detail": "확정 표현" if cert == "confirmed" else "추정 표현 — 확정으로 올리지 않음"})
        risk = "high" if f.get("predicate") in vcfg["high_risk"] else "normal"
        c = {x["name"]: x for x in checks}
        if c["스키마"]["ok"] is False or not ev_ok:
            decision, reason = "reject", "형식 오류" if c["스키마"]["ok"] is False else "근거 문장 불일치"
        elif c["개체 연결"]["ok"] is False:
            decision, reason = "hold", "개체를 찾지 못함 (미연결)"
        elif cert != "confirmed":
            decision, reason = "hold", "추정 — 확인 필요"
        elif c["개체 연결"]["ok"] is None:
            decision, reason = "hold", "개체 연결 검토 필요"
        elif not hits:
            decision, reason = "hold", ("방향 오류 의심" if reverse else "근거 기사 없음") + (" (고위험)" if risk == "high" else "")
        else:
            decision, reason = "approve", "이미 기준 KG에 있음" if old_hits and not new_hits else "기사로 확인됨"
        results.append({"fact_id": f["fact_id"], "fact": f, "checks": checks, "decision": decision,
                        "reason": reason, "risk": risk, "certainty": cert,
                        "subject": sl, "object": ol, "sources": [a["id"] for a in hits]})
    # out-of-ontology relations -> ontology candidates
    candidates = []
    for oo in rs["out_of_ontology"]:
        subs = [links[i] for i in oo["subject_links"]]
        ob = links[oo["object_link"]]
        sup = []
        if len(subs) == 2 and all(s.get("uid") for s in subs):
            sup, _ = supporting_articles(None, subs[0]["uid"], subs[0]["name"], subs[1]["uid"], subs[1]["name"],
                                         any_predicate=True)
        candidates.append({"kind": "relation", "id": oo["oo_id"], "name": oo.get("suggested_relation"),
                           "phrase": oo.get("relation_phrase"), "chunk_id": oo.get("chunk_id"),
                           "evidence": oo.get("evidence"),
                           "between": [s.get("name") or s["surface"] for s in subs],
                           "between_uids": [s.get("uid") for s in subs],
                           "from_class": class_of(subs[0].get("uid")) if subs else None,
                           "to_class": class_of(subs[-1].get("uid")) if subs else None,
                           "topic": ob["surface"], "sources": [a["id"] for a in sup],
                           "corpus_names": sorted({f["p"] for a in sup for f in a["facts"]})})
    # unknown terms -> term candidates (only if really unknown)
    terms = []
    for t in rs["unknown_terms"]:
        l = links[t["link"]]
        if l["decision"] == "same":
            terms.append({**t, "decision": "drop", "reason": f"사전에 있음 → {l['name']}"})
        elif l["decision"] == "new":
            terms.append({**t, "decision": "new_entity", "reason": f"새 개체 후보로 처리 ({l['name']})"})
        else:
            terms.append({**t, "decision": "term_candidate", "reason": "사전 · 마스터에 없음 → 용어 후보"})
    for oo in candidates:  # the object of an out-of-ontology relation is often a new term too
        if oo["topic"] and not any(_same_name(oo["topic"], t.get("term")) for t in terms):
            terms.append({"term": oo["topic"], "chunk_id": oo["chunk_id"], "guess_class": "Technology",
                          "evidence": oo["evidence"], "decision": "term_candidate",
                          "reason": "관계 후보의 대상 · 사전에 없음"})
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
