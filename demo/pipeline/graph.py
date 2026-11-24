"""Graph writes shared by reset (run 0) and load (later runs). Plain Cypher only (no APOC)."""
import re

from .common import cypher, entities, reference, ontology, uid, class_of, entity_uid

META_LABEL = "DemoMeta"            # marker node so reset never wipes a foreign database
META_ID = "eb-kg-demo"
META_IDS_OLD = ["eb-news-kg-demo"]   # earlier demo versions: still ours, safe to wipe
DIFF_LABELS = ["DiffNew", "DiffChanged", "DiffHold"]
OPS_LABELS = ["ReviewItem", "OntologyCandidate"]

_IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def ident(name):
    """Labels / relationship types come from the ontology file: whitelist the characters."""
    if not _IDENT.match(name):
        raise ValueError(f"unsafe identifier: {name}")
    return name


def is_demo_db():
    rows = cypher(f"MATCH (m:{META_LABEL}) WHERE m.id IN $ids RETURN count(m) AS n", ids=[META_ID] + META_IDS_OLD)
    return rows[0]["n"] > 0


def node_count():
    return cypher("MATCH (n) RETURN count(n) AS n")[0]["n"]


def drop_stale_constraints():
    """Constraints left from an earlier ontology (e.g. another demo domain) would keep old labels alive."""
    keep = {f"{lab.lower()}_{ {'ReviewItem': 'rid', 'OntologyCandidate': 'cid'}.get(lab, 'uid') }"
            for lab in list(ontology()["classes"]) + OPS_LABELS}
    for r in cypher("SHOW CONSTRAINTS YIELD name RETURN name"):
        if r["name"] not in keep:
            cypher(f"DROP CONSTRAINT {ident(r['name'])} IF EXISTS")


def create_constraints():
    drop_stale_constraints()
    labels = list(ontology()["classes"]) + OPS_LABELS
    for lab in labels:
        key = {"ReviewItem": "rid", "OntologyCandidate": "cid"}.get(lab, "uid")
        cypher(f"CREATE CONSTRAINT {lab.lower()}_{key} IF NOT EXISTS "
               f"FOR (n:{ident(lab)}) REQUIRE n.{key} IS UNIQUE")


def wipe():
    cypher("MATCH (n) CALL { WITH n DETACH DELETE n } IN TRANSACTIONS OF 1000 ROWS")


def merge_node(cls, props, run_id):
    """MERGE by uid; returns 'created' | 'exists'."""
    u = props["uid"]
    rows = cypher(f"""
        MERGE (n:{ident(cls)} {{uid:$uid}})
        ON CREATE SET n += $props, n.run_id = $run, n._created = true
        WITH n, coalesce(n._created, false) AS created
        REMOVE n._created
        RETURN created""", uid=u, props=props, run=run_id)
    return "created" if rows and rows[0]["created"] else "exists"


def rel_key(rel, props):
    """Relationship properties that belong to its identity (ontology `key`), e.g. SUPPLIES.item."""
    keys = ontology()["relations"].get(rel, {}).get("key", [])
    return {k: (props or {}).get(k) for k in keys}


def key_pattern(key):
    return ("{" + ", ".join(f"{ident(k)}: $key.{ident(k)}" for k in key) + "}") if key else ""


def merge_rel(s_uid, rel, o_uid, props, run_id):
    """Node keys first, relationship second (avoids the 'MERGE whole pattern' duplicate trap)."""
    sc, oc = class_of(s_uid), class_of(o_uid)
    sources = props.pop("sources", [])
    evidence = props.pop("evidence", [])
    key = rel_key(rel, props)
    rows = cypher(f"""
        MATCH (a:{ident(sc)} {{uid:$s}}) MATCH (b:{ident(oc)} {{uid:$o}})
        MERGE (a)-[r:{ident(rel)} {key_pattern(key)}]->(b)
        ON CREATE SET r += $props, r.first_run = $run, r.sources = [], r.evidence = [], r._created = true
        WITH r, coalesce(r._created, false) AS created
        REMOVE r._created
        SET r.sources = r.sources + [x IN $sources WHERE NOT x IN r.sources],
            r.evidence = r.evidence + [x IN $evidence WHERE NOT x IN r.evidence],
            r.last_run = CASE WHEN created THEN $run ELSE coalesce(r.last_run, r.first_run) END
        RETURN created""", s=s_uid, o=o_uid, props=props, run=run_id,
                  sources=sources, evidence=evidence, key=key)
    if not rows:
        raise RuntimeError(f"missing node for {s_uid} -[{rel}]-> {o_uid}")
    return "created" if rows[0]["created"] else "exists"


