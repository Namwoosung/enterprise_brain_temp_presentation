# RDF · OWL · YAML · 속성 그래프 — 무엇이 어느 층인가

관련 질문: [qna_notes.md](../qna_notes.md) Q025 · Q037 (함께 보면 좋은 것: Q001 TBox/ABox, Q002 속성 그래프 안의 온톨로지, Q018 실제 데이터 연결).
덱 연결: 2a장(층 구분) · 2b장(다섯 방식 비교) · 2c장(우리 선택의 이유).

이 문서의 순서: 1 층 구분과 덱의 배치 → 2 일반적인 KG 구축 방식 다섯 가지 → 3 방식별 구현(같은 질문을 다섯 방식으로) → 4 이 발표가 이 조합을 고른 이유 → 5 자주 헷갈리는 질문.

헷갈리는 가장 큰 이유는 **서로 다른 종류의 것을 같은 줄에 놓고 비교하기 때문**입니다. 넷은 같은 층의 선택지가 아닙니다.

| 이름 | 무엇의 이름인가 | 한 줄 설명 |
|---|---|---|
| **RDF** | 데이터 모델 (W3C 표준) | 모든 것을 `주어 – 술어 – 목적어` 세 칸(트리플)으로 적는 방식. 이름은 전 세계에서 유일한 IRI(웹 주소 형태) |
| **OWL** (+ RDFS) | 온톨로지 언어 (W3C 표준) | RDF 위에서 "클래스 · 관계 · 그 성질"을 논리적으로 정의하는 어휘. 추론기가 이해함 |
| **SKOS** | 용어 체계 어휘 (W3C 표준) | 표준어 · 동의어 · 상위어를 적는 어휘. 용어 사전용 |
| **SHACL** | 검증 규칙 언어 (W3C 표준) | "이 노드는 이 속성이 꼭 1개 있어야 한다" 같은 모양 검사 |
| **속성 그래프** (LPG) | 데이터 모델 (표준 질의 언어 GQL은 있음, 온톨로지 표준은 없음) | 노드와 관계에 라벨과 속성(키-값)을 붙이는 방식. Neo4j 등 |
| **YAML** | 파일 문법 | 사람이 읽기 쉬운 설정 파일 형식일 뿐. 그 안에 무엇을 적느냐는 정해져 있지 않음 |
| Turtle · JSON-LD · RDF/XML | RDF를 파일로 적는 문법 | 같은 RDF를 다른 글자로 적은 것 |
| SPARQL / Cypher · GQL | 질의 언어 | SPARQL은 RDF용, Cypher · GQL은 속성 그래프용 |

정리하면:
- **데이터를 어떤 모양으로 담나** → RDF 또는 속성 그래프 (둘 중 선택)
- **개념과 관계의 정의를 무엇으로 적나** → OWL(표준, RDF 위) 또는 자체 스키마(YAML 등) 또는 DB 제약
- **그걸 어떤 파일로 쓰나** → Turtle · JSON-LD(RDF 계열), YAML · JSON(자체 형식)

---

## 1. 발표자료(이 덱)는 어떻게 나눠 놓았나

덱은 "정의는 한 곳에, 데이터는 조회하기 좋은 곳에, 표준 형식은 필요할 때 내보내기"로 층을 나눴습니다(9 · 17 · 17a · 20 · 23 · 30장).

| 층 | 덱에서 쓰는 것 | 담는 내용 | 덱의 위치 |
|---|---|---|---|
| ① 정의 (TBox, 기준) | **YAML 파일 + Git** (자체 형식) | 클래스 · 키 · 필수 속성 · 허용 값 · 관계 방향 · 개수 · 기준 시스템 · 추출 예시 · 검토 기준 | 9장 "정의: YAML (Git)", 17 · 17a장 |
| ① 정의 · 용어 | **용어 사전 YAML** (SKOS를 흉내 낸 구조) | 표준어 · 동의어 · 숨은 표기 · 맥락 단어 | 15장 concept, 데모 `lexicon.v1.yaml` |
| ② 생성물 | JSON Schema · Pydantic · DB 제약 · (선택) SHACL | 정의에서 기계적으로 만들어 낸 검사 장치 | 17 · 17a · 20장 |
| ③ 데이터 (ABox, 조회 사본) | **속성 그래프** (데모는 Neo4j) | 실제 개체와 관계, 근거 ID · 확실성 · 유효 기간 | 23 · 30장 |
| ④ 원본 · 원장 | 파일 · Parquet · (나중에) RDB | 원문, 수집 기록, 후보, 검토 이력 | 14 · 23장 |
| ⑤ 교환 (선택) | **RDF / OWL 내보내기** | 같은 정의 · 데이터를 표준 형식으로. 외부 표준 어휘와 연결할 때 | 23장 "RDF (필요 시)", 30장 |

