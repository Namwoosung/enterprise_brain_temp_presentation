"""Step 6 · 적재: staging (change plan) -> publish, idempotent.

1. build_plan(): compare the validated result with the current graph and list the changes
   (this list is the "staging" area: nothing is written yet).
2. apply(): write them. Node keys are MERGEd one by one, then relationships.
3. build_plan() again: must contain no changes (re-running the same input changes nothing).
Held items, questions and ontology proposals are stored as ReviewItem / OntologyCandidate
nodes so they stay visible next to the facts they are about.
"""
from .common import cypher, read_artifact, write_artifact, uid, class_of
from . import graph


def _exists_node(u):
    c = class_of(u)
    return bool(cypher(f"MATCH (n:{graph.ident(c)} {{uid:$u}}) RETURN 1 AS x LIMIT 1", u=u))


def _rel_state(s, p, o, props=None):
    key = graph.rel_key(p, props)
    rows = cypher(f"MATCH (a {{uid:$s}})-[r:{graph.ident(p)} {graph.key_pattern(key)}]->(b {{uid:$o}}) "
                  "RETURN r.sources AS src", s=s, o=o, key=key)
    return rows[0]["src"] if rows else None


def _status(u):
    rows = cypher("MATCH (p:Product {uid:$u}) RETURN p.status AS s, p.status_sources AS src", u=u)
    return rows[0] if rows else None


