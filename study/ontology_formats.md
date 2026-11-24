# RDF · OWL · YAML · 속성 그래프 — 무엇이 어느 층인가

관련 질문: [qna_notes.md](../qna_notes.md) Q025 (함께 보면 좋은 것: Q001 TBox/ABox, Q002 속성 그래프 안의 온톨로지, Q018 실제 데이터 연결).

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

## 3. 자주 헷갈리는 질문
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
- LinkML 문서 (linkml.io) · Neo4j neosemantics(n10s) 문서 · Ontop 문서 (ontop-vkg.org)
- Edge et al., "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (Microsoft, 2024)
- Palantir Foundry 문서, *Ontology overview*