그래서 덱에서:
- **YAML은 "온톨로지 언어"가 아니라 "정의를 적는 파일"**입니다. 내용은 온톨로지(무엇이 있고 어떻게 연결되나)지만 형식은 자체 형식입니다. OWL만큼의 논리 의미(추론)는 없습니다.
- **속성 그래프는 "데이터를 담는 곳"**입니다. 온톨로지는 그래프의 라벨 · 관계 타입 · 제약으로 "반영"될 뿐, 원본은 YAML입니다.
- **RDF · OWL은 "필요해지면 내보내는 형식"**입니다. 지금은 쓰지 않습니다.

### 같은 내용을 층마다 적어 보면
예: "정비 작업은 설비에서 수행된다", "WO-1042는 FAB-A의 EQ-017에서 수행됐다".

**① 정의 — 덱의 YAML (자체 형식)**
```yaml
classes:
  Equipment:
    key: [fab, code]                 # 같은 대상인지 판단하는 기준
    required: [serial]
    synonyms: [설비, 호기, 장비]
  MaintenanceWork:
    key: [wo_id]
    enums: {status: [planned, in_progress, completed]}
relations:
  ON_EQUIPMENT:
    from: MaintenanceWork
    to: Equipment
    cardinality: many_to_one         # 작업 하나 = 설비 하나
    official: CMMS                   # 값이 다르면 CMMS가 기준
```

**② 생성물 — LLM 출력용 JSON Schema (일부)**
```json
{"type": "object",
 "properties": {
   "predicate": {"enum": ["ON_EQUIPMENT", "USED_PART_TYPE"]},
   "subject_class": {"enum": ["MaintenanceWork"]},
   "certainty": {"enum": ["confirmed", "suspected"]}},
 "required": ["predicate", "subject", "evidence"]}
```

**② 생성물 — DB 제약 (Neo4j Cypher)**
```cypher
CREATE CONSTRAINT maintenancework_uid IF NOT EXISTS
FOR (n:MaintenanceWork) REQUIRE n.uid IS UNIQUE;
```

**③ 데이터 — 속성 그래프 (Cypher로 넣은 모습)**
```cypher
MERGE (w:MaintenanceWork {uid:'MaintenanceWork:WO-1042'})
  SET w.wo_id = 'WO-1042', w.status = 'completed'
MERGE (e:Equipment {uid:'Equipment:FAB-A/EQ-017'})
  SET e.fab = 'FAB-A', e.code = 'EQ-017', e.serial = 'SN-A017'
MERGE (w)-[r:ON_EQUIPMENT]->(e)
  SET r.sources = ['CMMS-WO#R04'], r.certainty = 'confirmed'   // 관계에도 속성을 바로 붙임
```

**⑤ 교환 — 같은 정의를 OWL로 (Turtle 문법)**
```turtle
@prefix :     <https://example.com/fab#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

:Equipment        a owl:Class ;  rdfs:label "설비"@ko .
:MaintenanceWork  a owl:Class ;  rdfs:label "정비 작업"@ko .
:onEquipment      a owl:ObjectProperty , owl:FunctionalProperty ;   # 작업 하나에 설비 하나
                  rdfs:domain :MaintenanceWork ;
                  rdfs:range  :Equipment .
:Equipment skos:altLabel "호기"@ko , "장비"@ko .                   # 동의어는 SKOS 어휘로
```

**⑤ 교환 — 같은 데이터를 RDF로 (Turtle)**
```turtle
:WO-1042  a :MaintenanceWork ;  :status "completed" ;  :onEquipment :FAB-A_EQ-017 .
:FAB-A_EQ-017  a :Equipment ;  :fab "FAB-A" ;  :code "EQ-017" ;  :serial "SN-A017" .
```
- RDF에서는 관계(`:onEquipment`)에 속성을 바로 붙일 수 없습니다. 출처를 붙이려면 사실 노드를 따로 만들거나(reification), RDF-star(`<< :WO-1042 :onEquipment :FAB-A_EQ-017 >> :source "CMMS"`, RDF 1.2에서 표준화 진행), named graph를 씁니다. 속성 그래프는 관계 속성으로 바로 됩니다. 이 차이가 덱 23장의 "근거를 어디에 둘까" 논의와 연결됩니다.