def build_plan(input_id):
    cl = read_artifact(input_id, "clean")
    va = read_artifact(input_id, "validate")
    rs = read_artifact(input_id, "resolve")
    doc_id = cl["doc_id"]
    duid = uid("Document", doc_id)
    ops = []

    def op(kind, target, detail, data, change=True):
        ops.append({"op": kind, "target": target, "detail": detail, "data": data, "change": change})

    # document + chunks + mentions
    meta = cl["meta"]
    if _exists_node(duid):
        op("noop", duid, "문서 이미 있음", {}, False)
    else:
        op("create_node", duid, f"Document {doc_id}", {"cls": "Document", "props": {
            "uid": duid, "doc_id": doc_id, "kind": cl["kind"], "title": meta.get("title"),
            "date": str(meta.get("date"))}})
    for c in cl["chunks"]:
        cu = uid("Chunk", c["chunk_id"])
        if not _exists_node(cu):
            op("create_chunk", cu, c["text"][:40], {"doc": duid, "props": {
                "uid": cu, "chunk_id": c["chunk_id"], "text": c["text"], "speaker": c.get("speaker"),
                "ts": c.get("ts")}})
    for m in rs["mention_links"]:
        if m["decision"] == "same" and m["uid"]:
            cu = uid("Chunk", m["chunk_id"])
            if not cypher("MATCH (c:Chunk {uid:$c})-[:MENTIONS]->({uid:$e}) RETURN 1 AS x", c=cu, e=m["uid"]):
                op("mention", f"{cu} → {m['uid']}", m["surface"], {"chunk": cu, "entity": m["uid"]})

    created_new = set()
    for r in va["results"]:
        f, sl, ol = r["fact"], r["subject"], r["object"]
        src = [doc_id] + r["sources"]
        chunk = uid("Chunk", f["chunk_id"])
        if r["decision"] == "approve":
            for l in (sl, ol):
                if l and l["decision"] == "new" and l["uid"] not in created_new and not _exists_node(l["uid"]):
                    created_new.add(l["uid"])
                    op("create_node", l["uid"], f"새 제품 {l['name']}", {"cls": "Product", "props": {
                        "uid": l["uid"], "code": l["uid"].split(":", 1)[1], "name": l["name"],
                        "status_sources": [], "needs_review": True}})
                    op("review", f"{doc_id}:{l['uid']}", f"새 제품 '{l['name']}' — 마스터 등록·개발사 연결 확인",
                       {"rid": f"{doc_id}:{l['uid']}", "kind": "new_entity",
                        "summary": f"새 제품 '{l['name']}' 마스터 등록·개발사 연결 확인",
                        "reason": "마스터에 없던 제품", "about": [l["uid"]], "chunk": chunk})
            if f["predicate"] == "PRODUCT_STATUS":
                cur = None if sl["uid"] in created_new else _status(sl["uid"])
                if cur and cur["s"] == f["value"] and set(src) <= set(cur["src"] or []):
                    op("noop", sl["uid"], f"status 이미 {f['value']}", {}, False)
                elif cur and cur["s"] == f["value"]:
                    op("add_source", sl["uid"], f"status {f['value']} 근거 추가", {"uid": sl["uid"], "sources": src,
                                                                                  "value": f["value"], "change_status": False})
                else:
                    op("set_status", sl["uid"], f"status {cur['s'] if cur else '-'} → {f['value']}",
                       {"uid": sl["uid"], "value": f["value"], "prev": cur["s"] if cur else None,
                        "sources": src, "evidence": f["chunk_id"], "change_status": bool(cur)})
            else:
                state = _rel_state(sl["uid"], f["predicate"], ol["uid"], f.get("props")) if sl["uid"] not in created_new else None
                label = f"{sl['name']} -[{f['predicate']}]-> {ol['name']}"
                data = {"s": sl["uid"], "p": f["predicate"], "o": ol["uid"],
                        "props": {"certainty": "confirmed", **(f.get("props") or {})},
                        "sources": src, "evidence": [f["chunk_id"]]}
                if state is None:
                    op("create_rel", label, "새 관계", data)
                elif not set(src) <= set(state or []):
                    op("add_source", label, "같은 관계 · 근거만 추가", data)
                else:
                    op("noop", label, "이미 있음", {}, False)
        elif r["decision"] == "hold":
            rid = f"{doc_id}:{r['fact_id']}"
            about = [l["uid"] for l in (sl, ol) if l and l.get("uid") and l["decision"] in ("same", "review")]
            obj = (ol and (ol.get("name") or ol["surface"])) or f.get("value")
            summary = f"{sl.get('name') or sl['surface']} {f['predicate']} {obj}"
            if not cypher("MATCH (r:ReviewItem {rid:$r}) RETURN 1 AS x", r=rid):
                op("review", rid, summary, {"rid": rid, "kind": "hold", "summary": summary, "reason": r["reason"],
                                            "certainty": r["certainty"], "about": about, "chunk": chunk})
    for q in va["questions"]:
        if q["decision"] == "question":
            rid = f"{doc_id}:{q['ref_id']}"
            if not cypher("MATCH (r:ReviewItem {rid:$r}) RETURN 1 AS x", r=rid):
                op("review", rid, f"질문: '{q['text']}'", {"rid": rid, "kind": "question",
                                                         "summary": f"'{q['text']}'이 가리키는 대상은?",
                                                         "reason": q["reason"], "about": [],
                                                         "chunk": uid("Chunk", q["chunk_id"])})
    for c in va["ontology_candidates"]:
        cid = f"relation:{c['name']}:{'+'.join(x or '?' for x in c['between_uids'])}"
        if not cypher("MATCH (o:OntologyCandidate {cid:$c}) RETURN 1 AS x", c=cid):
            op("candidate", cid, f"관계 후보 {c['name']} ({' · '.join(c['between'])})",
               {"cid": cid, "kind": "relation", "name": c["name"], "detail": c["phrase"], "topic": c["topic"],
                "sources": c["sources"], "about": [u for u in c["between_uids"] if u],
                "chunk": uid("Chunk", c["chunk_id"])})
    for t in va["term_candidates"]:
        if t["decision"] != "term_candidate":
            continue
        cid = f"term:{t['term']}"
        if not cypher("MATCH (o:OntologyCandidate {cid:$c}) RETURN 1 AS x", c=cid):
            op("candidate", cid, f"용어 후보 '{t['term']}'", {"cid": cid, "kind": "term", "name": t["term"],
                                                         "detail": t["reason"], "topic": t.get("guess_class"),
                                                         "sources": [], "about": [],
                                                         "chunk": uid("Chunk", t["chunk_id"])})
    return ops


