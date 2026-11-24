# QnA 노트 — 발표 2 · 온톨로지 구축

발표 준비 중 주고받은 질문과 답을 모아 둔 노트입니다. 나중에 슬라이드·발표자 노트에 반영하거나, 학습 자료(`study/` 폴더)를 만들 때 씁니다. 초기 항목(Q001~Q008)에 나오는 "학습 가이드"는 저장소에 올리지 않은 개인 정리 파일(`study_guide_ontology_build.md`)입니다.

**항목 형식**
- 질문: 물어본 내용 그대로
- 답 요약: 핵심만 3–5줄
- 키워드: 다시 찾을 때 쓸 용어
- 반영 후보: 관련 슬라이드(P01–P31, P17a 등 id) 또는 학습 가이드 장, 반영 여부
- 출처: 답의 근거가 된 문서나 링크

**장 번호:** 답에 쓴 "22장" 등은 슬라이드 id 기준이다(P22 = 22장). 2026-11-24에 P17a를 추가해서 화면의 쪽 번호는 P18부터 1씩 밀렸다(P22는 화면에서 23쪽).

**상태 표시:** `[ ]` 아직 반영 안 함 · `[x]` 반영함 · `[-]` 반영하지 않기로 함

---

<!-- 새 항목은 아래에 Q001부터 번호를 붙여 추가 -->