**② 생성물(선택) — SHACL로 적은 검사 규칙**
```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
:MaintenanceWorkShape a sh:NodeShape ;
  sh:targetClass :MaintenanceWork ;
  sh:property [ sh:path :onEquipment ; sh:class :Equipment ; sh:minCount 1 ; sh:maxCount 1 ] ;
  sh:property [ sh:path :status ; sh:in ("planned" "in_progress" "completed") ] .
```
- OWL의 `FunctionalProperty`는 "설비가 없으면 오류"를 잡지 않습니다(개방 세계: 모르는 것일 뿐). 없으면 오류로 잡는 건 SHACL이나 코드의 일입니다(폐쇄 세계). 덱 20장 concept의 내용입니다.

---

## 2. 일반적인 KG 구축은 어떻게 하나

**완전히 지배적인 하나의 방법은 없습니다.** 실무와 연구에서 주로 쓰이는 흐름은 다섯 가지 정도이고, 실제 프로젝트는 대개 둘 이상을 섞습니다.

### A. 시맨틱 웹(RDF · OWL) 방식 — "표준과 추론"
- **구성**: 온톨로지를 OWL로 작성(Protégé 등) → 데이터를 RDF로 변환해 트리플 저장소에 적재 → SPARQL로 질의 → SHACL로 검증 → 필요하면 추론기로 새 사실 도출.
- **정형 데이터 변환**: RDB는 R2RML 매핑으로 RDF로 바꾸거나 가상화(D 방식).
- **도구 예**: Protégé, GraphDB(Ontotext), Stardog, Apache Jena, Amazon Neptune(RDF 모드).
- **대표 사례**: Wikidata(자체 모델이지만 RDF로 내보내고 SPARQL 질의 제공), DBpedia, 의료(SNOMED CT, 유전자 온톨로지 GO), 금융 표준 온톨로지 FIBO, 제약 · 생명과학 기업의 데이터 통합.
- **특징**:
  - 장점: 국제 표준, 외부 온톨로지와 바로 연결(IRI), 추론 · 일관성 검사, 오래 쓸 지식 체계에 강함.
  - 단점: 배우기 어렵고(OWL 논리, SPARQL), 관계에 속성을 붙이기 번거롭고, 개발 도구 생태계가 속성 그래프보다 좁음.

### B. 속성 그래프(LPG) 방식 — "개발 속도와 탐색"
- **구성**: 라벨 · 관계 타입 · 속성으로 데이터 모델을 설계(화이트보드 → 코드) → ETL로 적재 → Cypher · GQL로 질의. 스키마는 DB 제약 + 애플리케이션 코드에 들어 있음.
- **도구 예**: Neo4j, Memgraph, TigerGraph, Amazon Neptune(openCypher/Gremlin 모드).
- **대표 사례**: 사기 탐지, 추천, 네트워크 · IT 자산 관리, 공급망 추적, 최근에는 GraphRAG의 지식 저장소.
- **특징**:
  - 장점: 직관적, 관계 속성이 자연스러움, 여러 단계 탐색이 빠름, 개발자 도구가 풍부.
  - 단점: 온톨로지 표준이 없음(이 진영에선 보통 "스키마"라고 부름), 추론 기능 없음, 외부 표준과 연결하려면 변환 필요. ISO GQL(2024)이 질의 언어 표준을 만들었지만 의미 정의 표준은 아님.

### C. 혼합 방식 — "정의는 표준 또는 별도 파일, 데이터는 속성 그래프" (이 덱의 방식)
- **구성**: 정의를 OWL 또는 LinkML · YAML로 따로 관리 → 그 정의에서 DB 제약 · 검증 코드 · 추출 스키마를 생성 → 데이터는 속성 그래프에 → 필요하면 RDF로 내보내기.
- **도구 예**: LinkML(YAML 스키마 → OWL · SHACL · JSON Schema · SQL 생성), Neo4j n10s(OWL을 Neo4j로 가져오기), Neptune(두 모델 모두 지원).
- **특징**: 개발 속도는 속성 그래프, 정의의 엄밀함 · 이식성은 별도 파일로. 단점은 정의와 데이터가 두 곳이라 생성 · 동기화 장치(CI)가 필요하다는 것.

