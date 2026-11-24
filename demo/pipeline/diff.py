"""Step 7 · 비교: graph diff vs run 0, ontology v1 -> v1.1 proposal, CQ before/after."""
import json

import yaml

from .common import config, cypher, ontology, runs_dir, read_artifact
from . import graph


def run_cq():
    out = []
    for q in config()["cq"]:
        try:
            rows = cypher(q["cypher"])
        except Exception as e:
            rows = [{"error": str(e)}]
        out.append({"id": q["id"], "question": q["question"], "rows": rows, "answered": bool(rows)})
    return out


def snapshot_cq(name):
    data = run_cq()
    (runs_dir() / f"cq_{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2, default=str),
                                                encoding="utf-8")
    return data


def load_cq(name):
    p = runs_dir() / f"cq_{name}.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def graph_diff():
    new_nodes = cypher("""MATCH (n) WHERE n.run_id IS NOT NULL AND n.run_id <> 'run0'
                            AND NOT n:Chunk AND NOT n:Document AND NOT n:ReviewItem AND NOT n:OntologyCandidate
                          RETURN labels(n)[0] AS 클래스, n.name AS 이름, n.uid AS uid, n.run_id AS run""")
    changed = cypher("""MATCH (p:Product) WHERE p.status_changed_run IS NOT NULL
                        RETURN p.name AS 이름, p.status_prev AS 이전, p.status AS 현재, p.status_changed_run AS run,
                               p.status_sources AS 근거""")
    new_rels = cypher("""MATCH (a)-[r]->(b) WHERE r.first_run IS NOT NULL AND r.first_run <> 'run0'
                           AND NOT type(r) IN ['HAS_CHUNK','MENTIONS','ABOUT','FROM_CHUNK','SEEN_IN']
                         RETURN a.name AS 주어, type(r) AS 관계, b.name AS 목적어, r.sources AS 근거, r.first_run AS run""")
    more_src = cypher("""MATCH (a)-[r]->(b) WHERE r.first_run = 'run0' AND size(r.sources) > 1
                         RETURN a.name AS 주어, type(r) AS 관계, b.name AS 목적어, r.sources AS 근거""")
    reviews = cypher("""MATCH (r:ReviewItem) OPTIONAL MATCH (r)-[:ABOUT]->(e)
                        RETURN r.kind AS 종류, r.summary AS 내용, r.reason AS 사유, r.run_id AS run,
                               collect(e.name) AS 관련, r.rid AS rid ORDER BY rid""")
    cands = cypher("""MATCH (o:OntologyCandidate) OPTIONAL MATCH (o)-[:ABOUT]->(e)
                      RETURN o.kind AS 종류, o.name AS 이름, o.detail AS 표현, o.topic AS 대상, o.sources AS 근거,
                             o.run_id AS run, collect(e.name) AS 관련, o.cid AS cid ORDER BY cid""")
    docs = cypher("MATCH (d:Document) WHERE d.kind <> 'news' RETURN d.doc_id AS doc, d.title AS 제목, d.kind AS 종류")
    return {"new_nodes": new_nodes, "changed": changed, "new_rels": new_rels, "more_sources": more_src,
            "reviews": reviews, "candidates": cands, "documents": docs, "stats": graph.stats()}


def ontology_proposal():
    """v1 + candidates from all validated inputs -> v1.1 proposal (never applied automatically)."""
    v1 = ontology()
    rel_add, term_add, label_add = [], [], []
    for i in config()["inputs"]:
        try:
            va = read_artifact(i["id"], "validate")
        except FileNotFoundError:
            continue
        for c in va["ontology_candidates"]:
            rel_add.append({"name": c["name"], "from": c["from_class"], "to": c["to_class"],
                            "example": f"{' · '.join(c['between'])} ({c['topic']})", "evidence": c["evidence"],
                            "seen_in": i["id"], "corpus_support": c["sources"],
                            "corpus_name": c["corpus_names"],
                            "note": "기사 코퍼스는 같은 관계를 " + ", ".join(c["corpus_names"]) + "로 표기 — 이름 통일 필요"
                            if c["corpus_names"] and c["name"] not in c["corpus_names"] else ""})
        for t in va["term_candidates"]:
            if t["decision"] == "term_candidate":
                term_add.append({"term": t["term"], "guess_class": t.get("guess_class"), "evidence": t.get("evidence"),
                                 "seen_in": i["id"]})
        for l in va["lexicon_candidates"]:
            label_add.append({"ref": l["ref"], "pref": l["pref"], "hidden": l["spoken"], "seen_in": i["id"]})
    seen, labels = set(), []
    for l in label_add:
        if (l["ref"], l["hidden"]) not in seen:
            seen.add((l["ref"], l["hidden"]))
            labels.append(l)
    proposal = {"base_version": v1["version"], "proposed_version": "1.1.0-proposal",
                "relations_add": rel_add, "terms_add": term_add, "hidden_labels_add": labels,
                "status": "제안 — 사람 승인 전에는 적용하지 않음"}
    (runs_dir() / "ontology.v1.1.proposal.yaml").write_text(
        yaml.safe_dump(proposal, allow_unicode=True, sort_keys=False), encoding="utf-8")
    return proposal


def compare():
    before = load_cq("run0") or []
    after = run_cq()
    cq = [{"id": a["id"], "question": a["question"], "before": (before[k]["rows"] if k < len(before) else None),
           "after": a["rows"]} for k, a in enumerate(after)]
    v1 = ontology()
    return {"graph": graph_diff(), "ontology": {"v1": {"classes": list(v1["classes"]),
                                                       "relations": list(v1["relations"])},
                                                "proposal": ontology_proposal()},
            "cq": cq}
