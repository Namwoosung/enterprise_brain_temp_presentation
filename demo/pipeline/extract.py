"""Step 3 · 추출: candidate facts from the cleaned input.

Structured (CMMS export) : mapping rules from config `cmms_mapping` — deterministic, no LLM.
Documents (mail, STT)    : LLM, restricted to the ontology's predicates. Anything outside the
                           ontology is NOT dropped: it is returned as out_of_ontology / unknown_terms
                           so it can become an ontology change proposal.
All output is a *candidate*; nothing is trusted until validate.py checks it.
"""
import json

from .common import ontology, entities, config, read_artifact, write_artifact
from . import llm

PROMPT_VERSION = "extract-fab-v1"
MAPPER_VERSION = "cmms-mapper@0.3"


def schema_text():
    o = ontology()
    lines = ["관계(predicate) 목록 — 이 목록 밖의 관계는 facts에 넣지 말 것:"]
    for name, r in o["relations"].items():
        if r.get("fact"):
            props = f" · 속성: {', '.join(r['props'])}" if r.get("props") else ""
            lines.append(f"- {name}: {r['from']} → {r['to']} ({r['label_ko']}){props}")
    for name, pf in o["property_facts"].items():
        enum = o["classes"][pf["class"]]["enums"][pf["property"]]
        lines.append(f"- {name}: {pf['class']}의 {pf['property']} 값 설정 ({pf['label_ko']}) · value ∈ {enum}")
    lines.append("클래스: " + ", ".join(f"{k}({v['label_ko']})" for k, v in o["classes"].items()
                                     if k not in ("Document", "Chunk")))
    return "\n".join(lines)


def known_entities_text():
    # entities marked prompt: false stay in the graph / lexicon but are not listed here
    return "\n".join(f"- {e['name']} ({e['class']})" for e in entities() if e.get("prompt", True))


# CUSTOMIZE: rules 2-5 and 11-12 use domain examples (maintenance work, failure cause). Rewrite them for a new domain.
SYSTEM = """너는 반도체 팹 설비 정비 지식 그래프에 넣을 사실 후보를 뽑는 추출기다.
반드시 JSON 하나만 출력한다. 텍스트에 실제로 적힌 내용만 뽑고, 추측으로 보태지 않는다.

{schema}

이미 알려진 개체(이름 참고용):
{known}

출력 형식:
{{
  "facts": [{{"chunk_id": "...", "subject": "텍스트에 나온 표현 그대로", "subject_class": "...",
             "predicate": "목록의 관계 이름", "object": "텍스트에 나온 표현 또는 null", "object_class": "... 또는 null",
             "value": "속성 사실(WORK_STATUS 등)일 때만", "props": {{}}, "certainty": "confirmed | suspected",
             "evidence": "근거가 되는 원문 구절 (조각 텍스트에서 그대로 복사)",
             "new_entity_name": null}}],
  "out_of_ontology": [{{"chunk_id": "...", "subject": "...", "relation_phrase": "텍스트의 관계 표현",
                       "object": "...", "suggested_relation": "대문자_관계_이름", "evidence": "..."}}],
  "unknown_terms": [{{"chunk_id": "...", "term": "...", "guess_class": "...", "evidence": "..."}}],
  "unresolved_references": [{{"chunk_id": "...", "text": "...", "why": "무엇을 가리키는지 알 수 없는 이유"}}]
}}

규칙:
1. certainty: "추정", "예정", "아마", "~것 같다", "얘기가 있다", "확인은 못 했다" 같은 표현이 붙으면 suspected.
   실제로 일어난 일을 단정한 문장(완료했다, 떴다, 바꿨다)은 confirmed.
2. 방향을 지킨다: 관계 목록의 "A → B"에서 subject는 A 클래스, object는 B 클래스다.
   예) 정비 작업이 설비에서 이뤄짐: ON_EQUIPMENT subject=정비 작업, object=설비.
   예) 설비에서 알람이 뜸: RAISED_ALARM subject=설비, object=알람.
3. 정비 작업(교체 · 교정 · 점검)이 나오면 작업 번호가 없어도 MaintenanceWork를 subject로 쓴다.
   subject에는 그 작업을 가리키는 텍스트 표현을 적고(예: "P/T V-42 교체"), 같은 작업에 대한 사실은 모두 같은 subject 문자열을 쓴다.
   작업 상태는 WORK_STATUS로: 완료 = completed, 예정 = planned, 진행 중 = in_progress.
   그 작업의 대상 설비(ON_EQUIPMENT)와 사용 부품(USED_PART_TYPE)이 텍스트나 바로 앞뒤 조각에서 분명하면 함께 뽑는다.
4. 고장 원인: 원인을 "추정"한다고 말하면 SUSPECTED_CAUSE(certainty suspected)로 뽑는다.
   CONFIRMED_CAUSE는 원인이 확정됐다고 단정할 때만 쓴다. 추정을 확정으로 바꾸지 않는다.
5. 고장 모드 object는 "부품 + 열화/고착/누설" 같은 고장 표현 그대로 적는다(예: "PT-V42 열화").
6. subject/object에는 개체를 가리키는 표현만 텍스트 그대로 적는다(조사 · 수식어 제외, 정규화하지 말 것).
   예) "A동 17호기(EQ-017)" → "A동 17호기". "B동 17호기도" → "B동 17호기".
7. 텍스트가 직접 말하지 않은 관계는 만들지 않는다. 증상만 있고 원인을 말하지 않으면 원인 관계를 만들지 않는다.
8. 관계 목록에 없는 관계(예: 증상, PM 주기, 모니터링 계획)는 facts가 아니라 out_of_ontology에 넣고,
   suggested_relation에는 그 의미에 맞는 새 이름(예: HAS_SYMPTOM)을 적는다. 기존 관계 이름을 억지로 쓰지 않는다.
9. unknown_terms: 알려진 개체 목록에도 없고 관계 목록으로도 표현할 수 없는 설비 · 부품 · 공정 용어만 적는다.
   알려진 개체의 다른 표기(예: P/T V-42, A동 17호기)는 넣지 않는다.
10. "지난번처럼", "그 건", "저번 것"처럼 가리키는 대상을 이 문서만으로 알 수 없는 표현은 반드시 unresolved_references에 넣는다.
11. evidence는 반드시 해당 조각 텍스트의 연속된 일부여야 한다.
12. 추정 · 소문이라도 관계 목록으로 표현되는 주장이면 facts에서 빼지 말고 certainty=suspected로 넣는다.
    예) "C 설비도 같은 문제라는 얘기가 있다" + 원인이 문맥상 분명 → SUSPECTED_CAUSE, suspected.
13. new_entity_name은 항상 null로 둔다. 문서에서 새 정비 작업을 만들지 않는다(작업은 CMMS가 기준이다)."""