### D. 가상 KG · OBDA — "데이터는 그대로 두고 의미 층만"
- **구성**: 온톨로지 + "온톨로지 개념 ↔ 기존 테이블 · 컬럼" 매핑을 정의 → 질의가 오면 SQL로 바꿔 원래 DB에서 바로 조회. 데이터를 복사하지 않음.
- **도구 예**: Ontop(R2RML 매핑, SPARQL → SQL), 시맨틱 레이어(dbt Semantic Layer 등), NVIDIA Auto Ontology(개념 · 매핑을 자동 초안 + text-to-SQL, 우리 study/auto_ontology.md 참고).
- **대표 사례**: 이미 잘 정리된 RDB가 여러 개인 기업 데이터 통합, 규제 보고.
- **특징**: 데이터 중복 · 동기화 문제가 없음, 대용량 정형 데이터에 적합. 대신 문서 같은 비정형은 다루기 어렵고, 원천 DB 성능에 좌우됨. Q018의 "그래프엔 뼈대, 세부 값은 원천" 이야기의 표준적인 형태.

### E. LLM 추출 중심(GraphRAG 계열) — "문서에서 빠르게"
- **구성**: 문서를 조각내고 LLM이 개체 · 관계를 뽑아 그래프로 만들고(스키마 없이 또는 가벼운 스키마로), 커뮤니티 요약 · 벡터 검색과 함께 질의응답에 씀.
- **도구 예**: Microsoft GraphRAG, Neo4j LLM Graph Builder · GraphRAG Python(SimpleKGPipeline), LightRAG.
- **특징**: 시작이 매우 빠르고 비정형 문서에 강함. 대신 같은 대상이 여러 이름으로 쪼개지고, 실행마다 스키마가 흔들리고, 정확성 보장이 약함. 그래서 "검색 보조용 그래프"로는 좋지만 "업무 기준 데이터"로 쓰려면 스키마 고정 · ER · 검증이 필요 — 덱 17 · 20 · 21장이 이 보완을 다룸.

### (참고) 상용 플랫폼의 "온톨로지"
- **Palantir Foundry Ontology**: 객체 타입 · 속성 · 링크 타입 · 행동(Action)을 정의하고, 각 객체를 실제 데이터셋에 연결하는 의미 층. RDF · OWL과는 다른 자체 모델이며, 개념상 D(데이터 위의 의미 층)에 가깝고 업무 행동까지 포함한다는 점이 특징.
- 이처럼 업계에서 "온톨로지"라는 말은 OWL 같은 형식 온톨로지만이 아니라 **"업무 개념과 관계의 정의 층" 전반**을 가리키는 경우가 많습니다.

### 한눈에 비교
| 방식 | 정의(온톨로지)는 어디에 | 데이터는 어디에 | 질의 | 잘 맞는 경우 |
|---|---|---|---|---|
| A 시맨틱 웹 | OWL 파일 | RDF 트리플 저장소 | SPARQL | 표준 연계 · 추론 · 장기 지식 체계 |
| B 속성 그래프 | DB 제약 + 코드 | 속성 그래프 DB | Cypher · GQL | 빠른 개발 · 관계 탐색 서비스 |
| C 혼합 | OWL 또는 LinkML · YAML (Git) | 속성 그래프 DB (+ RDF 내보내기) | Cypher (+ SPARQL) | 개발 속도와 정의 관리를 둘 다 |
| D 가상 KG | 온톨로지 + 매핑 | 기존 RDB 그대로 | SPARQL · SQL · text-to-SQL | 정리된 정형 DB가 많을 때 |
| E LLM 추출 | 없음 또는 가벼운 스키마 | 그래프 DB + 벡터 | 검색 + LLM | 문서 질의응답을 빨리 시작할 때 |

**이 덱은 C를 기본으로, 정형 원천은 D처럼 "참조"로 잇고(Q018), 문서는 E의 추출을 스키마 · 검증으로 묶는 구성**입니다.

---

## 3. 방식별 구현 — 같은 질문을 다섯 방식으로

질문 하나를 정해 두고 방식마다 "무엇을 만들고, 어떻게 넣고, 어떻게 묻는지"를 봅니다.
**질문**: "FAB-A의 EQ-017에서 수행된 정비 작업은?" (덱 2b장 표의 구현 열을 풀어 쓴 것)

