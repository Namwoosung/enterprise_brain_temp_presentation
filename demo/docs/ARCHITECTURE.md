# 구조

```
 (별도 설치)                 (이 저장소)                                   (이 저장소 밖)
┌──────────────┐  bolt  ┌───────────────────────────────────┐  HTTP  ┌─────────────────────┐
│ Neo4j         │◀──────▶│ pipeline/   단계 모듈              │───────▶│ OpenAI 호환 LLM 서버 │
│ :7687 bolt    │        │ server/app.py                      │ /v1/*  │ (vLLM · 사내 · 프록시)│
│ :7474 Browser │◀─HTTP──│   :8800 웹 + API                   │        └─────────────────────┘
└──────────────┘        │   :8801 Browser 중계 (iframe 허용)   │
                        │ web/  ontology/  data/  runs/       │
                        └───────────────────────────────────┘
```

## 단계와 산출물
각 단계는 앞 단계의 산출물(`runs/<input>/<step>.json`)을 읽고 자기 산출물을 씁니다. 웹은 이 파일을 그대로 화면에 그립니다.

| 단계 | 모듈 | 입력 → 출력 | 핵심 |
|---|---|---|---|
| 수집 | `collect.py` | md 파일 → 수집 기록 | 원본 무수정 · sha256 · 버전 |
| 정제 | `clean.py` | 원문 → 조각(chunk) · 정규화 표 · 언급 | 메일: 회신 체인·인용·서명·고지문 제거 / STT: 화자·간투사·반복·불명확·발음 복원 / 상대 날짜 / 사전 스캔 |
| 추출 | `extract.py` + `llm.py` | 조각 → 사실 후보 · 온톨로지 밖 관계 · 모르는 용어 · 지시어 | 온톨로지에서 만든 관계 목록으로 출력 제한, JSON 모드, 녹화/재생 |
| 연결 | `resolve.py` | 표현 → 개체 uid | 별칭 → 맥락 → 회사명으로 제품 지칭 → 유사도, 임계값 2개, 새 개체 |
| 검증 | `validate.py` | 후보 → 승인 · 보류 · 거절 · 온톨로지 후보 · 질문 | 스키마 · 개체 · 근거 문장 · 기사 대조 · 확신도 |
| 적재 | `load.py` + `graph.py` | 판정 → Neo4j | 변경 계획(staging) → 반영(publish) → 재계획 0 확인 |
| 비교 | `diff.py` | Neo4j → diff · 제안 · CQ | run 0 대비, `runs/ontology.v1.1.proposal.yaml` |

## 그래프 모델 (Neo4j)
- **개체**: `Company · Product · Technology · Country · Policy` — 키는 `uid`(`<Class>:<code>`), 유니크 제약
- **문서**: `(:Document)-[:HAS_CHUNK]->(:Chunk)-[:MENTIONS]->(개체)` — 근거를 따라갈 수 있는 어휘 그래프
- **사실 관계**: `SUPPLIES`, `USES_TECH` 등에 다음 속성을 둡니다.
  - `certainty`
  - `sources`: 문서 id와 기사 id
  - `evidence`: 조각 id
  - `first_run`, `last_run`
- **상태 변경**: `Product.status`를 바꾸고 `status_prev`, `status_changed_run`, `status_sources`를 남깁니다. 이전 값을 지우지 않습니다.
- **운영 노드**
  - `(:ReviewItem {kind: hold | question | new_entity})-[:ABOUT]->(개체)`, `-[:FROM_CHUNK]->(:Chunk)`
  - `(:OntologyCandidate {kind: relation | term})-[:ABOUT]->(개체)`, `-[:SEEN_IN]->(:Chunk)`
- **표시용 라벨**: `DiffNew · DiffChanged · DiffHold` — Browser 색칠 전용이고 run 0 이후 누적입니다. 데이터 의미는 없습니다.
- **`DemoMeta`**: `reset.py`가 데모 DB인지 확인하는 표식. 다른 데이터가 있는 DB는 `--force` 없이는 지우지 않습니다.

## 전 / 후를 구분하는 법
Community 에디션은 사용자 DB가 1개입니다. 그래서 DB를 나누지 않고 다음 값으로 구분합니다.
- 노드: `run_id`
- 관계: `first_run`
- 상태: `status_changed_run`

run 0의 CQ 답은 초기화 때 `runs/cq_run0.json`으로 저장합니다.

## 포트
| 포트 | 무엇 | 설정 |
|---|---|---|
| 8800 | 데모 웹 · API | `DEMO_PORT` |
| 8801 | Neo4j Browser 중계 | `BROWSER_PROXY_PORT` |
| 7474 / 7687 | Neo4j HTTP / bolt | `NEO4J_HTTP_URL` / `NEO4J_URI` |
| (예) 10000 | LLM 서버 | `LLM_BASE_URL` |

Browser 중계(:8801)는 Neo4j가 보내는 `X-Frame-Options: DENY`와 `Content-Security-Policy` 헤더만 빼고 나머지를 그대로 전달합니다. 그래서 웹(:8800)이 iframe으로 띄울 수 있습니다. **로컬 데모용**이라 127.0.0.1에만 열립니다.
