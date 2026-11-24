"""Step 4 · 연결 (entity resolution / linking): surface text -> entity uid.

Evidence used, strongest first:
  1. exact alias from the lexicon (pref / alt / hidden)
  2. context words around the mention, for ambiguous aliases ("삼성", "SK")
  3. "company name used for its product" ("마이크론 것") -> that company's product, needs review
  4. fuzzy string similarity - never enough on its own for codes (H20 vs H200)
Two thresholds (config resolve.accept / resolve.review) give same / review / no match,
as in Fellegi-Sunter. A new product the master does not know yet becomes a "new" entity.
"""
import difflib
import re

from .common import config, entity_index, corpus, read_artifact, write_artifact, short_hash, class_of
from .clean import alias_index, scan_mentions, is_code

STRIP_TAIL = re.compile(r"(\s*(것|쪽에서|쪽|측|도|은|는|이|가|을|를))+$")
STRIP_HEAD = re.compile(r"^(기존|그|이번|새)\s+")
SPLIT_AND = re.compile(r"\s*(?:랑|이랑|와|과|및|,)\s*")


def _norm_tokens(name):
    return frozenset(t for t in re.split(r"[\s/·\-]+", name.casefold()) if t)


class Resolver:
    def __init__(self, chunks):
        self.cfg = config()["resolve"]
        self.idx = alias_index()
        self.ents = entity_index()
        self.chunks = {c["chunk_id"]: c for c in chunks}
        self.order = [c["chunk_id"] for c in chunks]
        self.new = {}  # token set -> uid
        self.products_by_company = {}
        for a in corpus():
            for f in a["facts"]:
                if f["p"] == "DEVELOPS" and isinstance(f.get("o"), str):
                    self.products_by_company.setdefault(f["s"], set()).add(f["o"])

    # ------------------------------------------------------------ helpers
    def context_text(self, chunk_id):
        if chunk_id not in self.chunks:
            return ""
        i = self.order.index(chunk_id)
        w = self.cfg["context_window"]
        return " ".join(self.chunks[c]["text"] for c in self.order[max(0, i - w): i + w + 1])

    def name(self, u):
        e = self.ents.get(u)
        return e["name"] if e else u

    def decide(self, score):
        return "same" if score >= self.cfg["accept"] else "review" if score >= self.cfg["review"] else "nil"

    def _variants(self, surface):
        v = [surface.strip()]
        s = STRIP_HEAD.sub("", STRIP_TAIL.sub("", surface.strip()))
        if s and s not in v:
            v.append(s)
        return v

    # ------------------------------------------------------------ main
    def resolve(self, surface, cls_hint=None, chunk_id=None, new_name=None):
        reasons, alts = [], []
        if not surface:
            return {"decision": "nil", "uid": None, "score": 0, "reasons": ["표현 없음"], "alternatives": []}
        ctx = self.context_text(chunk_id)
        # 1. exact alias on the whole surface (or with particles / '것' stripped)
        for v in self._variants(surface):
            entries = self.idx.get(v.casefold())
            if not entries:
                continue
            refs = sorted({e["ref"] for e in entries})
            if cls_hint:
                same_cls = [r for r in refs if class_of(r) == cls_hint]
                if same_cls:
                    refs = same_cls
                elif cls_hint == "Product" and all(class_of(r) == "Company" for r in refs):
                    return self._company_for_product(surface, refs, ctx)
            if len(refs) == 1:
                tag = "정확한 별칭" if v == surface.strip() else f"정확한 별칭 ('{v}')"
                return {"decision": "same", "uid": refs[0], "name": self.name(refs[0]), "score": 0.95,
                        "reasons": [tag], "alternatives": []}
            return self._by_context(surface, refs, entries, ctx)
        # 2. aliases inside a longer surface ("SK 12단 36GB HBM3E")
        inner = [m for m in scan_mentions(surface, None, self.idx)]
        inner_same = [m for m in inner if not cls_hint or any(class_of(r) == cls_hint for r in m["refs"])]
        long_enough = inner_same and len(inner_same[0]["surface"]) >= len(surface) * 0.6
        if len(inner_same) == 1 and len(inner_same[0]["refs"]) == 1 and (cls_hint or long_enough):
            r = inner_same[0]["refs"][0]
            return {"decision": "same", "uid": r, "name": self.name(r), "score": 0.85,
                    "reasons": [f"표현 안의 별칭 '{inner_same[0]['surface']}'"
                                + (f" (클래스 {cls_hint} 일치)" if cls_hint else "")], "alternatives": []}
        # a new entity already proposed in this document ("SK 12단 36GB HBM3E" again)
        toks = _norm_tokens(surface)
        for key, (nu, nname) in self.new.items():
            if toks and len(toks & key) / len(toks | key) >= 0.6:
                return {"decision": "new", "uid": nu, "name": nname, "score": 0.0,
                        "reasons": [f"이 문서에서 이미 제안한 새 개체 '{nname}'과 같은 표현"], "alternatives": []}
        # 3. fuzzy - shown as alternatives; codes never auto-accepted
        best = []
        for a, entries in self.idx.items():
            r = entries[0]["ref"]
            if cls_hint and class_of(r) != cls_hint:
                continue
            s = difflib.SequenceMatcher(None, surface.casefold(), a).ratio()
            if s >= self.cfg["fuzzy_min"]:
                best.append((s, r, entries[0]["alias"]))
        best.sort(reverse=True)
        seen = set()
        for s, r, a in best:
            if r in seen:
                continue
            seen.add(r)
            alts.append({"uid": r, "name": self.name(r), "score": round(s, 2), "via": a})
        # 4. a new product the master list does not know
        if new_name and cls_hint == "Product":
            key = _norm_tokens(new_name)
            uid = self.new.setdefault(key, (f"Product:new-{short_hash(' '.join(sorted(key)))}", new_name))[0]
            company = [m for m in inner if any(class_of(x) == "Company" for x in m["refs"])]
            reasons = ["마스터에 없는 제품 → 새 개체 후보", f"정식 이름 제안: {new_name}"]
            if company:
                reasons.append(f"표현 안의 회사 단서 '{company[0]['surface']}'")
            return {"decision": "new", "uid": uid, "name": new_name, "score": 0.0,
                    "reasons": reasons, "alternatives": alts[:3]}
        if alts:
            s = alts[0]["score"] * (0.5 if is_code(surface) else 0.8)
            d = self.decide(s)
            note = "문자열 유사도만으로는 확정하지 않음" + (" (코드)" if is_code(surface) else "")
            return {"decision": "review" if d == "same" else d, "uid": alts[0]["uid"] if d != "nil" else None,
                    "name": alts[0]["name"], "score": round(s, 2), "reasons": [note], "alternatives": alts[:3]}
        return {"decision": "nil", "uid": None, "score": 0, "reasons": ["사전 · 마스터에 없음 (미연결)"],
                "alternatives": []}

    def _by_context(self, surface, refs, entries, ctx):
        scored = []
        for r in refs:
            words = sorted({w for e in entries if e["ref"] == r for w in e["context"]})
            hits = [w for w in words if w.casefold() in ctx.casefold()]
            scored.append((0.5 + 0.2 * len(hits), r, hits))
        scored.sort(key=lambda x: -x[0])
        top, second = scored[0], scored[1] if len(scored) > 1 else (0, None, [])
        score = min(0.95, top[0]) if top[0] > second[0] else 0.5
        reasons = [f"동음 후보 {len(refs)}개: " + ", ".join(self.name(r) for r in refs)]
        reasons.append(f"맥락 단어: {', '.join(top[2])}" if top[2] else "맥락 단어 없음")
        return {"decision": self.decide(score), "uid": top[1], "name": self.name(top[1]), "score": round(score, 2),
                "reasons": reasons,
                "alternatives": [{"uid": r, "name": self.name(r), "score": round(min(0.95, s), 2),
                                  "via": ", ".join(h) or "-"} for s, r, h in scored[1:]]}

    # CUSTOMIZE: domain-specific rule ("Micron's one" -> Micron's product). Remove or adapt for other domains.
    def _company_for_product(self, surface, company_refs, ctx):
        c = company_refs[0]
        prods = sorted(self.products_by_company.get(c, []))
        if len(prods) == 1:
            p = prods[0]
            return {"decision": "review", "uid": p, "name": self.name(p), "score": 0.65,
                    "reasons": [f"회사 이름('{surface}')으로 제품을 지칭", f"{self.name(c)}의 알려진 제품이 하나뿐"],
                    "alternatives": []}
        return {"decision": "review" if prods else "nil", "uid": prods[0] if prods else None,
                "name": self.name(prods[0]) if prods else None, "score": 0.5 if prods else 0,
                "reasons": [f"회사 이름으로 제품을 지칭 · 후보 {len(prods)}개"],
                "alternatives": [{"uid": p, "name": self.name(p), "score": 0.5} for p in prods[1:]]}


