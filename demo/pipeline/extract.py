"""Step 3 · 추출: candidate facts from the cleaned text.

Rule part : known mentions were already found by the lexicon scan (clean step).
LLM part  : relations / status changes, restricted to the ontology's predicates.
            Anything outside the ontology is NOT dropped: it is returned as
            out_of_ontology / unknown_terms so it can become an ontology change proposal.
All output is a *candidate*; nothing is trusted until validate.py checks it.
"""
import json

from .common import ontology, entities, read_artifact, write_artifact
from . import llm

PROMPT_VERSION = "extract-v3"


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


# CUSTOMIZE: rules 2-4 and 11-12 use domain examples (supply, mass production). Rewrite them for a new domain.
SYSTEM = """너는 반도체·AI 뉴스 지식 그래프에 넣을 사실 후보를 뽑는 추출기다.
반드시 JSON 하나만 출력한다. 텍스트에 실제로 적힌 내용만 뽑고, 추측으로 보태지 않는다.

{schema}

이미 알려진 개체(이름 참고용):
{known}

출력 형식:
{{
  "facts": [{{"chunk_id": "...", "subject": "텍스트에 나온 표현 그대로", "subject_class": "...",
             "predicate": "목록의 관계 이름", "object": "텍스트에 나온 표현 또는 null", "object_class": "... 또는 null",
             "value": "PRODUCT_STATUS일 때만", "props": {{}}, "certainty": "confirmed | suspected",
             "evidence": "근거가 되는 원문 구절 (조각 텍스트에서 그대로 복사)",
             "new_entity_name": "주어나 목적어가 알려진 개체 목록에 없을 때 붙일 정식 이름, 아니면 null"}}],
  "out_of_ontology": [{{"chunk_id": "...", "subject": "...", "relation_phrase": "텍스트의 관계 표현",
                       "object": "...", "suggested_relation": "대문자_관계_이름", "evidence": "..."}}],
  "unknown_terms": [{{"chunk_id": "...", "term": "...", "guess_class": "...", "evidence": "..."}}],
  "unresolved_references": [{{"chunk_id": "...", "text": "...", "why": "무엇을 가리키는지 알 수 없는 이유"}}]
}}

규칙:
1. certainty: "아마", "~것 같다", "얘기가 돈다", "확인 안 됨", "확실하지 않다" 같은 표현이 붙으면 suspected. 기사·발표를 전한 문장은 confirmed.
2. 방향을 지킨다: 관계 목록의 "A → B"에서 subject는 A 클래스, object는 B 클래스다.
   예) 회사가 회사에 부품을 공급: SUPPLIES subject=공급하는 회사, object=받는 회사, props.item=품목.
   예) 제품 X에 부품 Y가 들어감: USES_COMPONENT subject=X(완제품), object=Y(부품).
3. subject/object에는 개체를 가리키는 표현만 텍스트 그대로 적는다(조사·수식어 제외, 정규화하지 말 것).
   예) "하이닉스 HBM3E는 양산" → 제품 subject="하이닉스 HBM3E". "하이닉스가 공급" → 회사 subject="하이닉스".
   "마이크론 것"처럼 제품을 회사 이름으로 가리키면 그 표현을 쓰고 class는 Product로 적는다.
4. 양산 시작 = PRODUCT_STATUS value mass_production. 샘플 공급 = sampling. 발표 = announced.
5. 알려진 개체 목록에 없는 제품이 사실의 주어·목적어면 new_entity_name에 "회사명 제품명 사양" 형식의 정식 이름을 적는다.
6. 텍스트가 직접 말하지 않은 관계는 만들지 않는다. "주력이다"처럼 공급 대상이 없으면 SUPPLIES를 만들지 않는다.
7. 관계 목록에 없는 관계(예: 협력, MOU, 공동 개발)는 facts가 아니라 out_of_ontology에 넣고,
   suggested_relation에는 그 의미에 맞는 새 이름(예: PARTNERS_WITH)을 적는다. 기존 관계 이름을 억지로 쓰지 않는다.
8. unknown_terms: 알려진 개체 목록에도 없고 관계 목록으로도 표현할 수 없는 기술·제품·부품 용어만 적는다.
   (예: 새 기술 용어, 처음 나온 제품군 이름). 알려진 개체의 다른 표기(예: 하이닉스)는 넣지 않는다.
9. "지난번처럼", "그 건", "저번 것"처럼 가리키는 대상을 이 문서만으로 알 수 없는 표현은 반드시 unresolved_references에 넣는다.
10. evidence는 반드시 해당 조각 텍스트의 연속된 일부여야 한다.
11. 추정·소문이라도 관계 목록으로 표현되는 주장이면 facts에서 빼지 말고 certainty=suspected로 넣는다.
    예) "삼성도 엔비디아 HBM3E 퀄 테스트를 통과했다는 얘기가 돈다" → 삼성 SUPPLIES 엔비디아 (item HBM3E), suspected.
    예) "삼성 12단은 아마 상반기에 양산했을 거예요" → 삼성 12단 PRODUCT_STATUS mass_production, suspected.
12. "A 것도 X에 들어간다"는 X가 완제품이다 → USES_COMPONENT subject="X", object="A 것"."""


def run(input_id):
    cl = read_artifact(input_id, "clean")
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
    return write_artifact(input_id, "extract", {
        "step": "extract", "input": input_id, "doc_id": cl["doc_id"], "prompt_version": PROMPT_VERSION,
        "llm": {k: res.get(k) for k in ("mode", "source", "model", "seconds", "usage", "prompt_hash",
                                        "recorded_at", "prompt_changed", "base_url")},
        "prompt": {"system": messages[0]["content"], "user": user},
        "rule_mentions": len(cl["mentions"]),
        "facts": facts,
        "out_of_ontology": out.get("out_of_ontology", []),
        "unknown_terms": out.get("unknown_terms", []),
        "unresolved_references": out.get("unresolved_references", []),
    })