### A. 시맨틱 웹 — OWL 정의 + RDF 저장소 + SPARQL
**구현 순서**
1. Protégé 등으로 OWL 파일 작성(1장의 ⑤ 교환 예시와 같은 모양). IRI 규칙(`https://example.com/fab#…`)을 먼저 정한다.
2. 원천 데이터를 RDF로 변환. RDB는 R2RML 매핑(아래 D와 같은 매핑을 "실체화" 모드로 실행), 문서는 추출 결과를 트리플로 변환.
3. 트리플 저장소(GraphDB · Jena Fuseki · Stardog 등)에 적재, 필요하면 추론기(RDFS · OWL RL)를 켠다.
4. SHACL로 모양 검사(1장 ② 예시). 위반 보고서를 CI에서 본다.
5. SPARQL로 질의.
```sparql
PREFIX : <https://example.com/fab#>
SELECT ?wo ?status WHERE {
  ?wo a :MaintenanceWork ;
      :onEquipment :FAB-A_EQ-017 ;
      :status ?status .
}
```
**특징**
- 추론기를 켜면 `:PreventiveWork rdfs:subClassOf :MaintenanceWork`만 적어 두어도 예방 정비 작업이 위 질의에 함께 나온다. 이 "적지 않은 사실의 도출"이 A만의 강점.
- 관계에 출처를 붙이려면 RDF-star나 named graph가 필요하다(`GRAPH <run/2026-11-24> { … }`).

**잘 맞음 / 어려움**: 외부 표준 어휘(FIBO · SNOMED · QUDT 단위) 연결, 기관 간 교환이 필수일 때 잘 맞는다. 팀이 OWL 논리와 SPARQL을 새로 배워야 하고, 개방 세계 가정 때문에 "값 없음 = 오류" 검사는 따로(SHACL) 해야 한다.

### B. 속성 그래프 — DB 스키마가 곧 정의
**구현 순서**
1. 화이트보드에서 라벨 · 관계 타입 · 속성을 그린다.
2. 제약을 DB에 직접 만든다.
3. ETL 코드(Python 등)로 MERGE 적재. 허용 값 · 필수 속성 같은 규칙은 적재 코드 안에 쓴다.
4. Cypher(또는 ISO GQL)로 질의.
```cypher
CREATE CONSTRAINT eq_key IF NOT EXISTS FOR (e:Equipment) REQUIRE (e.fab, e.code) IS NODE KEY;  // Enterprise 기능
MATCH (w:MaintenanceWork)-[r:ON_EQUIPMENT]->(:Equipment {fab:'FAB-A', code:'EQ-017'})
RETURN w.wo_id, w.status, r.sources;
```
**특징**
- 관계 속성(`r.sources`, `r.valid_from`)이 자연스럽다. 여러 단계 탐색이 빠르다.
- 정의가 "DB 제약 + 적재 코드 + 프롬프트"에 흩어진다. 정의를 바꾸면 세 곳을 따로 고쳐야 하고, 무엇이 바뀌었는지 한눈에 보기 어렵다.
- 노드 키 · 존재 제약은 DB 제품 · 에디션마다 다르다(Neo4j Community는 고유 제약 위주).

**잘 맞음 / 어려움**: 개발 팀이 작고 정의가 거의 안 바뀌는 서비스(추천 · 사기 탐지)에 잘 맞는다. 정의를 여러 사람이 검토하며 자주 바꾸는 업무 KG에서는 정의가 흩어지는 문제가 커진다.

### C. 혼합 — 정의 파일 하나에서 나머지를 생성 (이 발표의 기본)
**구현 순서**
1. 정의 파일(YAML)을 Git에 둔다. 덱 17a장의 다섯 블록: 클래스 · 관계 · 추출 예시 · 검토 기준 · 정의 밖 처리.
2. 생성기가 정의에서 ① LLM 출력 JSON Schema ② 검증 코드의 규칙표 ③ DB 제약 ④ (선택) SHACL · OWL을 만든다.
3. CI에서 "정의 ↔ 생성물"이 맞는지, 기존 데이터가 새 정의를 통과하는지 검사한다.
4. 데이터는 속성 그래프에 적재하고 Cypher로 질의(B와 같음).

