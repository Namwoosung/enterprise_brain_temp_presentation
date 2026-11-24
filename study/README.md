# 학습 자료

발표 준비 중 나온 질문([../qna_notes.md](../qna_notes.md))을 주제별로 다시 엮은 학습 자료입니다. 처음부터 순서대로 읽으면 "무엇을 만드나 → 어떻게 모으나 → 어떻게 다듬나 → 어떻게 뽑고 거르나 → 어디에 두고 어떻게 쓰이나 → 어떻게 돌리나" 흐름이 됩니다.
각 장 끝에 확인 질문(답은 접혀 있음)과 덱의 관련 장 번호가 있습니다.

## 읽는 순서
| 장 | 문서 | 다루는 것 | 바탕 질문 |
|---|---|---|---|
| 1 | [01_kg_and_ontology.md](01_kg_and_ontology.md) | TBox/ABox, RDF · OWL · 속성 그래프 · YAML 구분, agent용 KG, 비전문가의 온톨로지 시작법, 표현 방식 다섯 가지와 우리 선택 | Q001 · Q002 · Q010 · Q012 · Q025 · Q026 · Q037 |
| 2 | [02_collect_and_store.md](02_collect_and_store.md) | MES · CMMS, 수집 방식 선택, 복사 vs 참조, 저장 계층, 기준 KG, 문서 파싱 · 데이터 계약 | Q003 · Q005 · Q022 · Q024 · Q028 · Q031 |
| 3 | [03_clean_and_resolve.md](03_clean_and_resolve.md) | 정규화 층, 사람은 기준을 고친다, Entity Resolution, 임베딩 후보 · 능동 학습 | Q006 · Q007 · Q011 · Q029 · Q033 |
| 4 | [04_extract_and_validate.md](04_extract_and_validate.md) | 추출 방법 선택, 정의 파일 → 검사 장치, 구조화 출력, 검증 순서, 사람 라우팅, 질문 큐, LLM 판정 보정 | Q012 · Q013 · Q015 · Q017 · Q023 · Q027 · Q034 |
| 5 | [05_load_and_use.md](05_load_and_use.md) | 방법론 vs DB, 저장 방식 선택, 실제 데이터 연결, 근거 · 시간 · 계보, MCP · 혼합 검색 | Q014 · Q016 · Q018 · Q030 · Q032 · Q035 · Q036 |
| 6 | [06_tools_and_operations.md](06_tools_and_operations.md) | Auto Ontology에서 가져올 것, Airflow · DAG, 평가 운영, 버전 관리 | Q019 · Q020 |

## 깊이 보는 자료
| 문서 | 내용 | 관련 |
|---|---|---|
| [ontology_formats.md](ontology_formats.md) | 같은 예를 YAML · JSON Schema · Cypher · OWL · RDF · SHACL로 각각 적어 비교, KG 구축 방식 다섯 가지의 구현(같은 질문을 SPARQL · Cypher · LinkML · R2RML · GraphRAG로)과 장단점, 이 발표가 고른 이유 | 1장 · Q025 · Q037 |
| [pipeline_build_guide.md](pipeline_build_guide.md) | 이 발표의 방식으로 전체 파이프라인을 실제로 만드는 법: 정의 파일 · 생성기 · 단계별 코드 예 · 고려할 점 · 운영 · 도입 순서 · 점검표 · 데모 대응표 | 1~6장 전체 · Q037 |
| [auto_ontology.md](auto_ontology.md) | NVIDIA Auto Ontology 내부 동작 상세 조사 | 6장 · Q019 |
| [airflow_dag.md](airflow_dag.md) | Airflow 용어 표, Airflow 3 변화, 우리 파이프라인 DAG 예시 | 6장 · Q020 |

## 참고 (학습 정리에서는 제외)
- [licenses.md](licenses.md): 도구 · 플랫폼 · 모델 라이선스와 주의사항(Q021)
- Q004 · Q008 · Q009 · Q021은 `qna_notes.md`에 "(정리 미포함)"으로 표시되어 위 장에 넣지 않았습니다.

## 고치는 방법
- 새 질문은 `qna_notes.md` 끝에 다음 Q 번호로 추가하고, 이 폴더의 해당 장에 내용을 엮습니다(새 주제면 새 장 또는 깊이 보는 자료).
- 학습 정리에서 빼려면 `qna_notes.md`의 그 항목 제목 뒤에 "(정리 미포함)"을 붙입니다.