# master fields that become structural relationships instead of node properties
STRUCTURAL = {"fab": ("LOCATED_IN", "Fab"), "model": ("INSTANCE_OF", "EquipmentModel"), "vendor": ("MADE_BY", "Vendor")}
MASTER_ONLY = {"class", "prompt", *STRUCTURAL}


def set_property_fact(u, pf_name, value, source, run_id):
    """Property facts (e.g. WORK_STATUS -> MaintenanceWork.status) keep their sources next to the value."""
    pf = ontology()["property_facts"][pf_name]
    prop = ident(pf["property"])
    cypher(f"MATCH (n:{ident(pf['class'])} {{uid:$u}}) SET n.{prop} = $v, "
           f"n.{prop}_sources = coalesce(n.{prop}_sources, []) + [x IN [$a] WHERE NOT x IN coalesce(n.{prop}_sources, [])]",
           u=u, v=value, a=source)


def load_baseline():
    """Run 0: master entities + facts from the reference sources (CMMS history, alarm log, documents)."""
    run = "run0"
    cypher(f"MERGE (m:{META_LABEL} {{id:$id}}) SET m.note = 'created by demo reset'", id=META_ID)
    pfs = ontology()["property_facts"]
    for e in entities():
        props = {k: v for k, v in e.items() if k not in MASTER_ONLY or k == "fab"}
        props["uid"] = entity_uid(e)
        for pf in pfs.values():
            if pf["class"] == e["class"] and pf["property"] in props:
                props[pf["property"] + "_sources"] = ["master"]
        merge_node(e["class"], props, run)
    for e in entities():
        for field, (rel, cls) in STRUCTURAL.items():
            if e.get(field) and rel in ontology()["relations"] and ontology()["relations"][rel]["from"] == e["class"]:
                merge_rel(entity_uid(e), rel, uid(cls, e[field]), {"certainty": "confirmed", "sources": ["master"]}, run)
    rels = ontology()["relations"]
    for a in reference():
        if not a.get("baseline"):
            continue
        merge_node("Document", {"uid": uid("Document", a["id"]), "doc_id": a["id"], "kind": a.get("kind", "doc"),
                                "title": a["title"], "source": a.get("source"), "system": a.get("system"),
                                "official": a.get("official"), "date": str(a["date"]), "summary": a["summary"]}, run)
        for f in a["facts"]:
            if f["p"] in pfs:
                set_property_fact(f["s"], f["p"], f["value"], a["id"], run)
            elif f["p"] in rels:
                merge_rel(f["s"], f["p"], f["o"], {"certainty": "confirmed", **(f.get("props") or {}),
                                                   "sources": [a["id"]]}, run)
            for u in (f.get("s"), f.get("o")):
                if isinstance(u, str):
                    cypher(f"MATCH (d:Document {{uid:$d}}) MATCH (e:{ident(class_of(u))} {{uid:$u}}) "
                           "MERGE (d)-[:MENTIONS]->(e)", d=uid("Document", a["id"]), u=u)


def clear_diff_labels():
    for lab in DIFF_LABELS:
        cypher(f"MATCH (n:{lab}) REMOVE n:{lab}")


def stats():
    n = cypher("MATCH (n) WHERE NOT n:DemoMeta RETURN count(n) AS n")[0]["n"]
    r = cypher("MATCH ()-[r]->() RETURN count(r) AS n")[0]["n"]
    return {"nodes": n, "relationships": r}
