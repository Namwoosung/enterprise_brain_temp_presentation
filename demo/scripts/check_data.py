"""Check the demo data files without Neo4j or an LLM. Run this after editing anything in
data/, ontology/ or config/demo.yaml.

Usage:  python scripts/check_data.py

Checks (exit code 1 if any ERROR):
  ontology   classes / relations / property_facts are consistent
  entities   class exists, required + key fields present, uid unique, enum values valid,
             country / issued_by / targets point to an existing Country
  corpus     article ids unique, required fields, every fact uses known uids, a relation
             of the ontology with the right from/to classes, known props, valid enum values
  lexicon    every ref exists; the same alias on two refs must be marked ambiguous
  phonetic   map / after have the right shape
  inputs     files exist, front matter fields, STT line format and speaker labels
  cq         uid literals in the CQ Cypher exist
  recordings whether runs/recorded/<input>_extract.json still matches the current prompt
             (if not: re-record with LLM_MODE=live, see AGENTS.md)
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.common import (ROOT, config, ontology, entities, corpus, lexicon, phonetic,  # noqa: E402
                             split_front_matter, uid)

errors, warns, notes = [], [], []
STRUCTURAL = {"country": "HEADQUARTERED_IN", "issued_by": "ISSUED_BY", "targets": "TARGETS"}  # see graph.load_baseline


def err(where, msg):
    errors.append(f"{where}: {msg}")


def warn(where, msg):
    warns.append(f"{where}: {msg}")


def check_ontology():
    o = ontology()
    classes = o.get("classes") or {}
    for name, c in classes.items():
        for k in ("key", "required", "label_ko"):
            if k not in c:
                err("ontology", f"class {name}: '{k}' 가 없음")
        for k in c.get("key", []):
            if k not in c.get("required", []):
                err("ontology", f"class {name}: key '{k}'는 required에도 있어야 함")
    for name, r in (o.get("relations") or {}).items():
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*", name):
            err("ontology", f"relation {name}: 대문자 · 숫자 · 밑줄만")
        for side in ("from", "to"):
            v = r.get(side)
            if v != "*" and v not in classes:
                err("ontology", f"relation {name}: {side}={v} 클래스가 없음")
        for k in r.get("key", []):
            if k not in r.get("props", []):
                err("ontology", f"relation {name}: key '{k}'는 props에도 있어야 함")
    for name, pf in (o.get("property_facts") or {}).items():
        cls = classes.get(pf.get("class"))
        if not cls:
            err("ontology", f"property_fact {name}: class {pf.get('class')} 없음")
        elif pf.get("property") not in (cls.get("enums") or {}):
            err("ontology", f"property_fact {name}: {pf['class']}.enums에 {pf.get('property')} 가 없음")


def check_entities():
    o = ontology()
    classes = o["classes"]
    seen = {}
    for i, e in enumerate(entities()):
        where = f"entities[{i}] {e.get('name') or e.get('code')}"
        cls = e.get("class")
        if cls not in classes or cls in ("Document", "Chunk"):
            err(where, f"class '{cls}' 는 온톨로지에 없거나 마스터에 둘 수 없는 클래스")
            continue
        c = classes[cls]
        for k in c["required"]:
            if e.get(k) in (None, ""):
                err(where, f"필수 필드 '{k}' 가 없음")
        if "code" in e and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", str(e["code"])):
            err(where, f"code '{e['code']}': 영문 · 숫자 · - _ . 만 (uid에 들어감)")
        u = uid(cls, *[e.get(k) for k in c["key"]])
        if u in seen:
            err(where, f"uid {u} 가 중복 (entities[{seen[u]}]과 같음)")
        seen[u] = i
        for prop, allowed in (c.get("enums") or {}).items():
            if prop in e and e[prop] not in allowed:
                err(where, f"{prop}='{e[prop]}' 는 {allowed} 중 하나여야 함")
        for field in STRUCTURAL:
            if e.get(field) and uid("Country", e[field]) not in seen_all():
                err(where, f"{field}: Country '{e[field]}' 가 entities에 없음")
    return set(seen)


_ALL = None


def seen_all():
    global _ALL
    if _ALL is None:
        cls = ontology()["classes"]
        _ALL = {uid(e["class"], *[e.get(k) for k in cls[e["class"]]["key"]])
                for e in entities() if e.get("class") in cls}
    return _ALL


def check_corpus(uids):
    o = ontology()
    rels, pfs, classes = o["relations"], o["property_facts"], o["classes"]
    ids = set()
    for i, a in enumerate(corpus()):
        where = f"news_corpus {a.get('id') or f'[{i}]'}"
        for k in ("id", "date", "title", "summary", "url", "publisher", "facts"):
            if a.get(k) in (None, ""):
                err(where, f"필드 '{k}' 가 없음")
        if a.get("id") in ids:
            err(where, "id 중복")
        ids.add(a.get("id"))
        if "baseline" not in a:
            warn(where, "baseline: true/false 가 없음(false로 취급)")
        for j, f in enumerate(a.get("facts") or []):
            fw = f"{where} facts[{j}]"
            s, p = f.get("s"), f.get("p")
            if isinstance(s, dict) or isinstance(f.get("o"), dict) or "o_new" in f:
                # {s: {new: 이름}} / o_new: an entity that is not in the master yet
                if a.get("baseline"):
                    err(fw, "s: {new: ...} · o_new 는 baseline: false 기사에만 쓸 수 있음(기준 그래프에 노드를 만들 수 없음)")
                if p not in rels and p not in pfs:
                    warn(fw, f"관계 '{p}' 는 온톨로지에 없음(검증 대조용으로만 쓰임)")
                continue
            if s not in uids:
                err(fw, f"s='{s}' 가 entities에 없음")
            if p in pfs:
                enum = classes[pfs[p]["class"]]["enums"][pfs[p]["property"]]
                if f.get("value") not in enum:
                    err(fw, f"{p} value='{f.get('value')}' 는 {enum} 중 하나여야 함")
                if s and not str(s).startswith(pfs[p]["class"] + ":"):
                    err(fw, f"{p}의 s는 {pfs[p]['class']} 여야 함")
                continue
            if p not in rels:
                (warn if not a.get("baseline") else err)(
                    fw, f"관계 '{p}' 는 온톨로지에 없음" + ("(검증 대조용으로만 쓰임)" if not a.get("baseline") else
                                                     " — baseline 기사에는 온톨로지 관계만 쓸 수 있음"))
                continue
            r = rels[p]
            ob = f.get("o")
            if ob not in uids:
                err(fw, f"o='{ob}' 가 entities에 없음")
            for side, val in (("from", s), ("to", ob)):
                if r[side] != "*" and isinstance(val, str) and not val.startswith(r[side] + ":"):
                    err(fw, f"{p} 는 {r['from']} → {r['to']} 인데 {side} 쪽이 '{val}'")
            for k in (f.get("props") or {}):
                if k not in r.get("props", []):
                    err(fw, f"{p} 에 없는 속성 '{k}' (허용: {r.get('props', [])})")
            for k in r.get("key", []):
                if not (f.get("props") or {}).get(k):
                    err(fw, f"{p} 는 props.{k} 가 꼭 필요함(관계를 구분하는 키)")


def check_lexicon(uids):
    owners = {}
    for i, t in enumerate(lexicon().get("terms") or []):
        where = f"lexicon terms[{i}] {t.get('pref')}"
        if t.get("ref") not in uids:
            err(where, f"ref='{t.get('ref')}' 가 entities에 없음")
        for alias in [t.get("pref")] + list(t.get("alt") or []) + list(t.get("hidden") or []):
            if alias:
                owners.setdefault(str(alias), []).append((t.get("ref"), bool(t.get("ambiguous"))))
    for alias, refs in owners.items():
        distinct = {r for r, _ in refs}
        if len(distinct) > 1 and not any(amb for _, amb in refs):
            warn("lexicon", f"'{alias}' 가 여러 개체({sorted(distinct)})를 가리키는데 ambiguous: true 가 없음")


def check_phonetic():
    ph = phonetic() or {}
    if not isinstance(ph.get("map") or {}, dict):
        err("phonetic", "map 은 '발음: 표기' 사전이어야 함")
    after = ph.get("after") or []
    if not isinstance(after, list):
        err("phonetic", "after 는 목록이어야 함")


STT_LINE = re.compile(r"^\[(\d{2}):(\d{2}):(\d{2})\]\s*([^:]+):\s*(.+)$")


def check_inputs():
    cfg = config()
    doc_ids = set()
    for inp in cfg["inputs"]:
        where = f"input {inp.get('id')}"
        for k in ("id", "label", "file"):
            if not inp.get(k):
                err(where, f"config inputs의 '{k}' 가 없음")
        if not re.fullmatch(r"[a-z][a-z0-9_]*", str(inp.get("id"))):
            err(where, "id 는 소문자 · 숫자 · 밑줄만 (녹화 파일 이름에 쓰임)")
        p = ROOT / str(inp.get("file"))
        if not p.exists():
            err(where, f"파일 {inp.get('file')} 이 없음")
            continue
        meta, body = split_front_matter(p.read_text(encoding="utf-8"))
        if not meta:
            err(where, "맨 위에 --- 로 감싼 머리말(front matter)이 없음")
            continue
        for k in ("doc_id", "kind", "title", "date"):
            if not meta.get(k):
                err(where, f"머리말에 '{k}' 가 없음")
        if meta.get("doc_id") in doc_ids:
            err(where, f"doc_id {meta.get('doc_id')} 가 다른 입력과 같음")
        doc_ids.add(meta.get("doc_id"))
        kind = meta.get("kind")
        if kind not in ("mail", "meeting_stt"):
            err(where, f"kind '{kind}' 는 mail 또는 meeting_stt 여야 함")
        if kind == "meeting_stt":
            att = meta.get("attendees") or {}
            if not att:
                err(where, "meeting_stt 는 머리말에 attendees(화자 라벨 → 사람)가 필요함")
            for n, line in enumerate(body.splitlines(), 1):
                if not line.strip():
                    continue
                m = STT_LINE.match(line.strip())
                if not m:
                    err(where, f"본문 {n}행: '[hh:mm:ss] 화자N: 내용' 형식이 아님 → {line[:40]!r}")
                elif att and m.group(4).strip() not in att:
                    warn(where, f"본문 {n}행: 화자 '{m.group(4).strip()}' 가 attendees에 없음")
        if not body.strip():
            err(where, "본문이 비어 있음")


def check_cq(uids):
    for q in config().get("cq") or []:
        for u in re.findall(r"uid\s*:\s*'([^']+)'", q.get("cypher", "")):
            if u not in uids:
                err(f"cq {q.get('id')}", f"Cypher의 uid '{u}' 가 entities에 없음")


def check_recordings():
    """Rebuild the extraction prompt from the current data and compare with each recording."""
    from pipeline import collect, clean, extract, llm
    for inp in config()["inputs"]:
        name = f"{inp['id']}_extract"
        rec = llm.recording(name)
        try:
            collect.run(inp["id"])
            clean.run(inp["id"])
            _, _, messages = extract.build_messages(inp["id"])
        except Exception as e:  # noqa: BLE001
            err(f"input {inp['id']}", f"수집 · 정제 단계에서 오류: {e.__class__.__name__}: {e}")
            continue
        if rec is None:
            warn(f"recording {name}", "녹화본이 없음 → LLM_MODE=live 로 한 번 실행해 만들어야 재생 모드가 동작")
        elif rec.get("prompt_hash") != llm.hash_messages(messages):
            warn(f"recording {name}", "프롬프트가 녹화 때와 다름(데이터 · 사전 · 온톨로지 · 입력 변경) → "
                                      "LLM_MODE=live 로 다시 녹화해야 결과가 새 데이터를 반영")
        else:
            notes.append(f"recording {name}: 현재 프롬프트와 일치")


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    try:
        check_ontology()
        uids = check_entities()
        check_corpus(uids)
        check_lexicon(uids)
        check_phonetic()
        check_inputs()
        check_cq(uids)
        if not errors:
            check_recordings()
    except Exception as e:  # malformed YAML etc.
        err("load", f"{e.__class__.__name__}: {e}")
    print(f"entities {len(entities())} · articles {len(corpus())} · inputs {len(config()['inputs'])}")
    for n in notes:
        print("OK   ", n)
    for w in warns:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print("OK" if not errors else f"{len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
