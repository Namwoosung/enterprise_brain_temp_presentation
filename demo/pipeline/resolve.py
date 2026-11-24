"""Step 4 · 연결 (entity resolution / linking): surface text -> entity uid.

Evidence used, strongest first:
  1. exact alias from the lexicon (pref / alt / hidden) or a master code / name
  2. context words around the mention, for ambiguous aliases ("EQ-017", "17호기" exist in both fabs)
  3. a maintenance work without a work-order number ("3/6 P/T V-42 교체") -> the CMMS work order on the
     same equipment + part + date; a date mismatch is never auto-accepted (review)
  4. fuzzy string similarity - never enough on its own for codes (EQ-071 vs EQ-017)
Two thresholds (config resolve.accept / resolve.review) give same / review / no match,
as in Fellegi-Sunter. A work order the graph does not know yet (from CMMS) becomes a "new" entity.
"""
import difflib
import re

from .common import config, entity_index, ontology, read_artifact, write_artifact, class_of, uid
from .clean import alias_index, scan_mentions, is_code
from . import official

STRIP_TAIL = re.compile(r"(\s*(것|쪽에서|쪽|측|도|은|는|이|가|을|를))+$")
STRIP_HEAD = re.compile(r"^(기존|그|이번|새)\s+")
SPLIT_AND = re.compile(r"\s*(?:랑|이랑|와|과|및|,)\s*")
WO_CODE = re.compile(r"WO-\d+")
DATE_METHODS = ("규칙 · 월/일 → 날짜", "규칙 · 요일 → 날짜", "규칙 · 상대 기간", "규칙 · 상대 날짜")


def _norm_tokens(name):
    return frozenset(t for t in re.split(r"[\s/·\-]+", name.casefold()) if t)


class Resolver:
    def __init__(self, chunks, norms=()):
        self.cfg = config()["resolve"]
        self.idx = alias_index()
        self.ents = entity_index()
        self.chunks = {c["chunk_id"]: c for c in chunks}
        self.order = [c["chunk_id"] for c in chunks]
        self.new = {}  # token set -> uid
        self.dates = {}
        for n in norms:   # normalized date expressions per chunk (from the clean step)
            if n["method"] in DATE_METHODS and re.match(r"^\d{4}-\d{2}(-\d{2})?$", str(n["result"])):
                self.dates.setdefault(n["chunk_id"], []).append((n["surface"], n["result"]))

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
        # 1. exact alias on the whole surface (or with particles stripped)
        for v in self._variants(surface):
            entries = self.idx.get(v.casefold())
            if not entries:
                continue
            refs = sorted({e["ref"] for e in entries})
            if cls_hint:
                same_cls = [r for r in refs if class_of(r) == cls_hint]
                if same_cls:
                    refs = same_cls
            if len(refs) == 1:
                tag = "정확한 별칭" if v == surface.strip() else f"정확한 별칭 ('{v}')"
                if entries[0]["kind"] == "master":
                    tag = "마스터 코드 · 이름 일치" if v == surface.strip() else f"마스터 코드 · 이름 일치 ('{v}')"
                return {"decision": "same", "uid": refs[0], "name": self.name(refs[0]), "score": 0.95,
                        "reasons": [tag], "alternatives": []}
            return self._by_context(surface, refs, entries, ctx)
        # 2. aliases inside a longer surface ("A동 17호기 PT-V42") - only when the class tells which one
        inner = [m for m in scan_mentions(surface, None, self.idx)]
        inner_same = [m for m in inner if not cls_hint or any(class_of(r) == cls_hint for r in m["refs"])]
        long_enough = inner_same and len(inner_same[0]["surface"]) >= len(surface) * 0.6
        if len(inner_same) == 1 and len(inner_same[0]["refs"]) == 1 and (cls_hint or long_enough) \
                and cls_hint != "MaintenanceWork":
            r = inner_same[0]["refs"][0]
            return {"decision": "same", "uid": r, "name": self.name(r), "score": 0.85,
                    "reasons": [f"표현 안의 별칭 '{inner_same[0]['surface']}'"
                                + (f" (클래스 {cls_hint} 일치)" if cls_hint else "")], "alternatives": []}
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
        # 4. a record the graph does not know yet (work order from CMMS)
        if new_name and cls_hint in ontology().get("new_entity_classes", []):
            nu = uid(cls_hint, new_name)
            return {"decision": "new", "uid": nu, "name": new_name, "score": 0.0,
                    "reasons": [f"그래프에 없는 {cls_hint} → 새 개체", "기준 시스템(CMMS) 행에서 온 키"],
                    "alternatives": alts[:3]}
        # another expression in the same chunk pointing at one of the candidates (e.g. its serial number)
        hint = None
        if alts and chunk_id in self.chunks:
            for m in scan_mentions(self.chunks[chunk_id]["text"], chunk_id, self.idx):
                if len(m["refs"]) == 1 and m["surface"].casefold() != surface.casefold()                         and any(a["uid"] == m["refs"][0] for a in alts):
                    hint = m
                    alts.sort(key=lambda a: a["uid"] != m["refs"][0])
                    break
        if alts:
            codey = is_code(surface) or bool(re.search(r"[A-Z]+-\d+", surface))
            s = alts[0]["score"] * (0.5 if is_code(surface) else 0.8)
            d = self.decide(s)
            note = "문자열 유사도만으로는 확정하지 않음" + (" (코드)" if codey else "")
            reasons = [note]
            if codey and d != "nil":
                reasons.append(f"'{surface}'는 마스터에 없는 코드 → 참조 무결성 위반 의심")
            if hint:
                reasons.append(f"같은 조각의 '{hint['surface']}'는 {alts[0]['name']}를 가리킴 — 그래도 자동으로 고치지 않음")
            return {"decision": "review" if d == "same" else d, "uid": alts[0]["uid"] if d != "nil" else None,
                    "name": alts[0]["name"], "score": round(s, 2), "reasons": reasons, "alternatives": alts[:3]}
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
        reasons.append(f"맥락 단어: {', '.join(top[2])}" if top[2] else "맥락 단어 없음 → 어느 쪽인지 모름")
        return {"decision": self.decide(score), "uid": top[1], "name": self.name(top[1]), "score": round(score, 2),
                "reasons": reasons,
                "alternatives": [{"uid": r, "name": self.name(r), "score": round(min(0.95, s), 2),
                                  "via": ", ".join(h) or "-"} for s, r, h in scored[1:]]}

    # CUSTOMIZE: domain rule - a work mentioned in a document is matched to the system of record (CMMS).
    def match_work(self, surface, chunk_id, equipment=None, part=None, status=None):
        if WO_CODE.search(surface or ""):
            return None   # has a work-order number: the normal alias path handles it
        dates = self.dates.get(chunk_id, [])
        cands = [w for w in official.works().values()
                 if (not equipment or w.get("equipment") == equipment) and (not part or w.get("part") == part)]
        base = [f"작업 번호 없는 정비 작업 → CMMS 작업과 대조 (설비 {self.name(equipment) if equipment else '?'}"
                f" · 부품 {self.name(part) if part else '?'})"]
        if not cands:
            return {"decision": "nil", "uid": None, "score": 0, "alternatives": [],
                    "reasons": base + ["CMMS에 맞는 작업 없음"]}
        scored = []
        for w in cands:
            # a planned work is compared with the CMMS start, a finished one with the completion
            wd = ((w.get("started_at") or "")[:10] or None) if status == "planned" else official.work_date(w)
            if not dates or not wd:
                scored.append((0.55, w, "날짜 정보 없음"))
                continue
            surf, d = dates[0]
            if len(d) == 7:   # month only ("지난달")
                ok = wd.startswith(d)
                scored.append((0.85 if ok else 0.3, w, f"'{surf}'={d} ↔ CMMS {wd}" + (" · 월 일치" if ok else " · 다름")))
            elif d == wd:
                which = "시작" if status == "planned" else "완료" if w.get("status") == "completed" else "예정"
                scored.append((0.9, w, f"'{surf}'={d} ↔ CMMS {which} {wd} · 같은 날"))
            else:
                started = (w.get("started_at") or "")[:10]
                note = f"'{surf}'={d} ↔ CMMS 완료 {w.get('completed_at') or '-'}"
                if started == d:
                    note += f" (시작은 {w.get('started_at')})"
                scored.append((0.6 if started == d else 0.35, w, note + " · 날짜 불일치"))
        scored.sort(key=lambda x: -x[0])
        s, w, why = scored[0]
        u = uid("MaintenanceWork", w["code"])
        d = self.decide(s)
        if d == "same" and "불일치" in why:
            d = "review"
        return {"decision": d, "uid": u if d != "nil" else None, "name": w["code"], "score": s,
                "reasons": base + [f"후보 {w['code']} ({w['source']}): {why}"],
                "alternatives": [{"uid": uid("MaintenanceWork", x["code"]), "name": x["code"], "score": round(sc, 2),
                                  "via": n} for sc, x, n in scored[1:3]], "official": w}