공개 도구로 하면 LinkML이 대표적이다.
```yaml
# fab.linkml.yaml
id: https://example.com/fab
name: fab
prefixes: {linkml: https://w3id.org/linkml/}
imports: [linkml:types]
default_range: string
classes:
  Equipment:
    attributes:
      uid: {identifier: true}
      fab: {required: true}
      code: {required: true}
  MaintenanceWork:
    attributes:
      wo_id: {identifier: true}
      status: {range: WorkStatus}
      on_equipment: {range: Equipment, required: true}
enums:
  WorkStatus:
    permissible_values: {planned: {}, in_progress: {}, completed: {}}
```
```bash
gen-json-schema fab.linkml.yaml > fab.schema.json   # LLM 출력 스키마
gen-pydantic    fab.linkml.yaml > fab_models.py      # 검증 코드
gen-shacl       fab.linkml.yaml > fab.shacl.ttl      # (선택) 표준 검사 규칙
gen-owl         fab.linkml.yaml > fab.owl.ttl        # (선택) 표준 교환
```
데모(`demo/ontology/ontology.v1.yaml`)는 LinkML 대신 더 단순한 자체 YAML을 쓰고, 생성은 코드가 직접 한다(`pipeline/extract.py`의 `schema_text` · `scripts/reset.py`의 제약 생성 · `pipeline/validate.py`).

**특징**
- 정의 변경이 PR 하나의 diff로 보인다. 전문가 검토 · 되돌리기 · 버전 태그가 Git으로 된다.
- 같은 정의에서 OWL · SHACL을 만들 수 있어 A로 가는 길이 열려 있다.
- 대가: 생성기와 CI를 만들어야 한다. 생성물을 손으로 고치면 동기화가 깨진다(생성물은 커밋하지 않거나 "직접 수정 금지"를 검사).

### D. 가상 KG — 원천 DB 위에 매핑만
**구현 순서**
1. 온톨로지(OWL 또는 간단한 개념 목록)를 정한다.
2. "개념 ↔ 테이블 · 컬럼" 매핑을 쓴다(R2RML 또는 Ontop 매핑 문법).
3. 가상화 엔진(Ontop 등)이 SPARQL 질의를 받아 SQL로 바꿔 원천 DB에서 실행한다.
```turtle
@prefix rr: <http://www.w3.org/ns/r2rml#> .
@prefix :   <https://example.com/fab#> .
<#WorkMap> a rr:TriplesMap ;
  rr:logicalTable [ rr:tableName "cmms_work_order" ] ;
  rr:subjectMap [ rr:template "https://example.com/fab/wo/{wo_id}" ; rr:class :MaintenanceWork ] ;
  rr:predicateObjectMap [
    rr:predicate :onEquipment ;
    rr:objectMap [ rr:template "https://example.com/fab/eq/{fab}_{eqp_code}" ] ] .
```
이 발표에서는 같은 생각을 가볍게 쓴다. 그래프에 `Dataset` 노드를 두고 "어느 시스템 · 테이블 · 어떤 질의"만 적는다(23b장).
```cypher
(:Equipment {fab:'FAB-A', code:'EQ-017'})-[:HAS_DATA]->
(:Dataset {system:'MES', table:'eqp_state_hist', query:'SELECT ... WHERE eqp_id = $code'})
```
**특징**: 데이터 복사 · 동기화가 없고 항상 최신이다. 대신 원천 DB의 성능과 스키마 변경에 그대로 영향을 받고, 문서 · 메일처럼 테이블이 아닌 자료는 다루지 못한다.

### E. LLM 추출 — 문서에서 바로 그래프
**구현 순서**
1. 문서를 조각낸다(청킹).
2. LLM이 조각마다 개체 · 관계를 뽑는다. 스키마 없이 하거나, 라벨 목록만 준다.
3. 그래프 DB에 적재하고 조각 벡터 인덱스를 함께 만든다.
4. 질의는 벡터 검색 + 그래프 이웃 + LLM 답변.
```python
# Neo4j GraphRAG Python (인자 이름은 버전마다 조금 다름)
from neo4j_graphrag.experimental.pipeline.kg_builder import SimpleKGPipeline
kg = SimpleKGPipeline(llm=llm, driver=driver, embedder=embedder,
                      entities=["Equipment", "MaintenanceWork", "Part"],
                      relations=["ON_EQUIPMENT", "USED_PART"],
                      from_pdf=False)
await kg.run_async(text=report_text)
```
```bash
# Microsoft GraphRAG: 폴더 하나를 색인하고 질의
graphrag init  --root ./proj
graphrag index --root ./proj
graphrag query --root ./proj --method local --query "EQ-017 정비 이력"
```
**특징**: 반나절이면 문서 질의응답이 돌아간다. 하지만 "EQ-017", "17호기", "EQ17"이 다른 노드가 되고, 실행마다 관계 이름이 흔들리고, 원문에 없는 관계가 섞인다. 업무 기준 데이터로 쓰려면 C처럼 스키마를 고정하고 정제(ER) · 검증을 붙여야 한다. 덱 17~22장이 이 보완 과정이다.