def apply(input_id, ops):
    run = input_id
    for o in ops:
        d = o["data"]
        if o["op"] == "create_node":
            graph.merge_node(d["cls"], d["props"], run)
        elif o["op"] == "create_chunk":
            graph.merge_node("Chunk", d["props"], run)
            cypher("MATCH (d:Document {uid:$d}) MATCH (c:Chunk {uid:$c}) MERGE (d)-[:HAS_CHUNK]->(c)",
                   d=d["doc"], c=d["props"]["uid"])
        elif o["op"] == "mention":
            cypher("MATCH (c:Chunk {uid:$c}) MATCH (e {uid:$e}) MERGE (c)-[:MENTIONS]->(e)", c=d["chunk"], e=d["entity"])
        elif o["op"] in ("set_status", "add_source") and "value" in d:
            cypher("""MATCH (p:Product {uid:$u})
                      SET p.status_prev = CASE WHEN $chg THEN p.status ELSE p.status_prev END,
                          p.status_changed_run = CASE WHEN $chg THEN $run ELSE p.status_changed_run END,
                          p.status = $v,
                          p.status_sources = coalesce(p.status_sources, []) +
                                             [x IN $src WHERE NOT x IN coalesce(p.status_sources, [])]""",
                   u=d["uid"], v=d["value"], src=d["sources"], run=run, chg=d.get("change_status", False))
        elif o["op"] in ("create_rel", "add_source"):
            graph.merge_rel(d["s"], d["p"], d["o"], {**d["props"], "sources": list(d["sources"]),
                                                    "evidence": list(d["evidence"])}, run)
        elif o["op"] == "review":
            cypher("""MERGE (r:ReviewItem {rid:$rid})
                      ON CREATE SET r.kind=$kind, r.summary=$summary, r.reason=$reason, r.certainty=$cert, r.run_id=$run
                      WITH r MATCH (c:Chunk {uid:$chunk}) MERGE (r)-[:FROM_CHUNK]->(c)""",
                   rid=d["rid"], kind=d["kind"], summary=d["summary"], reason=d["reason"],
                   cert=d.get("certainty"), run=run, chunk=d["chunk"])
            for a in d["about"]:
                cypher("MATCH (r:ReviewItem {rid:$rid}) MATCH (e {uid:$u}) MERGE (r)-[:ABOUT]->(e)", rid=d["rid"], u=a)
        elif o["op"] == "candidate":
            cypher("""MERGE (o:OntologyCandidate {cid:$cid})
                      ON CREATE SET o.kind=$kind, o.name=$name, o.detail=$detail, o.topic=$topic,
                                    o.sources=$sources, o.run_id=$run
                      WITH o MATCH (c:Chunk {uid:$chunk}) MERGE (o)-[:SEEN_IN]->(c)""",
                   cid=d["cid"], kind=d["kind"], name=d["name"], detail=d["detail"], topic=d["topic"],
                   sources=d["sources"], run=run, chunk=d["chunk"])
            for a in d["about"]:
                cypher("MATCH (o:OntologyCandidate {cid:$cid}) MATCH (e {uid:$u}) MERGE (o)-[:ABOUT]->(e)", cid=d["cid"], u=a)
    mark_diff()


def mark_diff():
    """Display-only labels for Neo4j Browser colouring, cumulative since run 0."""
    graph.clear_diff_labels()
    cypher("MATCH (n) WHERE n.run_id IS NOT NULL AND n.run_id <> 'run0' AND NOT n:Chunk AND NOT n:Document "
           "AND NOT n:ReviewItem AND NOT n:OntologyCandidate SET n:DiffNew")
    cypher("MATCH (n:Product) WHERE n.status_changed_run IS NOT NULL SET n:DiffChanged")
    cypher("MATCH (n) WHERE n:ReviewItem OR n:OntologyCandidate SET n:DiffHold")


CYPHER_SHOWN = {
    "create_node": "MERGE (n:{cls} {{uid:$uid}}) ON CREATE SET n += $props",
    "create_chunk": "MERGE (c:Chunk {uid:$uid}) ... MERGE (d:Document)-[:HAS_CHUNK]->(c)",
    "mention": "MATCH (c:Chunk {uid:$c}) MATCH (e {uid:$e}) MERGE (c)-[:MENTIONS]->(e)",
    "set_status": "MATCH (p:Product {uid:$u}) SET p.status_prev = p.status, p.status = $v, ...",
    "create_rel": "MATCH (a {uid:$s}) MATCH (b {uid:$o}) MERGE (a)-[r:{p}]->(b) ON CREATE SET r += $props",
    "add_source": "... SET r.sources = r.sources + [new sources]",
    "review": "MERGE (r:ReviewItem {rid:$rid}) ... MERGE (r)-[:ABOUT]->(e)",
    "candidate": "MERGE (o:OntologyCandidate {cid:$cid}) ... MERGE (o)-[:SEEN_IN]->(c)",
}


def run(input_id):
    before = graph.stats()
    plan = build_plan(input_id)
    changes = [o for o in plan if o["change"]]
    apply(input_id, changes)
    after = graph.stats()
    replan = [o for o in build_plan(input_id) if o["change"]]
    counts = {}
    for o in changes:
        counts[o["op"]] = counts.get(o["op"], 0) + 1
    for o in plan:
        o["cypher"] = CYPHER_SHOWN.get(o["op"], "")
        o.pop("data", None)
    return write_artifact(input_id, "load", {
        "step": "load", "input": input_id, "plan": plan, "counts": counts,
        "before": before, "after": after, "rerun_changes": len(replan),
        "idempotent": len(replan) == 0})