def run(input_id):
    cl = read_artifact(input_id, "clean")
    ex = read_artifact(input_id, "extract")
    R = Resolver(cl["chunks"], cl["normalizations"])
    links = []

    def add(role, owner, surface, cls, chunk_id, new_name=None, result=None):
        r = result or R.resolve(surface, cls, chunk_id, new_name)
        r.update({"link_id": f"L{len(links) + 1:02d}", "role": role, "owner": owner, "surface": surface,
                  "class_hint": cls, "chunk_id": chunk_id})
        links.append(r)
        return r["link_id"]

    by_id = {}
    # objects first: a work's equipment and part are needed to match the work itself
    for f in ex["facts"]:
        if f.get("object"):
            f["object_link"] = add("object", f["fact_id"], f.get("object"), f.get("object_class"),
                                   f.get("chunk_id"))
    by_id = {l["link_id"]: l for l in links}
    for f in ex["facts"]:
        result = None
        if f.get("subject_class") == "MaintenanceWork" and f.get("method") != "rule":
            sib = [x for x in ex["facts"] if x.get("subject") == f.get("subject")
                   and x.get("chunk_id") == f.get("chunk_id") and x.get("object_link")]
            eq = next((by_id[x["object_link"]]["uid"] for x in sib if x["predicate"] == "ON_EQUIPMENT"
                       and by_id[x["object_link"]]["decision"] in ("same",)), None)
            pt = next((by_id[x["object_link"]]["uid"] for x in sib if x["predicate"] == "USED_PART_TYPE"
                       and by_id[x["object_link"]]["decision"] in ("same",)), None)
            st = next((x.get("value") for x in ex["facts"] if x.get("subject") == f.get("subject")
                       and x.get("chunk_id") == f.get("chunk_id") and x["predicate"] == "WORK_STATUS"), None)
            result = R.match_work(f.get("subject"), f.get("chunk_id"), eq, pt, st)
        f["subject_link"] = add("subject", f["fact_id"], f.get("subject"), f.get("subject_class"),
                                f.get("chunk_id"), f.get("new_entity_name"), result)
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