### 다섯 방식 요약
| | A 시맨틱 웹 | B 속성 그래프 | C 혼합 | D 가상 KG | E LLM 추출 |
|---|---|---|---|---|---|
| 정의를 두는 곳 | OWL 파일 | DB 제약 + 코드 | YAML · LinkML (Git) | 온톨로지 + 매핑 | 프롬프트 · 라벨 목록 |
| 데이터 복사 | 함 (RDF로 변환) | 함 | 함 (조회 사본) | 안 함 | 함 |
| 관계에 근거 · 기간 | RDF-star · named graph | 관계 속성 | 관계 속성 | 원천 컬럼 | 관계 속성(형식 없음) |
| 추론 | 있음 | 없음 | 없음 (OWL 내보내면 가능) | 질의 재작성 수준 | 없음 |
| 문서 처리 | 별도 추출 필요 | 별도 추출 필요 | 고정 스키마 추출 | 못함 | 강함 |
| 배우는 비용 | 높음 | 낮음 | 중간 (생성기 · CI) | 중간 | 낮음 |
| 정의 변경 검토 | OWL diff (읽기 어려움) | 코드 여러 곳 | PR 하나 | 매핑 diff | 거의 불가 |

---

## 4. 이 발표가 이 조합을 고른 이유

### 4.1 우리 조건
덱 2c장의 표를 글로 풀면 이렇습니다.

| # | 우리 조건 | 왜 중요한가 | 가장 잘 맞는 방식 |
|---|---|---|---|
| 1 | agent · 사람이 관계를 따라가며 조회 | KG의 소비자가 agent(발표 3). "이 설비 → 최근 작업 → 쓴 부품 → 같은 부품을 쓴 다른 설비" 같은 탐색 | B · C · E |
| 2 | 관계마다 근거 · 확실성 · 기간 | "추정"을 "확정"으로 바꾸지 않기(18장), 근거 없는 사실은 쓰지 않기(23장) | B · C (관계 속성) |
| 3 | 자료 절반 이상이 문서 · 메일 · 회의록 | 정형 DB만 보면 현장 판단 · 원인 · 조치가 빠짐(2 · 6장) | C · E |
| 4 | 정의가 자주 바뀌고 전문가가 검토 | 처음부터 다 알 수 없음. 업무 질문으로 시작해 넓힘(28장) | C (PR diff) |
| 5 | 팀 · 오픈웨이트 agent가 바로 고칠 수 있음 | 담당자가 바뀌어도 유지. 저장소 안내만 읽고 GLM · Qwen 같은 모델이 수정 가능해야 함 | B · C · E |
| 6 | 측정값 · 이력 같은 대량 값은 복사 안 함 | 복사하면 동기화 · 용량 · 권한 문제가 커짐(23b장) | D |
| 7 | 틀린 사실이 업무 기준에 들어가면 안 됨 | 정비 판단에 쓰임. 확신 없는 건 사람에게(22장) | A · C · D |

### 4.2 결론: C를 기본으로 D · E를 붙인다
- **정의 = YAML + Git (C)**: 조건 4 · 5 · 7. 한 파일이 LLM 출력 스키마 · 검증 규칙 · DB 제약의 출처가 되므로, 정의를 바꾸면 세 곳이 함께 바뀐다.
- **데이터 = 속성 그래프 (B의 저장 방식)**: 조건 1 · 2. 관계에 `sources`, `certainty`, `valid_from` · `valid_to`를 바로 붙인다.
- **대량 값 = 원천 참조 (D의 생각)**: 조건 6. 그래프에는 `Dataset` 노드로 "어디서 어떻게"만 둔다. 완전한 OBDA 엔진은 아직 두지 않는다.
- **문서 = 고정 스키마 LLM 추출 (E를 C로 묶음)**: 조건 3 · 7. 정의에서 만든 JSON Schema로만 출력하게 하고(구조화 출력, Q027), ER · 검증을 통과한 것만 적재한다.

### 4.3 포기한 것과 그 대가를 줄이는 방법
| 포기한 것 | 그래서 생기는 일 | 대비 |
|---|---|---|
| OWL 표준 추론 | "예방 정비도 정비 작업이다" 같은 계층 추론을 DB가 해 주지 않음 | 정의 YAML에 `parent:`를 두고 적재 때 라벨을 함께 붙임(`:PreventiveWork:MaintenanceWork`), 또는 질의에서 처리 |
| 전역 IRI · 외부 어휘 연결 | 다른 조직 KG와 바로 합치기 어려움 | 클래스 · 관계에 `exact_match: <표준 IRI>` 필드를 남겨 두고, 필요할 때 RDF 내보내기 |
| 표준 검증 언어(SHACL)의 기본 사용 | 검사 규칙이 우리 코드에 있음 | 정의에서 SHACL도 생성할 수 있게 생성기를 열어 둠(LinkML로 바꾸면 바로 됨) |
| 완전한 가상 KG | 대량 값을 그래프 질의 한 번으로 못 가져옴 | agent가 "그래프로 대상 → Dataset의 조회 방법으로 값" 두 단계로 조회(23b장) |