## Q001. TBox·ABox는 무슨 뜻이고, 지식 그래프는 둘 중 어디까지인가? `[ ]`
- **질문**: "TBox(용어·개념 정의 = 온톨로지)와 ABox(개별 사실 = 데이터)"는 무슨 뜻인가? 원래 쓰는 용어인가? 지식 그래프(KG)는 TBox + ABox인가, 아니면 온톨로지와 KG(ABox)를 나눠 봐야 하나?
- **답 요약**:
  - 기술 논리(Description Logic, OWL의 바탕이 되는 논리)의 표준 용어다. 지식 베이스를 KB = (TBox, ABox)로 나눈다.
    - TBox(Terminological box): 개념과 관계의 정의·규칙. 예: `직원 ⊑ 사람`, `소속` 관계는 직원→팀.
    - ABox(Assertional box): 개별 사실. 예: `직원(김철수)`, `소속(김철수, 데이터팀)`.
    - OWL 2에서는 관계 자체의 성질(전이성, 하위 관계 등)을 RBox로 따로 떼기도 한다.
  - KG에는 단일 표준 정의가 없다. 그래도 주요 정의는 대부분 "KG = 인스턴스 데이터 + 이를 조직하는 스키마·온톨로지"로 본다. 즉 TBox + ABox 쪽이 주류다.
    - Paulheim(2017): 실세계 개체와 관계를 그래프로 기술하고, 가능한 클래스와 관계를 스키마로 정의한다.
    - Ehrlinger & Wöß(2016): KG는 정보를 온톨로지에 통합하고 추론기로 새 지식을 도출한다.
    - Hogan et al.(2021): 데이터 그래프가 중심이고, 스키마·온톨로지·규칙은 선택 요소다. 가장 느슨한 정의다.
    - Neo4j 진영(Barrasa & Webber, *Building Knowledge Graphs*, O'Reilly 2023): KG = 그래프 데이터 + 조직 원리(organizing principle: 분류 체계, 온톨로지 등).
    - Wikidata: 클래스(예: Q5 "사람")와 하위 클래스 관계(P279)도 같은 그래프의 항목이다. 온톨로지가 KG 안에 들어 있는 대표 사례다.
  - 정리하면 "온톨로지는 KG의 구성 요소(스키마 층)"가 일반적 인식이다. "KG = ABox만"이라는 구분은 표준적 정의가 아니고, 구현에서 스키마를 따로 관리할 때 생기는 말버릇에 가깝다.
  - "온톨로지 = TBox"도 단순화다. OWL 온톨로지 파일에는 고정 개체(named individual)도 들어갈 수 있다. TBox/ABox는 지식을 구성하는 문장의 종류를 나눈 것이지, 저장소를 나눈 것이 아니다.
- **키워드**: Description Logic, TBox / ABox / RBox, 지식 베이스(KB), OWL 2, Hogan et al. "Knowledge Graphs", 속성 그래프 vs RDF, named individual
- **반영 후보**: P02 발표자 노트의 concept 항목(`notes.js` 17행), 학습 가이드 62행·용어집 771행. 현재 "온톨로지 = TBox, 데이터 = ABox" 표현은 단순화라서 점검이 필요함.
- **출처**:
  - Baader et al., *The Description Logic Handbook* (2003)
  - W3C, *OWL 2 Web Ontology Language Primer*
  - Hogan et al., "Knowledge Graphs", *ACM Computing Surveys* 54(4), 2021
  - Paulheim, "Knowledge graph refinement: A survey of approaches and evaluation methods", *Semantic Web* 8(3), 2017
  - Ehrlinger & Wöß, "Towards a Definition of Knowledge Graphs", SEMANTiCS 2016
  - Barrasa & Webber, *Building Knowledge Graphs*, O'Reilly, 2023

## Q002. 온톨로지를 Neo4j 속성 그래프 안에 두는 건 비일반적인가? 그래프 DB를 쓰면 RDF/OWL이 일반적인가? `[ ]`
- **질문**: 온톨로지를 Neo4j 속성 그래프로 두는 건 비일반적인가? YAML이나 RDB에 두거나, 그래프 DB를 쓸 거면 RDF/OWL 방식을 쓰는 게 일반적인가?
- **답 요약**:
  - 원론적으로 "온톨로지"라는 말을 엄밀하게 쓰면, 그것을 표현하는 표준은 W3C의 RDFS·OWL 하나다. 온톨로지 공학 분야에서는 OWL로 작성(주로 Protégé)하고 Turtle·RDF/XML 파일로 배포하는 것이 정석이다. 인스턴스 데이터를 어디에 두든 마찬가지다.
  - 속성 그래프(Neo4j 등)에는 표준 온톨로지 언어가 없다.
    - GQL(ISO/IEC 39075:2024)에 그래프 타입 개념이 들어갔고, PG-Schema(SIGMOD 2023) 같은 제안이 있다. 그래도 OWL 수준의 의미론·추론 표준은 아니다.
    - 그래서 속성 그래프 진영에서는 같은 대상을 보통 "온톨로지"보다 "그래프 데이터 모델 / 스키마"라고 부른다. 대개 라벨, 관계 타입, 제약 조건, 앱 코드에 암묵적으로 들어 있다.
  - Neo4j 안에 온톨로지를 노드로 두는 방식(메타 그래프)은 공식 도구가 지원한다. n10s가 OWL을 가져오면 `:Class`, `:SCO`, `:DOMAIN`, `:RANGE`로 저장한다(Aura에서는 n10s 사용 불가). 다만 이는 OWL을 원본으로 두고 그 사본을 그래프에 들여오는 용도이며, 온톨로지 원본을 관리하는 주류 방식은 아니다.
  - YAML·RDB는 온톨로지 표준 형식이 아니다.
    - YAML·JSON은 LLM 추출 도구의 스키마 설정으로 흔히 쓰이지만, 이는 "추출 스키마"이지 형식 온톨로지가 아니다.
    - LinkML은 YAML로 쓰는 스키마 언어이고 OWL·JSON Schema 등으로 변환할 수 있다. 그래서 둘을 잇는 다리로 쓰인다.
    - RDB는 용어 사전이나 MDM 참조 데이터 관리에는 쓰이지만, 온톨로지 원본 저장소로는 일반적이지 않다.
  - "그래프 DB를 쓰면 RDF/OWL"도 아니다. 그래프 DB는 두 계열이다.
    - 속성 그래프: Neo4j, Memgraph, Neptune PG 모드. 질의 언어는 Cypher·GQL.
    - RDF 트리플 저장소: GraphDB, Stardog, Jena Fuseki, Neptune RDF 모드. 질의 언어는 SPARQL.
    - RDF 계열을 고르면 온톨로지(OWL)와 데이터가 같은 모델에 살고, 표준 추론·SHACL 검증·외부 온톨로지 연결(FIBO, schema.org, SNOMED)이 자연스럽다.
  - 한 줄 요약: 형식 온톨로지의 표준은 OWL이다. 속성 그래프를 쓰면 온톨로지는 비표준 방식으로 다루게 되고, 그 진영에서는 보통 "스키마"라고 부른다.
- **키워드**: 속성 그래프 vs RDF, n10s(neosemantics) `n10s.onto.import`, 메타 그래프, LinkML, SHACL, GQL(ISO/IEC 39075), source of truth, schema-as-code
- **반영 후보**:
  - P17 "추출 ① 온톨로지와 출력 스키마를 먼저 정합니다": "온톨로지"와 "추출 스키마"라는 용어를 구분해 쓰는지 점검.
  - 학습 가이드의 RDF vs 속성 그래프 장.
  - 예상 질의응답 후보.
- **출처**:
  - Neo4j Labs, *neosemantics (n10s) User Guide*: Importing Ontologies
  - Hogan et al., "Knowledge Graphs", *ACM Computing Surveys* (2021)
  - ISO/IEC 39075:2024 GQL
  - W3C, *OWL 2 Web Ontology Language Document Overview*
  - Angles et al., "PG-Schema: Schemas for Property Graphs", SIGMOD 2023
  - LinkML 문서(linkml.io)

## Q003. RDB·NoSQL 없이 원본(CSV·Excel, 온톨로지, 로그, md)을 어떤 형태로 저장하고, KG는 어떻게 구축하는 게 일반적인가? `[x]`
- **질문**: 2000×10000 규모의 Excel·CSV 원본, 도메인 온톨로지, 로그, md 파일을 어떤 형태로 저장하는 게 일반적인가? 별도 RDB·NoSQL은 운영하지 않는 상황이다. 일반적인 KG 구축 방식은 무엇이고, 멀티홉 조회가 많고 도메인이 방대하며 관계가 복잡하고 자주 변하는 상황에서는 어떤 방식이 맞나?
- **답 요약**:
  - 일반적 구조는 계층형이다.
    - 원본 보관(불변, 파일) → 정제·스테이징(표 형태) → 온톨로지·매핑 → KG 서빙(그래프 DB) → 문서 검색 인덱스.
    - KG는 원본에서 언제든 다시 만들 수 있는 "파생물"로 본다. 원장(system of record)은 원본 쪽이다.
  - KG 구축 방식은 크게 셋이다.
    - 물리 적재(ETL로 그래프 DB에 넣음): 가장 흔하다.
    - 가상 KG(OBDA: Ontop, R2RML로 원천 RDB를 그대로 질의): 원천 RDB가 있을 때 쓴다.
    - 문서 추출(NLP·LLM): 비정형 자료가 대상이다.
  - 자료별 일반적 저장 형태:
    - CSV·Excel: 원본은 파일로 불변 보관. 정제본은 Parquet로 변환하고, DuckDB(서버 없는 내장 DB)로 처리한다. 2,000만 셀 수준은 작은 규모다. 10,000열처럼 넓은 표는 그래프 속성 1만 개로 옮기지 않고 (대상, 항목, 값, 시점) 형태의 긴 표로 바꾼다.
    - 온톨로지: git의 텍스트 파일이 정석이다. 형식은 OWL/Turtle(표준), 개발자 친화적으로는 LinkML YAML.
    - 로그: 원본은 파일 또는 Parquet에 둔다. KG에는 의미 있는 이벤트·집계만 올리고 원본 위치를 링크한다. 로그 원문을 그래프에 넣지 않는 것이 일반적이다.
    - md 문서: 파일(git)로 두고, 청크로 나눠 전문·벡터 인덱스를 만든다. 추출한 개체는 Document–Chunk–Entity "어휘 그래프(lexical graph)"로 연결해 근거를 남긴다. neo4j-graphrag 문서에 나오는 패턴이다.
  - 상황 조건별 판단:
    - 멀티홉 조회가 많다 → 서빙 계층은 그래프 DB가 맞다. 경로 탐색 위주라면 속성 그래프가 일반적이다.
    - 도메인이 방대하다 → 온톨로지를 코어 + 하위 도메인 모듈로 나눈다. 표준 재사용을 검토한다(설비·정비: ISO 14224, IOF Core/Maintenance, ISO 15926, ISA-95, AAS). 표준 재사용 비중이 크면 OWL로 작성하는 쪽이 유리하다.
    - 관계가 복잡하고 자주 변한다 → 온톨로지는 버전 관리하고, KG는 재구축할 수 있게 둔다. 관계에 유효 기간(valid_from/to)을 두거나 이벤트 노드로 표현한다.
  - RDB를 안 쓰는 동안은 "파일 + Parquet + DuckDB"가 서버 없이 가능한 일반적 선택이다. 여러 사람이 승인·수정 이력을 동시에 쓰는 단계가 오면 Postgres 같은 트랜잭션 저장소를 들이는 것이 보통이다.
- **키워드**: 계층형(medallion) 아키텍처, system of record, 파생 KG·재구축 가능성, OBDA·Ontop·R2RML·RML, Parquet, DuckDB, wide→long(unpivot), lexical graph, 온톨로지 모듈화, ISO 14224, IOF, ISO 15926, ISA-95, AAS, DVC, neo4j-admin import, 유효 기간 관계
- **반영 후보**: 적재·방법론 장(계획서 1-1 "저장/표현 형태" 표). 표에 "파일 + Parquet/DuckDB" 행과 로그 처리 원칙을 추가할지 검토. 학습 가이드 적재 장.
- **출처**:
  - Hogan et al., "Knowledge Graphs", *ACM Computing Surveys* (2021): 구축·정제 장
  - Neo4j, *GraphRAG for Python* 문서: Lexical Graph / SimpleKGPipeline
  - Neo4j Operations Manual: `neo4j-admin database import`
  - DuckDB 문서: CSV·Excel·Parquet 읽기
  - W3C R2RML (2012), Ontop 문서
  - ISO 14224:2016, Industrial Ontologies Foundry(IOF) Core

## Q004. 저장 구조 이야기를 발표 뒷부분에 추가해야 하나? Neo4j 중심이면 빈약해 보이나? `[x]`
- **질문**: Q003 내용(원본·정제·온톨로지·그래프를 나눠 관리)을 발표 뒷부분에 추가하는 게 좋은가? Neo4j 기준으로 진행했는데 이대로 마무리하면 빈약해 보이나? "속성 그래프 하나로 다 하지 않고 이렇게 구성해 관리해야 한다"는 페이지를 넣는 게 나은가?
- **답 요약**:
  - 핵심 메시지는 이미 있다. P23 "적재: 저장소마다 역할을 나누고…"가 파일·RDB·Git은 기준이고 그래프·벡터는 사본이라고 말한다. 따라서 "속성 그래프 하나로 다 한다"는 덱은 아니다.
  - 부족한 점:
    - (1) 전체 구성을 한눈에 보는 그림이 없다. 표가 적재 단계 안에 묻혀 있다.
    - (2) P23이 RDB 원장을 전제로 하는데, 현재는 RDB를 운영하지 않는다.
    - (3) 정형 넓은 표·로그 처리 경로가 없다. 데모가 회의록·메일 중심이다.
  - 권장: 새 주장을 담은 페이지보다 "목표 아키텍처 한 장"을 마무리 직전(P30 앞)에 두는 편이 낫다. 오늘 데모가 그중 어느 부분인지 표시하고, P23의 RDB 행은 현재 상황에 맞게 고친다.
- **키워드**: 목표 아키텍처, 서빙 계층, 데모 범위 표시, 기준 vs 사본
- **반영 후보**: P23 표 수정, P29~P30 사이 신규 1장(또는 P30 "정할 것"에 저장 구조 결정 항목 추가)
- **출처**: 덱 자체 검토(P23, P25, P26, P30)

## Q005. 수집 단계(13~14장)에 더할 실무 고민은? 모든 소스를 운영 스토리지에 다 복사해야 하나? `[ ]`
- **질문**: 13~14장 수집 부분에 사람들이 실제로 고민하는 내용이나 도메인 상황에 맞춰 추가할 내용이 있나? 지금 구조대로면 모든 소스 데이터를 운영 스토리지에 다 저장해야 하는데, 데이터가 너무 커서 불가능하지 않나?
- **답 요약**:
  - 다 복사하지 않는 것이 일반적이다. 원칙은 "되찾을 수 없는 것만 복사하고, 나머지는 참조한다."
    - 원천이 버전과 고정 ID를 가진 기록 시스템이면 참조만 남긴다. MES·CMMS DB, 버전 이력이 있는 문서 관리 시스템, Git이 해당한다. 참조 = source_system, id, 버전·etag, 해시, 수집 시각이며, 필요할 때 다시 가져온다.
    - 원천이 사라지거나 덮어쓰이면 복사한다. 개인 PC, 삭제될 수 있는 메일, 로테이션되는 로그, 같은 이름으로 덮어쓰는 Excel이 해당한다.
  - 규모를 줄이는 일반적 방법:
    - 범위를 CQ(업무 질문) 기준으로 정한다. 데이터 최소화 원칙과도 맞는다.
    - 메타데이터는 전부, 내용은 선별 수집한다. 데이터 카탈로그(DataHub, OpenMetadata) 방식이다.
    - 계층 보관(hot / cold / 보존 기간 후 삭제)을 둔다. CSV를 Parquet로 바꾸면 압축된다.
    - 센서·로그는 원천 저장소에 두고 이벤트·집계와 포인터만 가져온다.
    - 필요할 때만 원천을 질의하는 연합·가상화(Trino, OBDA)도 있다.
  - 대가: 참조만 남기면 재현성이 원천의 보존 정책에 의존한다. 원천에 버전이 없으면 복사하거나 "정확한 재현 불가"를 받아들여야 한다.
  - 수집에서 실무자들이 자주 고민하는 것:
    - 소스 목록·소유자·갱신 주기 정리, 그리고 가치 대비 비용으로 우선순위 정하기
    - 원천 부하(읽기 복제본, 야간 수집)
    - 권한·ACL 전파, 개인정보 마스킹
    - 스키마 변화 감지와 데이터 계약
    - 신선도 SLA(배치냐 스트리밍이냐)
    - 초기 백필 범위, 수집 모니터링
  - 국내 제조·반도체 환경에서 특히 걸리는 것:
    - 망분리·반출 통제
    - 문서 DRM 암호화로 파서가 읽지 못하는 문제
    - HWP 형식, 스캔 PDF(OCR 필요)
    - CP949 인코딩
    - Excel 병합 셀·여러 줄 헤더·숨은 시트·수식
    - "최종_v3_진짜최종" 같은 파일 사본
    - FDC 트레이스처럼 대용량인 설비 센서 데이터
- **키워드**: copy vs reference, system of record, 데이터 최소화, metadata-first, 데이터 카탈로그, 데이터 계약, 스키마 드리프트, freshness SLA, 백필, 계층 보관, 연합 질의(Trino), DRM, 망분리, HWP, CP949, FDC
- **반영 후보**:
  - P14 원칙 문구("원본 불변 보관")를 "원본을 되찾을 수 있게 남긴다(사본 또는 참조 + 버전 + 해시)"로 넓히기.
  - 수집 ③ "다 복사하지 않는다" 1장 추가 검토.
  - P13 발표자 노트·토론 질문에 DRM·형식·스키마 변화 추가.
- **출처**:
  - DataHub / OpenMetadata 문서(메타데이터 수집)
  - Debezium 문서
  - GDPR 제5조(1)(c) 데이터 최소화·개인정보 보호법 제3조
  - Trino 문서(연합 질의)
  - Apache Parquet

## Q006. 정규화를 규칙으로 하면, 새 용어나 규칙에 없는 표현은 어떻게 하나? `[ ]`
- **질문**: 15장의 정규화는 rule-based 같은데, 새로운 용어나 규칙에 없는 특이 사례는? 소스가 방대하고 사람마다 표현이 다른데 rule-based로 관리할 수 있나?
- **답 요약**:
  - 규칙만으로는 확장되지 않는다. 일반적으로는 층을 나눈다.
    - ① 규칙: 날짜·단위·코드 패턴처럼 형식이 정해진 것. 이건 규칙이 맞다.
    - ② 용어 사전(SKOS: prefLabel·altLabel·hiddenLabel) 조회
    - ③ 후보 생성: 문자열 유사도 + 임베딩으로 사전 항목 top-k를 뽑는다.
    - ④ 선택: 분류기나 LLM이 후보 중 하나 또는 "해당 없음(NIL)"을 고른다.
    - ⑤ NIL 처리: 원래 표현을 보존하고 "미연결"로 표시한 뒤 큐에 쌓는다. 빈도순으로 사람이 검토하고, 사전에 추가하고, 영향받는 문서를 재처리한다.
  - 사람이 관리하는 단위는 "표현별 규칙"이 아니라 "사전 + 매칭 모델 + 큐레이션 루프"다.
  - 표현은 롱테일(Zipf) 분포라서, 소수 용어가 언급의 대부분을 덮는다. 상위부터 처리하고 나머지는 미연결로 둬도 된다.
  - LLM에 맡길 때는 사전 후보를 함께 주고, 출력을 "기존 ID 또는 NEW"로 제한한다. 존재하지 않는 ID는 검증에서 막는다.
  - 운영 지표: 연결률(언급 중 사전에 연결된 비율), NIL 비율 추이, 검토 대기량.
  - 바이오의료(UMLS·SNOMED 매핑)와 커머스 상품 속성 정규화에서 오래 쓰인 방식이다.
- **키워드**: 용어 정규화, SKOS, entity linking, candidate generation, NIL detection, 롱테일·Zipf, human-in-the-loop 큐레이션, 연결률(coverage), retrieval-augmented normalization
- **반영 후보**: P15(규칙만 있는 것처럼 보임: "새 용어 → 미연결 큐" 한 줄 추가), P27 질문 큐와 연결
- **출처**:
  - W3C SKOS Reference (2009)
  - Shen, Wang & Han, "Entity Linking with a Knowledge Base", *IEEE TKDE* (2015)
  - Aronson, MetaMap (UMLS 매핑) 관련 문서

## Q007. Entity resolution을 깊이 이해하고 싶다. 현업에서는 어떻게 구현하나? `[ ]`
- **질문**: 16장의 Entity resolution이 이해가 잘 안 된다. 더 깊이 있는 설명과 관련 내용, 그리고 현업에서 실제로 구현하는 방법은?
- **답 요약**:
  - ER = 같은 실세계 대상을 가리키는 레코드·언급을 찾아 하나로 묶는 일이다. 다른 이름으로 record linkage, deduplication, entity matching, MDM 매칭이라고도 한다.
  - 두 종류가 있다.
    - 레코드 ↔ 레코드: 정형. 예: CMMS 설비 표 ↔ MES 설비 표.
    - 언급 ↔ 개체: 텍스트. 예: "17호기" → EQ-017. 이쪽은 entity linking이라고 부른다.
  - 절차:
    - 표준화
    - 블로킹: 키, sorted neighborhood, LSH, 임베딩 ANN. 지표는 축소율과 pair completeness.
    - 필드별 비교: 정확 일치, Jaro-Winkler, 편집 거리, 토큰 Jaccard, 날짜·숫자 거리, 임베딩 코사인
    - 판정: 규칙 → 확률(Fellegi-Sunter, EM) → 지도학습(Dedupe, Ditto) → LLM
    - 클러스터링: 연결 요소는 전이성 함정이 있으니 cannot-link 제약을 둔다.
    - 대표 레코드(survivorship)
    - 평가: 쌍 단위 정밀도·재현율, B-cubed
  - Fellegi-Sunter 원래 모델은 임계값이 두 개다. 일치 / 검토(possible match) / 불일치로 나눈다. 일치 가중치는 log2(m/u), 불일치 가중치는 log2((1-m)/(1-u))다.
  - 현업 구현 순서:
    - ① 기준 마스터(MES·CMMS 설비 마스터 등)가 있으면, ER은 "서로 중복 찾기"가 아니라 "마스터에 연결"이 되어 훨씬 쉽다.
    - ② 업무 키 정확 일치로 대부분을 처리한다.
    - ③ 나머지를 확률 모델로 판정한다. Splink는 DuckDB를 백엔드로 쓸 수 있다.
    - ④ 텍스트 언급은 사전·별칭 + 문서 메타데이터 맥락(FAB, 팀)으로 후보를 뽑고 점수를 매긴다.
    - ⑤ 중간 점수대는 검토 큐로 보내고, 검토 라벨로 임계값을 조정한다.
    - ⑥ 내부 ID를 영구적으로 유지하고, 병합·분리 로그를 남긴다. 물리 병합 대신 SAME_AS 같은 논리 병합으로 되돌릴 수 있게 한다.
  - 도구:
    - Splink(확률, EM), Dedupe(능동 학습), Zingg(Spark ML), Python recordlinkage
    - Senzing(상용, 증분형 개체 중심), AWS Entity Resolution
    - Neo4j GDS의 WCC·Node Similarity
- **키워드**: record linkage, entity linking, blocking, comparison vector, Fellegi-Sunter, m/u, match weight, EM, clerical review, Splink, Dedupe, Ditto, survivorship, golden record, MDM, B-cubed, cannot-link, 증분 ER, persistent ID
- **반영 후보**: P16(정형 ER과 텍스트 linking을 구분해 보여 주기, m/u 숫자 예시 추가 검토), 학습 가이드 ER 장 보강
- **출처**:
  - Fellegi & Sunter, "A Theory for Record Linkage", *JASA* (1969)
  - Christen, *Data Matching* (Springer, 2012)
  - Papadakis et al., "Blocking and Filtering Techniques for Entity Resolution: A Survey", *ACM Computing Surveys* (2020)
  - Li et al., "Deep Entity Matching with Pre-Trained Language Models (Ditto)", *VLDB* (2020)
  - Splink 문서(moj-analytical-services.github.io/splink)

## Q008. 데모의 Neo4j 로그인 비밀번호를 임의로 설정했나? `[ ]`
- **질문**: demo는 띄웠는데 Neo4j 로그인이 필요하다. 비밀번호를 임의로 정해 두었나?
- **답 요약**:
  - 그렇다. 데모를 만들 때 Docker 컨테이너 `eb-neo4j`를 처음 띄우면서 임의 비밀번호를 생성해 설정했다.
  - 비밀번호는 `demo/.env`의 `NEO4J_PASSWORD`에만 있다. 사용자명은 `neo4j`이다.
  - Neo4j 비밀번호는 컨테이너를 **처음** 만들 때(데이터 볼륨이 비어 있을 때) `NEO4J_AUTH`로 한 번 정해진다. 나중에 `.env`만 바꾸면 로그인이 안 맞으므로, 바꾸려면 Neo4j에서 `ALTER CURRENT USER SET PASSWORD`로 바꾼 뒤 `.env`도 같이 고친다.

## Q009. "온톨로지 · 용어 사전 · 검증 규칙을 Git으로 관리"의 Git은 버전 관리 Git인가? `[x]`
- **질문**: 온톨로지와 용어 사전, 검증 규칙은 사람이 정하고 git으로 관리한다고 되어 있는데, 여기서 git은 버전 관리하는 그 git이 맞나?
- **답 요약**:
  - 맞다. 소스 코드를 관리하는 그 Git이다. 정의 파일(YAML)을 코드처럼 다루자는 뜻이다("schema as code", GitOps와 같은 생각).
  - 얻는 것:
    - 누가 · 언제 · 왜 바꿨는지 이력(커밋 메시지, PR 리뷰 기록)
    - 바꾸기 전에 리뷰(PR)와 자동 검사(CI)를 거침
    - 버전 태그(v1.2.0)를 그래프 데이터에 기록해서 "어느 정의로 만든 사실인지" 추적
    - 문제가 생기면 이전 버전으로 되돌리고 그래프를 다시 만듦
  - 이 저장소의 `demo/ontology/*.yaml`이 그 예이고, 26장(버전 관리)의 CI 흐름이 이걸 전제로 한다.
- **키워드**: schema as code, GitOps, PR 리뷰, CI, 시맨틱 버저닝, 재현성
- **반영 후보**: 이미 9 · 26장에 있음. 따로 반영할 것 없음.
- **출처**: Git 공식 문서(git-scm.com) · Semantic Versioning 2.0.0(semver.org)

## Q010. 개발자가 도메인 전문가가 아니라면 온톨로지의 개념과 관계를 어떻게 정하나? 전 범위를 못 덮으면? `[ ]`
- **질문**: 온톨로지의 개념과 관계 결정을 사람이 한다는데, KG를 만드는 사람이 도메인 전체를 아는 전문가가 아니라 같이 알아가는 개발자라면? 모든 범위를 덮는 개념과 관계를 만들 수 없다면?
- **답 요약**:
  - 주류 방법론은 처음부터 전 범위를 덮으려 하지 않는다. **업무 질문(Competency Question, CQ)으로 범위를 정하고 반복해서 넓히는** 방식이 표준이다(Grüninger & Fox 1995, Noy & McGuinness "Ontology Development 101", NeOn 방법론).
  - 역할 분담: 개발자는 모델링, 전문가는 판정을 맡는다. 전문가에게 "온톨로지를 만들어 달라"고 하지 않고 구체적인 질문에 답하게 한다.
    - 개발자: 문서 · DB 스키마 · 회의록에서 용어를 모으고(LLM으로 초안 가능), 클래스 · 관계 후보를 그림으로 그린다.
    - 전문가: "EQ-017이 FAB마다 따로 있나?", "PM과 정기점검은 같은가?" 같은 예/아니오 질문에 답한다. 짧은 리뷰를 주기적으로.
  - 실무 순서:
    - ① CQ 5~10개 수집. 현업이 실제로 묻는 질문. 예: "FAB-A EQ-017의 최근 PT-V42 교체 이력은?"
    - ② CQ에 필요한 명사는 클래스, 동사는 관계 후보. 그 이상은 만들지 않는다.
    - ③ 기존 자산 재사용: DB 스키마, 코드표, 업계 표준(제조는 ISA-95, 설비 상태는 SEMI E10). 개발자가 모르는 도메인 지식을 표준이 일부 메워 준다.
    - ④ 작은 데이터로 실제로 넣어 보고 CQ가 답하는지 테스트(28장 방법론과 같은 흐름).
    - ⑤ 정의 밖에서 나온 개념은 확장 후보 큐로. 빈도순으로 전문가 리뷰 후 버전을 올린다.
  - 전 범위를 못 덮는 건 정상이다. 정의 밖 데이터도 원본 · 청크로는 남아 있어서, 그래프에 구조화되지 않았을 뿐 검색은 된다. 구조화는 쓰임이 확인된 것부터 한다.
  - 흔한 실수: 처음부터 상위 개념(Thing, Asset, Event 등)을 크게 설계하는 것. 쓰이지 않는 클래스가 많아지고 유지가 어려워진다.
- **키워드**: competency question, Ontology Development 101, NeOn methodology, eXtreme Design(ontology design pattern), 반복 개발, ontology reuse, ISA-95, SEMI E10
- **반영 후보**: 17a장(얼마나 크게: CQ만큼)에 일부 반영. 28장 노트에 "전문가는 판정, 개발자는 모델링" 한 줄 추가 검토.
- **출처**:
  - Grüninger & Fox, "Methodology for the Design and Evaluation of Ontologies" (IJCAI-95 Workshop)
  - Noy & McGuinness, "Ontology Development 101" (Stanford, 2001)
  - Suárez-Figueroa et al., *Ontology Engineering in a Networked World* (NeOn, Springer 2012)
  - Presutti et al., "eXtreme Design with Content Ontology Design Patterns" (WOP 2009)

## Q011. 정제(정규화)에도 사람이 들어가야 하나? 수많은 문서마다 사람이 관여하는 건 불가능하지 않나? `[ ]`
- **질문**: 정제의 정규화도 규칙 + LLM에 맡길 수 있지만 사람이 들어가야 하나? 수집되는 엄청 많은 정형 · 비정형 문서에 사람이 계속 관여하는 건 말이 안 되지 않나?
- **답 요약**:
  - 문서마다 사람이 보는 구조는 아니다. 사람은 개별 건이 아니라 **규칙과 사전(기준)** 을 관리한다. 데이터 품질 · MDM에서 data steward가 하는 일이 이것이다.
  - 흐름:
    - 자동: 규칙(날짜 · 단위 · 코드 패턴) → 용어 사전 조회 → 유사도나 LLM으로 후보 선택. 대부분은 여기서 끝난다.
    - 자동으로 못 푼 것(미연결, NIL)은 원래 표현을 보존한 채 "미연결"로 표시하고 큐에 쌓는다. 처리를 막지 않는다.
    - 사람: 큐를 빈도순으로 본다. "압력센서 V42"가 200번 나왔으면 사전에 별칭 한 줄을 추가한다. 200건이 한 번에 해결되고, 이후 들어오는 문서도 자동 처리된다.
  - 표현은 롱테일(Zipf) 분포라 상위 소수 용어가 언급 대부분을 덮는다. 꼬리 쪽 희귀 표현은 미연결로 남겨도 된다(검색은 원문으로 됨).
  - 사람이 꼭 개입해야 하는 지점은 좁다. 새 용어를 사전에 넣을지, 두 코드가 정말 같은 대상인지(ER 병합처럼 되돌리기 어려운 것). Q006 · Q007과 같은 결론이다.
  - 개입량은 운영 지표로 관리한다: 연결률, 미연결 큐 크기, 주당 사전 추가 건수. 큐가 계속 커지면 사람을 늘리기보다 규칙과 모델을 고친다.
- **키워드**: data stewardship, MDM, human-in-the-loop, 롱테일, 빈도순 큐레이션, NIL, 연결률
- **반영 후보**: 15장 노트에 "사람은 건이 아니라 사전을 고친다" 한 줄(22장 표와 같은 메시지)
- **출처**:
  - DAMA International, *DAMA-DMBOK 2nd ed.* (Data Quality · MDM · Data Stewardship 장)
  - Shen, Wang & Han, "Entity Linking with a Knowledge Base", *IEEE TKDE* (2015)

## Q012. 정의 YAML은 어느 수준으로 만들어야 하나? YAML이 못 덮는 데이터나 새 데이터는? `[x]`
- **질문**: 추출에서 정의를 YAML로 두고 LLM 출력 타입, 검증 코드, 제약, SHACL을 만든다는데, YAML을 어느 정도 수준으로 만들어야 하나? 가장 일반적인 틀과 각 부분을 보여 주는 페이지가 있으면 좋겠다. YAML이 커버 못 하는 범위나 새 데이터는?
- **답 요약**:
  - 수준: **CQ에 답하는 데 필요한 만큼**. 처음엔 클래스와 관계가 각각 열 개 안팎이어도 된다(Q010).
  - 일반적인 블록(새 17a장에 그림으로 넣음):
    - ① 클래스: 키(같은 대상 판단), 필수값, 허용값(enum), 동의어 → LLM 출력 타입, 적재 전 검사, DB 유니크 제약, 용어 사전의 첫 항목
    - ② 관계: from/to, 개수(카디널리티), 기준 시스템 → 방향 · 개수 검사, 원천 대조
    - ③ 추출 예시 → 프롬프트 few-shot
    - ④ 검토 기준(고위험 관계, 추정 표현) → 사람에게 보낼지 판단
    - ⑤ 정의 밖 처리 정책 → 확장 후보 큐
  - 같은 생각의 공개 표준 도구로 **LinkML**이 있다. YAML로 스키마를 쓰면 JSON Schema, Pydantic, SHACL, OWL, SQL DDL을 생성한다. 직접 만들기 전에 참고할 만하다.
  - YAML 밖 데이터는 세 갈래로 처리한다:
    - 버리지 않는다. 원본 · 청크로 저장되어 검색은 된다.
    - LLM이 "정의 밖" 칸(out_of_ontology, unknown_terms)에 따로 담게 한다(데모가 이렇게 함). 이것이 확장 후보 큐가 된다.
    - 빈도와 쓰임이 확인되면 정의를 고치는 PR → 버전 올림 → 해당 원본만 재추출(26장).
  - 정의를 자동으로 늘리지 않는 이유: 정의가 바뀌면 조회 쿼리, 검증, 지표가 같이 바뀌므로 사람 승인이 있는 변경 절차로 다룬다.
- **키워드**: schema-first extraction, LinkML, JSON Schema, Pydantic, closed-world validation, ontology evolution, 확장 후보 큐
- **반영 후보**: 17a장 신설(반영함)
- **출처**: LinkML 문서(linkml.io) · Neo4j GraphRAG Python 문서(SimpleKGPipeline schema) · W3C SHACL Recommendation (2017)

## Q013. SHACL, n10s, Aura는 무엇인가? `[ ]`
- **질문**: SHACL, n10s, Aura 이런 것들이 뭔가? 못 쓸 것 같긴 한데 무엇인지 모르겠다.
- **답 요약**:
  - **SHACL**(Shapes Constraint Language): W3C 표준(2017). RDF 그래프가 지켜야 할 모양을 적는 규칙 언어다. 예: "MaintenanceWork는 ON_EQUIPMENT가 정확히 1개, status는 세 값 중 하나". 검증기를 돌리면 위반 목록이 나온다. "그래프용 스키마 검사기"의 표준판이고, RDF 계열 저장소(GraphDB, Stardog, Jena 등)에서 주로 쓴다.
  - **n10s**(neosemantics): Neo4j Labs가 만든 Neo4j 플러그인. Neo4j(속성 그래프)와 RDF 세계를 잇는다. RDF/OWL 가져오기 · 내보내기, 온톨로지 가져오기, SHACL 검증을 Neo4j 안에서 할 수 있게 해 준다. Labs 프로젝트라 공식 지원 제품은 아니다.
  - **Aura**(AuraDB): Neo4j 회사가 운영하는 클라우드 관리형 Neo4j(DBaaS). 설치 없이 쓰지만 플러그인을 마음대로 올릴 수 없어서 n10s 같은 플러그인은 못 쓴다(APOC 일부는 내장).
  - 우리 상황: 사내 설치 · Community 기준이면 Aura는 해당 없고, n10s는 설치는 가능하지만 필수가 아니다. 같은 검사를 적재 전 Python 코드로 하면 DB와 무관하게 동작한다(20장 정리와 같음). SHACL은 나중에 RDF로 내보내 외부와 연계할 때 고려하면 된다.
- **키워드**: SHACL, shapes, RDF validation, neosemantics, Neo4j Labs, Neo4j AuraDB, DBaaS, 플러그인
- **반영 후보**: 20장 카드 문구를 "표준 규칙 / Neo4j는 플러그인 필요"로 바꿈(반영함). 용어집 후보.
- **출처**:
  - W3C, *Shapes Constraint Language (SHACL)*, Recommendation 2017-07-20
  - Neo4j Labs, *neosemantics (n10s) User Guide*
  - Neo4j Aura 문서(지원 플러그인 목록)

## Q014. 발표를 Neo4j 중심이 아니라 방법론 중심으로 두는 게 낫지 않나? `[x]`
- **질문**: Neo4j를 확실히 쓴다기보다 시각화하기 좋은 대표 그래프 DB라 쓰는 것이다. Neo4j를 쓰면 해결된다기보다 더 큰 범위의 방법론을 제시하고, 세부 해결 방법 중 하나로 Neo4j 기능을 드는 게 낫지 않나?
- **답 요약**:
  - 동의한다. 발표에서 다루는 문제(ER, 근거 · 시점 관리, 검증, 사람 검토, 버전)는 대부분 DB 바깥 파이프라인의 일이다. DB는 "승인된 사실을 조회하는 사본"(23장)이므로 Neo4j든 다른 그래프 DB든 방법은 같다.
  - Neo4j가 실제로 영향을 주는 곳은 좁다: 제약 기능 범위(에디션별), 플러그인(n10s), 데이터 브랜치 부재, Cypher 문법(MERGE 함정).
  - 반영: 17 · 20 · 23 · 26 · 30장에서 "Neo4j"를 "그래프 DB (예: Neo4j)"로 바꾸고, Neo4j 고유 사항은 예시로 낮췄다. 30장 노트에 "데모는 시각화가 좋아 Neo4j를 썼고, 방법은 DB와 무관"을 넣었다.
  - 남긴 것: 12장 데모, 16장 SimpleKGPipeline 기본 ER 함정, 17장 SimpleKGPipeline 스키마 모드, 23장 MERGE 함정. 실제 도구를 쓸 때 겪는 구체적 함정이라 예시로 둔다.
- **키워드**: vendor-neutral architecture, 속성 그래프, GQL(ISO/IEC 39075), 조회 계층
- **반영 후보**: 반영함(17 · 20 · 23 · 26 · 30장)
- **출처**: ISO/IEC 39075:2024 GQL · Neo4j Operations Manual(에디션 비교)

## Q015. 확신 높고 위험 낮은 것도 결국 사람이 다 봐야 하는 것 아닌가? 사내 데이터별로 어디로 가는지 `[x]`
- **질문**: 22장 기준으로 확신이 높고 위험이 낮은 부분도 사실상 사람이 다 봐야 하는 것 아닌가? 실제 사내 데이터로 보면, 어떤 데이터는 그대로 가고, 어떤 데이터는 어디로 가서 사람이 처리하고, 어떤 데이터는 다른 방식으로 사람이 처리하는지 더 명확히 보이면 좋겠다.
- **답 요약**:
  - 다 보지 않는다. 그 칸은 **자동 반영 + 사후 표본 검수**다. 표본 검수는 전부 확인이 아니라, 무작위 몇 건을 보고 오류율을 추정해 자동 범위를 조정하는 통계적 품질 관리(acceptance sampling)다.
  - 근거: 원천 시스템(CMMS · MES) 기록은 이미 그 시스템의 업무 절차를 거쳐 확정된 값이다. 사람이 다시 보면 이중 검사다. 대신 매핑 규칙이 틀렸는지를 표본으로 감시한다.
  - 사내 데이터별 경로(22장 스텝 4로 반영):

    | 데이터 | 경로 | 사람이 하는 일 |
    |---|---|---|
    | CMMS · MES 원천 기록 | 자동 반영 | 주 1회 무작위 몇 건, 틀린 비율로 자동 범위 조정 |
    | 엑셀 · CSV export 형식 오류 · 없는 코드 | 데이터 담당자 큐 | 행이 아니라 원천이나 매핑 규칙을 고침 |
    | 문서와 공식 기록 불일치 | 담당자 확인 큐 | 두 값을 비교해 예/아니오 |
    | 고장 원인 · 품질 · 안전 판단(추정) | 전문가 검토 | 주간 회의에서 묶어서 판정, 그전엔 "추정"으로만 |
    | 지시어 · 정보 부족 | 질문 큐 | 새 문서로 자동 해소 시도 후 작성자에게 질문 |

  - 핵심은 "사람은 건이 아니라 예외와 규칙을 본다"이다(Q011과 같은 원리).
- **키워드**: human-in-the-loop, acceptance sampling, 예외 처리, 라우팅, 자동 승인 임계값
- **반영 후보**: 22장 스텝 4 신설(반영함)
- **출처**: ISO 2859-1(계수형 샘플링 검사) · Amershi et al., "Power to the People: The Role of Humans in Interactive Machine Learning", *AI Magazine* (2014)

## Q016. 근거를 그래프에 반드시 붙여야 하나? 방대해지고 agent 탐색에 방해되지 않나? `[x]`
- **질문**: 23장에서 근거를 그래프에 붙여야 하나? 모든 노드 · 관계에 근거가 들어가면 방대해지고 agent가 정보를 찾는 데 방해될 수 있다. KG에 들어간 데이터는 검증된 것으로 보고, 근거는 따로 파일이나 로그로 관리하는 게 낫지 않나?
- **답 요약**:
  - 근거(provenance)를 남기는 것 자체는 필요하다는 게 일반적인 입장이다(W3C PROV-O). 이유:
    - 원본 문서가 정정 · 삭제되면 그 문서에서 나온 사실을 찾아 무효화해야 한다.
    - 출처끼리 충돌할 때 어느 쪽을 믿을지 판단한다.
    - 답변에 인용을 달고, 권한이 없는 문서에서 나온 사실을 걸러낸다.
    - "검증됐다"도 확률적이라(표본 정확도 95%는 100%가 아님) 틀린 사실을 되짚을 길이 필요하다.
  - 하지만 **근거 내용을 그래프에 다 넣을 필요는 없다**. 지적이 맞다. 흔한 절충:
    - 그래프: 사실마다 근거 ID 목록(`sources: [DOC-M201#c05]`), 확실성, 유효 기간 정도만 속성으로.
    - 원장(RDB · Parquet · 로그): 원문 위치, 인용문, 추출 모델 · 프롬프트 버전, 검토 기록.
    - agent 조회 쿼리와 뷰는 근거 노드를 빼고, 근거가 필요할 때만 ID로 원장을 찾아간다.
  - RDF 진영은 named graph로 사실 묶음 단위 출처를 따로 둔다. 속성 그래프에서는 "ID만 그래프, 상세는 밖"이 실용적이다.
  - 반영: 23장 근거 카드에 "C · 그래프에는 근거 ID만, 상세는 원장에" 선택지를 추가하고, 노트에 최소한 ID는 남기는 이유를 넣었다.
- **키워드**: provenance, W3C PROV-O, reification, named graph, 원장(ledger), 근거 ID, 조회 뷰
- **반영 후보**: 23장(반영함). 발표 3(조회)과 연결: agent 조회 범위에서 근거를 빼는 뷰.
- **출처**: W3C, *PROV-O: The PROV Ontology* (2013) · Hogan et al., "Knowledge Graphs", *ACM Computing Surveys* (2021), Provenance 절

## Q017. 새 문서가 들어오면 질문 큐를 훑어 자동으로 보강 · 승인하는 방법은? `[x]`
- **질문**: 새 문서가 들어왔을 때 자동 파이프라인이 질문 큐를 훑어서, 이번 문서로 해결 가능한 질문이 있는지 보고, 질문을 보강하거나 아예 자체 승인해서 반영하는 것도 방법일 수 있다.
- **답 요약**:
  - 좋은 방법이고 27장 해소 경로 ②가 이것이다. 구체화하면:
    - 매칭: 새 문서의 개체(설비 · 부품 · 작업)와 기간이 열린 질문의 연결 개체 · 기간과 겹치는지 먼저 프로그램으로 거른다(싸다). 겹치는 것만 LLM에 "이 문서가 이 질문에 답하나?"를 묻는다.
    - 판정: 위험이 낮고 근거가 명확하면 자동으로 닫고 반영한다(22장 사분면과 같은 기준). 애매하면 질문에 "답 후보 + 근거 문장"을 붙여 담당자에게 예/아니오만 묻는다(보강).
    - 기록: 자동으로 닫은 것도 어떤 문서가 답했는지 근거로 남기고, 표본으로 사후 확인한다.
  - 장점: 사람 부담이 "자유 서술 답변"에서 "예/아니오 확인"으로 줄어든다.
  - 주의: LLM은 억지로 연결하는 경향이 있으니, 같은 설비 · 같은 기간 같은 매칭 조건을 프로그램으로 먼저 거는 게 중요하다.
- **키워드**: question queue, incremental resolution, blocking, human confirmation
- **반영 후보**: 27장 카드 ② · 노트, 22장 표 질문 큐 행(반영함)
- **출처**: 자체 설계(ER의 블로킹 → 판정 구조를 질문 해소에 적용)

## Q018. 온톨로지 이후, 방대한 실제 데이터(엑셀 2만 개, 문서, 여러 RDB)는 어떻게 연결하나? 노드에 원천 위치를 속성으로 두는 게 맞나? `[ ]`
- **질문**: 발표는 거의 온톨로지 구축 이야기인데, KG는 실제 데이터까지 포함하는 것 아닌가? 엑셀 2만 개 수준, 방대한 회의자료 · 문서, 여러 RDB를 온톨로지와 어떻게 연결해 agent나 사람이 확인하게 하나? 그래프 DB에 세부 데이터를 다 적재하는 건 비효율적일 것 같은데, 노드마다 원천 데이터 위치나 참조 방법을 속성으로 두는 방향이 맞나?
- **답 요약**:
  - 방향이 맞다. 일반적인 설계도 "그래프에 다 넣지 않는다"이다. 그래프에는 **개체와 관계(뼈대)** 를 두고, 대량의 세부 값은 원천에 둔 채 **어디서 어떻게 가져오는지**를 연결한다.
  - 데이터 종류별:
    - **RDB(MES · CMMS 등)**: 마스터성 개체(설비, 부품, 작업)와 관계만 그래프로 올린다. 측정값 · 이력 테이블은 RDB에 두고, 온톨로지 클래스와 테이블 · 컬럼의 매핑을 정의해 필요할 때 SQL로 조회한다. 이 방식의 표준 이름이 **OBDA(Ontology-Based Data Access)**, 가상 KG(virtual KG)이고, W3C R2RML이 매핑 표준, Ontop이 대표 구현이다. NVIDIA Auto Ontology(Q019)도 "개념 ↔ 테이블 · 컬럼 매핑 + text-to-SQL"이라 같은 계열이다.
    - **엑셀 2만 개**: 파일마다 `Dataset` 노드(경로, 담당자, 시트 · 컬럼 스키마, 대상 설비 · 기간)를 만들어 개체와 연결한다(데이터 카탈로그). 값은 Parquet로 정리해 DuckDB 등으로 조회하고, 그래프에는 요약 지표나 핵심 사실만 올린다(30장 "넓은 표 → 긴 표 → 엔터티와 관계만").
    - **문서 · 회의자료**: Document → Chunk(텍스트 · 벡터) → 언급된 개체로 잇는 lexical graph. 본문은 청크로 두고, 그래프에는 추출 · 검증된 사실만 올린다.
  - 노드에 두는 참조 예: `source_system: CMMS`, `source_key: WO-1042`, 또는 `(:Equipment)-[:HAS_DATA]->(:Dataset {uri, query_template})`. 속성 하나에 다 넣기보다 Dataset · Table 노드로 빼는 편이 여러 개를 다룰 때 깔끔하다.
  - agent 관점: ① 그래프로 개체와 관계를 찾고(어느 설비, 어느 작업) ② 연결된 Dataset · 테이블의 조회 방법으로 세부 값을 가져오고 ③ 문서 청크로 설명 근거를 붙인다. GraphRAG와 text-to-SQL을 도구로 묶는 구조이고, 발표 3(조회 · agent)의 주제와 이어진다.
  - 실무 도구 예: 데이터 카탈로그(DataHub, OpenMetadata), 시맨틱 레이어(dbt Semantic Layer 등), OBDA(Ontop).
- **키워드**: OBDA, virtual knowledge graph, R2RML, Ontop, data catalog, semantic layer, lexical graph, GraphRAG, text-to-SQL, 데이터 가상화
- **반영 후보**: 30장 보강 또는 "실제 데이터 연결" 장 신설 검토. 발표 3과 경계 조율 필요.
- **출처**:
  - Xiao et al., "Ontology-Based Data Access: A Survey", IJCAI 2018
  - W3C, *R2RML: RDB to RDF Mapping Language* (2012)
  - Ontop 문서(ontop-vkg.org)
  - Neo4j GraphRAG Python 문서(lexical graph)

## Q019. Auto Ontology는 DB를 분석해 온톨로지를 자동으로 만드는 서비스인가? 내부적으로 어떻게 만드나? `[ ]`
- **질문**: auto ontology는 기존에 정의된 DB를 분석해 온톨로지를 자동으로 만들어 주는 서비스로 이해했는데 맞나? 내부적으로 어떻게 만들고 스키마 · 구조는 어떻게 짜나? 우리 구축에 힌트를 얻을 수 있나? 실제로 어떻게 구축하는지 조사.
- **답 요약**:
  - 대체로 맞다. NVIDIA Auto Ontology는 2026년 11월 공개된 오픈소스(Apache 2.0) Python 프레임워크다. **RDB 메타데이터에서 시맨틱 레이어(용어 · 매핑 · 관계 · 지표) 초안을 만들고, 사람이 인증하고, agent가 그걸로 text-to-SQL 답을 만든다.** 문서(비정형) 수집은 공개 문서에 없다.
  - 입력: 테이블 · 컬럼 · 키 · 뷰, (지원되면) 쿼리 이력, 테이블당 표본 행 최대 1,000개, 저카디널리티 컬럼의 고유값, 용어집. PostgreSQL · MySQL · Snowflake · Databricks · DuckDB 등 10종.
  - 만드는 방식(공개 architecture 문서 기준):
    - 테이블별: 표본으로 고유 컬럼 판정(95% 이상 고유) → LLM이 외래키 · 연결 테이블 후보 → LLM이 컬럼 설명과 "용어(term)" 이름 · 설명 · 동의어 작성 → 임베딩.
    - 테이블 간: 같은 스키마 사본을 규칙으로 묶음(term family) → 외래키 컬럼을 어느 용어에 연결할지 임베딩 + LLM으로 고르고, **실제 조인이 행을 돌려줄 때만 저장**(데이터로 검증) → 쿼리 이력에서 자주 쓰는 SQL 식을 "SQL 속성(지표)"으로 제안.
    - 규칙(결정적) 부분과 LLM 부분이 명확히 나뉜다. 표본 · 형식 · 조인 확인은 규칙, 이름 · 설명 · 관계 제안은 LLM.
  - 결과 구조: OWL 같은 형식 온톨로지가 아니라 Postgres + pgvector에 저장되는 용어, 컬럼 속성, SQL 속성, 의미적 외래키, 인증 상태다. 이름은 "온톨로지"지만 실체는 **시맨틱 레이어**에 가깝다.
  - 인증(Certify): 사람이 실제 질문으로 시험해 보고 용어 · 설명 · SQL을 고친 뒤 인증 표시를 한다. 공식 문서 스스로 "인증은 UI와 검색 결과에 검토됨을 표시할 뿐 agent의 조회 방식은 바꾸지 않는다"고 적고 있다. 게이트가 아니라 배지다.
  - 우리에게 주는 힌트:
    - ① 정형 데이터는 "DB 스키마 + 표본 + 쿼리 이력"에서 초안을 만들 수 있다. 우리 MES · CMMS에 그대로 적용할 수 있는 발상이다.
    - ② LLM 제안은 데이터로 검증한다(조인이 실제로 맞는지 확인). 우리 검증 단계의 원천 대조와 같은 원리다.
    - ③ 지표 · 계산식(SQL 속성)도 온톨로지의 일부로 관리한다. 엑셀의 계산 규칙을 정의 파일에 넣는 근거가 된다.
    - ④ 사람 인증 단계를 두되, 인증이 실제로 무언가를 막도록(게이트) 만드는 건 우리가 설계해야 한다.
    - ⑤ 문서(회의록 · 메일)는 이 도구가 다루지 않으므로 우리 파이프라인(추출 · 검증)이 따로 필요하다.
  - 상세 조사는 `study/auto_ontology.md`.
- **키워드**: NVIDIA Auto Ontology, semantic layer, text-to-SQL, schema profiling, query history mining, semantic foreign key, certification, pgvector, ReAct agent
- **반영 후보**: 29장 노트 보강("인증은 배지"라는 공식 문서 문구, 문서 미지원). 28장 "DB에서 끌어내는 방식"의 구체 예.
- **출처**:
  - NVIDIA/auto-ontology GitHub README · docs/architecture.md (github.com/NVIDIA/auto-ontology)
  - Marginalia, "Automatic Ontology Engineering: Reading NVIDIA's Auto-Ontology at the Source" (icorer.com, 2026-11), 제3자 코드 분석

## Q020. Apache Airflow와 DAG 버전, 핵심만 `[ ]`
- **질문**: Apache Airflow나 DAG 버전은 잘 모르는 부분이다. 발표자료에 넣을 필요는 없지만 알아야 할 것 같다. 핵심 위주로 정리.
- **답 요약**:
  - Airflow는 작업 흐름을 **Python 코드로 정의하고, 정해진 때에 실행 · 재시도 · 기록**해 주는 오케스트레이터다. 데이터를 직접 처리하는 도구가 아니라 "언제, 어떤 순서로, 무엇을 돌릴지"를 관리한다.
  - DAG(Directed Acyclic Graph)는 작업(task)과 순서(의존성)의 묶음이다. 예: 수집 → 정제 → 추출 → 검증 → 적재. 순환이 없어야 한다.
  - 꼭 알아야 할 개념: task와 operator, 스케줄(cron · 이벤트), 재시도, backfill(과거 기간 재실행), 멱등성(다시 돌려도 같은 결과), XCom(작업 간 작은 값 전달), Asset(데이터 기반 트리거).
  - Airflow 3(2025년 4월 정식 출시)의 변화: Dataset이 **Asset**으로 이름이 바뀌었고, 외부 이벤트로 DAG를 깨우는 **Watcher**가 생겼고, **DAG 버전 관리**가 들어왔다. 실행은 시작할 때의 DAG 코드 버전에 묶이고 UI에서 버전별로 볼 수 있다(Git 번들이면 이전 버전 재실행까지).
  - 우리 파이프라인에서의 의미: 소스별 DAG, 실패한 문서 격리와 재시도, 실행마다 원본 · 온톨로지 · 프롬프트 버전 기록(25 · 26장).
  - 대안: Dagster(자산 중심), Prefect, 규모가 작으면 cron + 스크립트. 상세는 `study/airflow_dag.md`.
- **키워드**: orchestration, DAG, task, operator, scheduler, executor, backfill, idempotency, XCom, Asset, Watcher, DAG versioning, DAG bundle
- **반영 후보**: 없음(학습용). 25장 노트의 Airflow 문장 점검 정도.
- **출처**:
  - Apache Airflow 공식 문서(airflow.apache.org/docs) · "Airflow 3.0 is here" 블로그(2025-04)
  - Astronomer, "Intro to Airflow 3"