def run(input_id):
    cl = read_artifact(input_id, "clean")
    ex = read_artifact(input_id, "extract")
    R = Resolver(cl["chunks"])
    links = []

    def add(role, owner, surface, cls, chunk_id, new_name=None):
        r = R.resolve(surface, cls, chunk_id, new_name)
        r.update({"link_id": f"L{len(links) + 1:02d}", "role": role, "owner": owner, "surface": surface,
                  "class_hint": cls, "chunk_id": chunk_id})
        links.append(r)
        return r["link_id"]

    for f in ex["facts"]:
        f["subject_link"] = add("subject", f["fact_id"], f.get("subject"), f.get("subject_class"),
                                f.get("chunk_id"), f.get("new_entity_name"))
        if f.get("object"):
            f["object_link"] = add("object", f["fact_id"], f.get("object"), f.get("object_class"),
                                   f.get("chunk_id"), f.get("new_entity_name"))
    for k, o in enumerate(ex["out_of_ontology"], 1):
        o["oo_id"] = f"O{k:02d}"
        parts = [p for p in SPLIT_AND.split(o.get("subject") or "") if p]
        subjects = parts if len(parts) > 1 else [o.get("subject")]
        o["subject_links"] = [add("oo_subject", o["oo_id"], s, None, o.get("chunk_id")) for s in subjects]
        o["object_link"] = add("oo_object", o["oo_id"], o.get("object"), None, o.get("chunk_id"))
    for k, t in enumerate(ex["unknown_terms"], 1):
        t["term_id"] = f"T{k:02d}"
        t["link"] = add("term", t["term_id"], t.get("term"), t.get("guess_class"), t.get("chunk_id"))
    for k, q in enumerate(ex["unresolved_references"], 1):
        q["ref_id"] = f"Q{k:02d}"
        q["link"] = add("reference", q["ref_id"], q.get("text"), None, q.get("chunk_id"))
    mention_links = []
    for m in cl["mentions"]:
        r = R.resolve(m["surface"], None, m["chunk_id"])
        mention_links.append({"mention_id": m["mention_id"], "chunk_id": m["chunk_id"], "surface": m["surface"],
                              **{k: r[k] for k in ("decision", "uid", "score", "reasons")}})
    by = {}
    for l in links:
        by[l["decision"]] = by.get(l["decision"], 0) + 1
    return write_artifact(input_id, "resolve", {
        "step": "resolve", "input": input_id, "doc_id": cl["doc_id"], "thresholds": R.cfg,
        "links": links, "mention_links": mention_links, "facts": ex["facts"],
        "out_of_ontology": ex["out_of_ontology"], "unknown_terms": ex["unknown_terms"],
        "unresolved_references": ex["unresolved_references"], "stats": by})