### 4.4 다시 고를 조건
- 외부 기관과 표준 어휘로 데이터를 주고받는 것이 필수가 된다 → A 쪽(정의를 OWL로 내보내고 RDF 저장소 추가).
- 분류 추론(하위 클래스 자동 분류, 규칙 기반 새 사실)이 업무의 핵심이 된다 → A 쪽 또는 규칙 엔진 추가.
- 문서가 줄고 정리된 정형 DB만 남는다 → D 중심(Ontop · 시맨틱 레이어 · Auto Ontology).
- 정의가 거의 바뀌지 않고 서비스 하나만 쓴다 → B로 단순화해도 된다.

구현 상세(정의 파일 → 생성기 → 각 단계 코드 → 운영)는 [pipeline_build_guide.md](pipeline_build_guide.md)에 정리했습니다.

---

## 5. 자주 헷갈리는 질문
- **"RDF와 OWL은 같은 건가?"** 아닙니다. RDF는 데이터를 적는 모양(트리플), OWL은 그 RDF로 적는 "개념 정의용 단어 모음 + 논리"입니다. OWL 파일도 결국 RDF 트리플입니다.
- **"YAML로 쓰면 온톨로지가 아닌가?"** 내용이 개념 · 관계 · 제약의 정의라면 넓은 의미의 온톨로지(스키마)입니다. 다만 OWL처럼 표준 의미 · 추론이 있는 "형식 온톨로지"는 아닙니다. 둘을 잇고 싶으면 LinkML처럼 YAML에서 OWL을 생성하는 방법이 있습니다.
- **"Neo4j에 온톨로지를 넣을 수 있나?"** 라벨 · 관계 타입 · 제약으로 반영하거나, n10s로 OWL을 메타 노드(`:Class`)로 가져올 수 있습니다. 하지만 원본 정의를 Neo4j에 두는 것은 주류가 아닙니다(Q002).
- **"속성 그래프를 쓰면 나중에 RDF로 못 바꾸나?"** 바꿀 수 있습니다. 정의가 별도 파일에 있으면 같은 정의에서 OWL · SHACL을 만들고, 데이터는 내보내기 스크립트나 n10s로 RDF로 변환합니다. 관계 속성은 RDF-star나 사실 노드로 옮깁니다.
- **"SKOS와 OWL의 차이는?"** SKOS는 "이 말은 저 말의 동의어 · 상위어" 같은 **용어** 관계, OWL은 "이 클래스의 모든 개체는 …" 같은 **개념의 논리** 관계입니다. 덱의 용어 사전은 SKOS 쪽, 정의 YAML은 OWL 쪽 역할입니다.

## 출처
- W3C, *RDF 1.1 Concepts and Abstract Syntax* (2014) · RDF 1.2 작업 문서(RDF-star 포함)
- W3C, *OWL 2 Web Ontology Language Primer* (2012)
- W3C, *SKOS Simple Knowledge Organization System Reference* (2009)
- W3C, *Shapes Constraint Language (SHACL)* (2017)
- W3C, *R2RML: RDB to RDF Mapping Language* (2012) · *JSON-LD 1.1* (2020)
- ISO/IEC 39075:2024 *GQL*
- Hogan et al., "Knowledge Graphs", *ACM Computing Surveys* 54(4), 2021
- Angles et al., "PG-Schema: Schemas for Property Graphs", SIGMOD 2023
- LinkML 문서 (linkml.io, generators: gen-json-schema · gen-pydantic · gen-shacl · gen-owl) · Neo4j neosemantics(n10s) 문서 · Ontop 문서 (ontop-vkg.org)
- Neo4j GraphRAG Python 문서 (SimpleKGPipeline) · Microsoft GraphRAG 문서 (graphrag init · index · query)
- Neo4j Cypher Manual, *Constraints* (node key · property existence)
- Edge et al., "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (Microsoft, 2024)
- Palantir Foundry 문서, *Ontology overview*