# ---------------------------------------------------------------- structured: mapping rules
# CUSTOMIZE: the column -> relation mapping lives in config/demo.yaml (cmms_mapping).
def run_cmms(input_id, cl):
    m = config()["cmms_mapping"]
    facts = []
    for c in cl["chunks"]:
        row, text = c["row"], c["text"]
        subj = row[m["subject"]["from"]]
        node_props = {k: row.get(k) for k in m["props"] if row.get(k)}

        def ev(s):  # evidence = the exact substring of this row's chunk text
            return s if s and s in text else subj

        for rule in m["facts"]:
            f = {"chunk_id": c["chunk_id"], "subject": subj, "subject_class": m["subject"]["class"],
                 "predicate": rule["p"], "certainty": "confirmed", "method": "rule",
                 "rule": f"cmms_mapping.{rule['p']}", "row_line": c["line"], "props": {},
                 "new_entity_name": subj, "node_props": node_props}
            if "value_from" in rule:
                f.update(object=None, object_class=None, value=row.get(rule["value_from"]),
                         evidence=ev(row.get(rule["value_from"])))
            else:
                obj = rule.get("join", " ").join(row.get(k, "") for k in rule["from"]).strip()
                f.update(object=obj, object_class=rule["object_class"], value=None, evidence=ev(obj))
            facts.append(f)
    for i, f in enumerate(facts, 1):
        f["fact_id"] = f"R{i:02d}"
    return write_artifact(input_id, "extract", {
        "step": "extract", "input": input_id, "doc_id": cl["doc_id"], "method": "rule",
        "prompt_version": MAPPER_VERSION,
        "llm": {"mode": "rule", "source": "rule", "model": MAPPER_VERSION, "seconds": 0},
        "mapping": m, "rule_mentions": len(cl["mentions"]), "facts": facts,
        "out_of_ontology": [], "unknown_terms": [], "unresolved_references": [],
    })


# ---------------------------------------------------------------- documents: LLM
def run(input_id):
    cl = read_artifact(input_id, "clean")
    if cl["kind"] == "cmms_csv":
        return run_cmms(input_id, cl)
    chunk_lines = []
    for c in cl["chunks"]:
        who = f" ({c['speaker']})" if c.get("speaker") else ""
        chunk_lines.append(f"[{c['chunk_id']}]{who} {c['text']}")
    meta = cl["meta"]
    user = (f"문서: {meta.get('title')} · 종류: {cl['kind']} · 작성일: {meta.get('date')}\n\n"
            + "\n".join(chunk_lines))
    messages = [{"role": "system", "content": SYSTEM.format(schema=schema_text(), known=known_entities_text())},
                {"role": "user", "content": user}]
    res = llm.chat(f"{input_id}_extract", messages, json_mode=True)
    try:
        out = json.loads(res["content"])
    except json.JSONDecodeError as e:
        raise RuntimeError(f"LLM did not return JSON: {e}") from e
    facts = out.get("facts", [])
    for i, f in enumerate(facts, 1):
        f["fact_id"] = f"F{i:02d}"
        f["method"] = "LLM"
        f["new_entity_name"] = None   # documents never create work orders (rule 13); CMMS is the source
    return write_artifact(input_id, "extract", {
        "step": "extract", "input": input_id, "doc_id": cl["doc_id"], "method": "llm",
        "prompt_version": PROMPT_VERSION,
        "llm": {k: res.get(k) for k in ("mode", "source", "model", "seconds", "usage", "prompt_hash",
                                        "recorded_at", "prompt_changed", "base_url")},
        "prompt": {"system": messages[0]["content"], "user": user},
        "rule_mentions": len(cl["mentions"]),
        "facts": facts,
        "out_of_ontology": out.get("out_of_ontology", []),
        "unknown_terms": out.get("unknown_terms", []),
        "unresolved_references": out.get("unresolved_references", []),
    })
