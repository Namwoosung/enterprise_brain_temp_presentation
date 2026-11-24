# 온톨로지 · KG 구축 파이프라인 구현 가이드

이 발표가 고른 방식으로 실제 시스템을 만든다고 할 때, **무엇을 어떻게 구현하고 무엇을 고려해야 하는지**를 단계별로 정리한 문서입니다.
- 이 발표가 고른 방식: 정의는 YAML + Git, 데이터는 속성 그래프, 대량 값은 원천 참조, 문서는 스키마를 고정한 LLM 추출. 덱 2c장, [ontology_formats.md](ontology_formats.md) 4절에 이유가 있습니다.
- 예시 도메인은 덱과 같은 **설비 정비**(MES · CMMS · 정비 보고서 · 회의록 · 메일)입니다. 값은 모두 교육용 가상 데이터입니다.
- `demo/` 폴더는 같은 구조의 축소판입니다. 도메인은 반도체 · AI 뉴스로 다릅니다. 각 절 끝의 "데모에서는"에 대응 파일을 적었습니다.
- 관련 질문: Q037(이 문서를 만든 질문) · 바탕 질문 Q005 · Q011 · Q012 · Q013 · Q015 · Q016 · Q017 · Q018 · Q020 · Q023 · Q027 · Q030~Q036

---

## 목차
0. [먼저 정할 것](#0-먼저-정할-것)
1. [전체 구조](#1-전체-구조)
2. [정의 층: 온톨로지 파일과 생성기](#2-정의-층-온톨로지-파일과-생성기)
3. [수집](#3-수집)
4. [정제와 개체 연결(ER)](#4-정제와-개체-연결er)
5. [추출](#5-추출)
6. [검증과 사람 검토](#6-검증과-사람-검토)
7. [적재](#7-적재)
8. [평가](#8-평가)
9. [운영: 자동화 · 버전 · 모니터링 · 보안](#9-운영-자동화--버전--모니터링--보안)
10. [조회 쪽에 넘겨줄 것](#10-조회-쪽에-넘겨줄-것)
11. [도입 순서](#11-도입-순서)
12. [흔한 실수와 점검표](#12-흔한-실수와-점검표)
13. [데모 코드 대응표](#13-데모-코드-대응표)

---

## 0. 먼저 정할 것

코드를 쓰기 전에 아래 다섯 가지를 문서 한 장으로 정합니다. 이게 흔들리면 뒤의 모든 단계가 다시 바뀝니다.

| 정할 것 | 예시 (설비 정비) | 왜 먼저인가 |
|---|---|---|
| **업무 질문(CQ) 5~10개** | "FAB-A EQ-017의 최근 90일 PT-V42 교체 이력과 그 이유는?" · "같은 알람이 반복된 설비와 공통 부품은?" | 온톨로지 범위와 평가 기준이 둘 다 여기서 나옴(28 · 24장) |
| **원천 목록과 기준 시스템** | 설비 마스터 = MES, 작업 · 부품 = CMMS, 판단 · 원인 = 보고서 · 회의록 | 값이 다를 때 누가 이기는지(`official`) |
| **ID 규칙** | `Equipment:FAB-A/EQ-017`, `MaintenanceWork:WO-1042` | 한번 정하면 바꾸기 가장 어려움 |
| **사람 검토 기준** | 위험도 높음(안전 · 품질) + 확신 낮음 → 사람 | 검토 큐 용량을 미리 가늠 |
| **그래프에 올릴 것 / 원천에 둘 것** | 설비 · 작업 · 부품 · 관계는 그래프, 센서 값 · 상태 이력은 원천 | 저장 용량 · 동기화 설계가 갈림(23b장) |

**고려할 점**
- CQ는 "그래프가 답해야 하는 질문"입니다. "보고서 요약해 줘"처럼 검색으로 충분한 질문은 빼도 됩니다.
- 기준 시스템을 못 정한 값은 "우선 기록하되 어느 쪽 값인지 출처를 붙인다"로 시작합니다. 억지로 하나를 고르지 않습니다.

---

## 1. 전체 구조

### 1.1 흐름과 저장소
```
 원천                     파이프라인 (배치 · 이벤트)                              저장소
 ────                     ──────────────────────────                              ──────
 MES · CMMS (DB)  ─┐
 엑셀 · CSV       ─┼─▶ ① 수집 ─▶ ② 정제 · ER ─▶ ③ 추출 ─▶ ④ 검증 ─▶ ⑤ 적재 ─▶  속성 그래프 (조회 사본)
 문서 · 회의록    ─┤      │           │            │          │  └─▶ 검토 큐     │
 메일 · STT       ─┘      ▼           ▼            ▼          ▼                  ▼
                       원본 저장소    정규화 결과    후보 사실   판정 기록      ⑥ 평가 (CQ · 표본 · 골든셋)
                       (변경 불가)    (Parquet)    (JSONL)    (원장)

 정의 (Git): ontology.yaml · lexicon.yaml · mappings/*.yaml · prompts/ · cq/  ──▶ 생성기 ──▶ JSON Schema · 검증 규칙표 · DB 제약
```

| 저장소 | 담는 것 | 기술 예 | 지우나 |
|---|---|---|---|
| 정의 저장소 | 온톨로지 · 사전 · 매핑 · 프롬프트 · CQ | Git | 안 지움 (태그로 버전) |
| 원본 저장소 | 받은 그대로의 파일 · 응답 | 객체 저장소(S3 호환) · 공유 폴더 | 안 지움 (보존 기간 정책만) |
| 중간 결과 | 정규화 문서 · 조각 · 후보 사실 | Parquet · JSONL (실행 ID별 폴더) | 오래된 실행만 정리 |
| 원장 | 수집 기록 · 판정 · 검토 이력 · 실행 기록 | 처음엔 JSONL/SQLite, 커지면 PostgreSQL | 안 지움 |
| 조회 사본 | 검증된 개체 · 관계 · 근거 ID | 속성 그래프 DB (Neo4j 등) | 언제든 다시 만들 수 있음 |
| 검색 인덱스 | 조각 텍스트 · 벡터 | 그래프 DB 벡터 인덱스 · 별도 벡터 DB | 다시 만들 수 있음 |

**핵심 원칙**: 그래프는 "원본 + 정의 + 파이프라인 + 판정 기록"으로 언제든 다시 만들 수 있어야 합니다(26장의 `KG = f(…)`). 그래서 그래프 DB는 백업 대상이 아니라 재구축 대상입니다. 판정 기록(원장)은 다시 만들 수 없으므로 꼭 백업합니다.

### 1.2 저장소(코드) 구조 예
```
kg-pipeline/
├─ ontology/
│  ├─ ontology.yaml          # 클래스 · 관계 · 키 · 허용 값 · 기준 시스템 (정의의 원본)
│  ├─ lexicon.yaml           # 표준어 · 동의어 · 오타 · 발음 표기
│  └─ CHANGELOG.md           # 버전별 변경 이유
├─ mappings/                 # 정형 원천 → 온톨로지 매핑 (테이블 · 컬럼)
│  ├─ cmms_work_order.yaml
│  └─ mes_equipment.yaml
├─ prompts/
│  ├─ extract_report.md      # 추출 프롬프트 (예시 포함)
│  └─ fewshot/               # 사람 판정에서 고른 예시
├─ cq/                       # 업무 질문 테스트 (질문 · Cypher · 기대 결과)
├─ gen/                      # 생성기: ontology.yaml → schema.json · rules.json · constraints.cypher
├─ pipeline/
│  ├─ collect/  clean/  resolve/  extract/  validate/  load/  evaluate/
│  └─ common/                # ID 규칙 · 실행 기록 · 설정
├─ dags/                     # 오케스트레이션 (Airflow 등)
├─ tests/                    # 단위 테스트 + 정의 일관성 테스트
└─ .env.example              # 접속 정보 형식만 (실제 값은 커밋하지 않음)
```

### 1.3 기술 선택 (작게 시작 → 키울 때)
| 영역 | 처음 | 키울 때 | 고르는 기준 |
|---|---|---|---|
| 오케스트레이션 | cron + Python 스크립트 | Airflow · Dagster · Prefect | 원천 수 · 재시도 · 백필 필요성 |
| 중간 결과 | 로컬 Parquet · JSONL | 객체 저장소 + DuckDB · Spark | 데이터 양 |
| 원장 | SQLite · JSONL | PostgreSQL | 동시 사용자(검토자) 수 |
| 그래프 | Neo4j Community (단일) | Neo4j Enterprise · Memgraph · Neptune | 노드 키 · 다중 DB · 백업 · 권한 |
| LLM | vLLM + 오픈웨이트 모델 (OpenAI 호환 API) | 모델 여러 개 라우팅 | 보안(사내 실행) · 비용 · 품질 |
| ER | 규칙 + 사전 | Splink (확률적 연결) | 레코드 수 · 오타 다양성 |
| 문서 파싱 | 텍스트 · 마크다운 변환 | Docling 등 레이아웃 파서 | PDF · 표 비중 |

**고려할 점**: 처음부터 큰 도구를 다 깔지 않습니다. "같은 입력이면 같은 결과", "단계별 중간 결과가 파일로 남음" 두 가지만 지키면 나중에 도구를 바꿔도 코드 대부분이 그대로입니다.

**데모에서는**: `demo/pipeline/`에 단계별 파일, `demo/runs/`에 실행별 중간 결과, 정의는 `demo/ontology/`.

---

## 2. 정의 층: 온톨로지 파일과 생성기

### 2.1 온톨로지 파일
덱 17a장의 블록 구성을 그대로 따릅니다. 한 파일에 "무엇이 있나"와 "어떻게 쓰이나"를 같이 둡니다.

```yaml
# ontology/ontology.yaml
version: 1.2.0
name: fab-maintenance

classes:
  Equipment:
    label_ko: 설비
    key: [fab, code]                    # uid = "Equipment:FAB-A/EQ-017"
    required: [fab, code, model]
    official: MES                       # 속성 값이 다르면 MES가 기준
    description: "FAB 안의 개별 장비 한 대. 같은 코드라도 FAB가 다르면 다른 설비."
    exact_match: null                   # 외부 표준 IRI (나중에 RDF로 내보낼 때)
  MaintenanceWork:
    label_ko: 정비 작업
    key: [wo_id]
    required: [wo_id, status, started_at]
    enums: {status: [planned, in_progress, completed, cancelled]}
    official: CMMS
  PreventiveWork:
    label_ko: 예방 정비
    parent: MaintenanceWork             # 적재 때 두 라벨을 함께 붙임 (OWL subClassOf 대신)
  PartType:
    label_ko: 부품 종류
    key: [part_no]
    official: CMMS
  Alarm:
    label_ko: 알람
    key: [eq_uid, code, raised_at]
  Document:  {label_ko: 문서, key: [doc_id], required: [doc_id, kind, title]}
  Chunk:     {label_ko: 문서 조각, key: [chunk_id], required: [chunk_id, text]}
  Dataset:   {label_ko: 원천 데이터 참조, key: [system, table, key_value]}

relations:
  ON_EQUIPMENT:
    from: MaintenanceWork
    to: Equipment
    cardinality: many_to_one            # 작업 하나 = 설비 하나
    official: CMMS
  USED_PART:
    from: MaintenanceWork
    to: PartType
    props: [qty]
    fact: true                          # 문서에서도 추출 대상
  CAUSED_BY:
    from: Alarm
    to: PartType
    fact: true
    risk: high                          # 품질 판단에 직결 → 확신 높아도 표본 검토
    certainty_required: true            # confirmed / suspected 필수
  HAS_DATA:   {from: Equipment, to: Dataset}
  HAS_CHUNK:  {from: Document, to: Chunk}
  MENTIONS:   {from: Chunk, to: "*"}

extraction:                             # LLM 추출에서만 쓰는 블록
  targets: [USED_PART, CAUSED_BY]
  examples:
    - text: "17호기 PT-V42 교체 후 알람 재발 없음. 원인은 밸브 마모로 추정."
      output:
        - {predicate: USED_PART, subject: "WO?", object: "PT-V42", certainty: confirmed}
        - {predicate: CAUSED_BY, subject: "ALM?", object: "PT-V42", certainty: suspected,
           evidence: "원인은 밸브 마모로 추정"}

review:                                 # 검토 기준 (22장)
  auto_approve: {min_confidence: 0.9, max_risk: medium, needs_source_match: true}
  sample_rate: {high: 0.2, medium: 0.05, low: 0.01}

out_of_scope:                           # 정의 밖 처리 (27장)
  unknown_relation: ontology_candidate  # 확장 후보 큐로
  unknown_term: question                # 질문 큐로
```

**버전 규칙** (semver처럼)
| 변경 | 버전 | 예 | 해야 할 일 |
|---|---|---|---|
| 설명 · 예시 · 동의어 추가 | patch (1.2.0 → 1.2.1) | 동의어 "호기" 추가 | 추출 캐시만 무효화 |
| 클래스 · 관계 · 허용 값 추가 | minor (1.2 → 1.3) | `REPLACED_BY` 관계 추가 | 영향받는 문서 재추출 |
| 키 · 이름 변경 · 삭제 · 개수 제약 강화 | major (1 → 2) | Equipment 키에 `line` 추가 | 이주 스크립트 + 전체 재구축 |

**고려할 점**
- **키(key)는 가장 신중하게.** 키가 바뀌면 uid가 바뀌고, 모든 관계 · 근거 · 검토 기록의 참조가 바뀝니다. 처음에 "FAB가 다르면 다른 설비인가?"를 전문가에게 꼭 확인합니다(28장 "예/아니오 질문").
- `description`은 사람용이자 LLM용입니다. 추출 프롬프트에 그대로 들어가므로 "무엇이 아닌지"도 적습니다("교체 예정은 USED_PART가 아님").
- `parent`로 계층을 표현하되 깊게 만들지 않습니다(2단계 이내). 깊은 계층 추론이 필요해지면 A 방식(OWL)을 다시 검토할 때입니다.

### 2.2 용어 사전
```yaml
# ontology/lexicon.yaml
Equipment:
  "Equipment:FAB-A/EQ-017":
    canonical: EQ-017
    aliases: [17호기, EQ17, "EQ 017", 일칠호기]      # 일칠호기 = STT 발음 표기
    context: [FAB-A, 식각]                          # 같은 별칭이 여러 설비일 때 가르는 단어
PartType:
  "PartType:PT-V42":
    canonical: PT-V42
    aliases: [V42 밸브, 42번 밸브, PTV42]
```
- 사전은 정의와 따로 버전을 올립니다(바뀌는 속도가 훨씬 빠름).
- 사람이 검토 화면에서 "이 표현은 EQ-017"이라고 고르면 **사전에 한 줄이 추가되는 PR**이 만들어지게 합니다(15장 "사람은 사전을 고친다").

### 2.3 생성기
정의 파일 하나에서 아래를 만듭니다. 생성물은 직접 고치지 않습니다.

| 생성물 | 쓰는 곳 | 만드는 방법 |
|---|---|---|
| LLM 출력 JSON Schema | 추출 (구조화 출력) | `extraction.targets`의 관계 → `predicate` enum, 클래스 → `subject_class` enum |
| 검증 규칙표 | 검증 1층 | 관계별 from/to · 개수 · 필수 · 허용 값 |
| DB 제약 · 인덱스 | 적재 | 클래스마다 uid 고유 제약, 자주 찾는 속성 인덱스 |
| 프롬프트의 정의 부분 | 추출 | 클래스 · 관계 설명과 예시를 글로 |
| (선택) SHACL · OWL | 외부 교환 | LinkML로 옮기거나 직접 생성 |

```python
# gen/schema.py — 정의 → LLM 출력 JSON Schema
import json, yaml

def extraction_schema(onto):
    rels = onto["relations"]
    targets = onto["extraction"]["targets"]
    return {
        "type": "object",
        "properties": {"facts": {"type": "array", "items": {
            "type": "object",
            "properties": {
                "predicate": {"enum": targets},
                "subject":   {"type": "string"},
                "object":    {"type": "string"},
                "props":     {"type": "object"},
                "certainty": {"enum": onto.get("certainty", ["confirmed", "suspected"])},
                "evidence":  {"type": "string", "minLength": 4},   # 원문에서 그대로 옮긴 문장
            },
            "required": ["predicate", "subject", "object", "certainty", "evidence"],
            "additionalProperties": False,
        }}},
        "required": ["facts"],
    }

def constraints_cypher(onto):
    out = []
    for cls in onto["classes"]:
        out.append(f"CREATE CONSTRAINT {cls.lower()}_uid IF NOT EXISTS "
                   f"FOR (n:`{cls}`) REQUIRE n.uid IS UNIQUE;")
    return "\n".join(out)

if __name__ == "__main__":
    onto = yaml.safe_load(open("ontology/ontology.yaml", encoding="utf-8"))
    json.dump(extraction_schema(onto), open("build/extract.schema.json", "w"), indent=2)
    open("build/constraints.cypher", "w").write(constraints_cypher(onto))
```

### 2.4 정의 CI (PR마다)
1. YAML 문법 · 필수 필드 검사 (`from` · `to`가 있는 클래스인지, `key`가 `required`에 있는지).
2. 생성기 실행 → 생성물이 바뀌면 PR에 diff로 보여 줌.
3. **기존 데이터 호환 검사**: 현재 그래프(또는 표본)가 새 정의의 검증 규칙을 통과하는지. major 변경이면 이주 스크립트가 있는지.
4. CQ 테스트를 표본 데이터로 실행 (8절).
5. 사전 충돌 검사: 같은 별칭이 서로 다른 개체에 있고 `context`로도 못 가르면 실패.

**데모에서는**: `demo/ontology/ontology.v1.yaml`(클래스 · 관계 · 키) · `lexicon.v1.yaml` · `phonetic.yaml`, 생성은 `pipeline/extract.py`의 `schema_text` · `pipeline/graph.py`의 `create_constraints`, 데이터 검사는 `scripts/check_data.py`.

---

## 3. 수집

### 3.1 커넥터 하나의 모양
원천마다 커넥터를 만들되 인터페이스는 같게 합니다.

```python
# pipeline/collect/base.py
from dataclasses import dataclass

@dataclass
class Item:
    source: str          # "cmms" · "sharepoint" · "mail"
    source_id: str       # 원천 안의 ID (WO 번호 · 파일 경로 · 메일 Message-ID)
    version: str         # 원천의 버전 · 수정 시각 · ETag
    content: bytes       # 받은 그대로
    media_type: str      # "application/json" · "application/pdf" · "message/rfc822"
    meta: dict           # 작성자 · 시각 · 권한 그룹 등

class Connector:
    name: str
    def list_changed(self, since_watermark) -> list[str]: ...   # 바뀐 것의 ID 목록
    def fetch(self, source_id) -> Item: ...
    def watermark(self) -> str: ...                             # 다음 실행의 기준점
```

### 3.2 원천별 방식
| 원천 | 방식 | 증분 기준 | 복사 vs 참조 |
|---|---|---|---|
| CMMS 작업지시 (DB) | 읽기 전용 계정으로 SQL, 또는 export 파일 | `updated_at > 워터마크` | 작업 · 부품 · 설비 연결은 복사, 상세 로그는 참조 |
| MES 설비 마스터 | 일 1회 전체 export | 해시 비교 | 복사 (작음) |
| MES 상태 이력 · 센서 | 가져오지 않음 | — | **참조만** (`Dataset` 노드) |
| 정비 보고서 (문서 시스템) | API · 공유 폴더 감시 | 수정 시각 · 버전 번호 | 원본 복사 (버전 고정) |
| 회의록 · STT | 업로드 창구(폴더 · 폼) | 새 파일 | 복사 |
| 메일 | 전용 수신함 · 전달 규칙 | Message-ID | 복사 (원천에서 지워질 수 있음) |
| 개인 엑셀 | 업로드 창구 | 파일 해시 | 복사 (덮어쓰기됨) |

**복사 기준**(Q005): 원천에서 **다시 꺼낼 수 없거나 덮어써지는 것은 복사**, 버전과 고정 ID가 있어 언제든 같은 것을 다시 꺼낼 수 있는 것은 **참조(시스템 · ID · 버전 · 해시)만** 남깁니다.

### 3.3 수집 기록 (원장)
받은 모든 것에 한 줄씩 남깁니다. 이게 "어디서 왔나"의 출발점입니다.
```json
{"ingest_id": "ing-20261124-0007", "run_id": "run-20261124-01",
 "source": "docsys", "source_id": "REPORT/2026/M-201", "version": "v3",
 "sha256": "9f2c…", "stored_at": "raw/docsys/2026/11/24/9f2c….pdf",
 "fetched_at": "2026-11-24T02:10:33Z", "acl": ["fab-a-maint"], "status": "new"}
```
- 같은 `sha256`이 이미 있으면 `status: duplicate`로 기록만 하고 다음 단계로 보내지 않습니다.
- `acl`(권한 그룹)을 수집 때 받아 두지 않으면 나중에 그래프에서 권한을 되살릴 수 없습니다.

**고려할 점**
- **원본은 절대 고치지 않습니다.** 잘못 들어온 것도 지우지 말고 `status: excluded`와 이유를 남깁니다.
- **시간대**: 원천마다 로컬 시각 · UTC가 섞입니다. 수집 때 모두 UTC + 원래 시간대를 함께 저장합니다.
- **개인정보**: 메일 · 회의록에는 이름 · 연락처가 있습니다. 원본 저장소 접근 권한을 좁히고, 추출 대상이 아닌 개인정보는 정제 단계에서 가립니다.
- **데이터 계약**(Q031): 정형 원천은 "컬럼 · 형식 · 허용 값"을 원천 담당자와 약속하고 수집 때 자동 검사합니다. 계약 위반은 수집 실패로 처리해 조용히 잘못된 데이터가 들어오지 않게 합니다.

**데모에서는**: `pipeline/collect.py`(입력 파일을 실행 폴더로 복사하고 해시 기록), 입력 정의는 `data/inputs/`.

---

## 4. 정제와 개체 연결(ER)

### 4.1 정제 순서
1. **형식 변환**: PDF · DOCX → 구조가 있는 텍스트(제목 · 표 · 페이지 위치 유지). 표가 많으면 레이아웃 파서(Docling 등, Q028).
2. **잡음 제거**: 메일 서명 · 이전 메일 인용 · 회의록의 "음 · 어" · 반복 머리글.
3. **정규화**: 날짜("어제", "11/3") → 문서 날짜 기준 절대 날짜, 단위(`bar` · `psi`), 코드 표기(`EQ 017` → `EQ-017`).
4. **조각내기**(청킹): 제목 · 문단 단위, 너무 길면 겹치게 자름. 조각마다 `chunk_id`, 문서 내 위치(페이지 · 문단 · 문자 범위)를 남깁니다.
5. **언급 찾기**: 사전으로 조각 안의 설비 · 부품 표현을 찾고 위치를 기록.

정제의 모든 변경은 "원래 글 → 바뀐 글 · 규칙 이름 · 위치"로 남깁니다. 나중에 근거를 원문 위치로 되돌릴 때 필요합니다.
```json
{"chunk_id": "M-201#p3-2", "op": "resolve_date", "rule": "relative_day",
 "from": "어제", "to": "2026-11-23", "span": [41, 43]}
```

### 4.2 개체 연결(ER)
같은 대상을 같은 uid로 묶는 단계입니다(16장). 정형 레코드와 문서 표현을 나눠서 다룹니다.

| 대상 | 방법 | 예 |
|---|---|---|
| 정형 ↔ 정형 (CMMS 설비 코드 ↔ MES 설비) | 키 일치 → 안 맞으면 규칙(대소문자 · 하이픈) → 그래도 남으면 Splink | `eq_code='EQ17'` ↔ `EQ-017` |
| 문서 표현 → 기존 개체 | 사전 일치 → `context`로 후보 좁히기 → 임베딩 후보 + 재정렬(Q029) → 애매하면 사람 | "17호기" + 문서에 "FAB-A" → `Equipment:FAB-A/EQ-017` |
| 처음 보는 대상 | 새 uid 후보로 두고 검토 큐 | "신규 V50 밸브" |

```python
# pipeline/resolve/link.py — 문서 표현을 개체로 (단순화한 예)
def link(mention, chunk, lex, index):
    cands = lex.lookup(mention.text)                 # 사전 별칭 일치
    if len(cands) > 1:                               # 같은 별칭이 여러 개체
        cands = [c for c in cands if lex.context_hit(c, chunk.text)]
    if len(cands) == 1:
        return {"decision": "link", "uid": cands[0], "method": "lexicon", "score": 1.0}
    if not cands:
        near = index.similar(mention.text, k=5)      # 임베딩 + 재정렬 후보
        if near and near[0].score >= 0.92 and near[0].score - near[1].score >= 0.1:
            return {"decision": "link", "uid": near[0].uid, "method": "embedding", "score": near[0].score}
        return {"decision": "review", "candidates": [n.uid for n in near]}
    return {"decision": "review", "candidates": cands}
```

**고려할 점**
- **합치기는 쉽고 나누기는 어렵습니다.** 확신이 없으면 합치지 말고 검토로 보냅니다. 잘못 합친 두 설비의 이력은 나중에 가르기 매우 어렵습니다.
- 병합 · 분할은 이력으로 남깁니다: `{"merged": ["Equipment:FAB-A/EQ17"], "into": "Equipment:FAB-A/EQ-017", "by": "reviewer-03", "at": …}`. 옛 uid로 들어오는 참조를 새 uid로 돌려줍니다.
- 사람이 고른 결과는 사전에 반영해 다음부터 자동으로 처리합니다. 미연결 표현을 **빈도순**으로 보여 주면 적은 검토로 많은 문서가 해결됩니다(롱테일, Q011).
- 임계값(위의 0.92 · 0.1)은 처음엔 보수적으로 잡고, 사람 판정이 쌓이면 정밀도 목표(예: 99%)에 맞춰 조정합니다(Q033 능동 학습).

**데모에서는**: `pipeline/clean.py`(`scan_mentions` 사전 매칭 · `near_misses` 유사 표현 · `restore_phonetic` 발음 표기 복원 · `resolve_dates` 상대 날짜), `pipeline/resolve.py`(연결 판정).

---

## 5. 추출

### 5.1 정형은 규칙 매핑
CMMS 같은 정형 원천은 LLM을 쓰지 않습니다. 매핑 파일로 "테이블 · 컬럼 → 클래스 · 속성 · 관계"를 적고 코드가 그대로 변환합니다.
```yaml
# mappings/cmms_work_order.yaml
source: cmms
table: work_order
row_id: wo_no
nodes:
  - class: MaintenanceWork
    key: {wo_id: wo_no}
    props: {status: {from: wo_status, map: {OPEN: planned, WIP: in_progress, DONE: completed, CNCL: cancelled}},
            started_at: {from: start_dt, tz: Asia/Seoul}}
relations:
  - type: ON_EQUIPMENT
    from: {class: MaintenanceWork, key: {wo_id: wo_no}}
    to:   {class: Equipment, key: {fab: site_cd, code: eqp_cd}, normalize: eq_code}
  - type: USED_PART
    from: {class: MaintenanceWork, key: {wo_id: wo_no}}
    to:   {class: PartType, key: {part_no: part_no}}
    props: {qty: used_qty}
    rows_from: work_order_part          # 1:N 하위 테이블
```
- 매핑에 없는 컬럼 값(`wo_status`의 새 코드)이 나오면 실패로 멈추지 말고 "정의 밖 값" 큐로 보냅니다.
- 정형 원천에서 온 사실은 `certainty: confirmed`, `sources: ["cmms:work_order#WO-1042@2026-11-24T02:10Z"]`.

### 5.2 문서는 고정 스키마 LLM 추출
**프롬프트 구성** (위에서 아래 순서)
1. 역할과 규칙: "원문에 있는 사실만, 추정은 suspected, 근거 문장을 그대로 옮겨라, 정의 밖 관계는 `ontology_candidate`로".
2. 정의 부분: 생성기가 만든 클래스 · 관계 설명(무엇이 아닌지 포함).
3. 이미 연결된 개체 목록: 정제 단계에서 찾은 uid와 표현. LLM이 새 이름을 지어내지 않게 합니다.
4. 예시 2~5개: `extraction.examples` + 사람 판정에서 고른 어려운 예.
5. 입력 조각.

**구조화 출력**(Q027): 형식은 프롬프트가 아니라 서버가 강제하게 합니다. vLLM의 OpenAI 호환 API 예:
```python
import json, requests
schema = json.load(open("build/extract.schema.json"))
body = {
    "model": "qwen-local",
    "temperature": 0,
    "messages": messages,
    "response_format": {"type": "json_schema",
                        "json_schema": {"name": "facts", "schema": schema, "strict": True}},
}
r = requests.post(f"{BASE_URL}/chat/completions", json=body, timeout=300).json()
facts = json.loads(r["choices"][0]["message"]["content"])["facts"]
```
- 서버 · 모델이 `json_schema`를 지원하지 않으면 `{"type": "json_object"}`로 낮추고, 응답을 받아 JSON Schema로 다시 검사합니다. 그래도 받은 응답 앞뒤의 `<think>` · 코드 펜스를 걷어 내는 파서는 두는 게 안전합니다.
- 생각 모드(thinking)가 있는 모델은 추출에서 끄는 게 보통 빠르고 형식도 안정적입니다(서버 옵션으로).

**출력 한 건의 모양**
```json
{"predicate": "CAUSED_BY", "subject": "ALM:FAB-A/EQ-017/E-221/2026-11-22T14:05",
 "object": "PartType:PT-V42", "certainty": "suspected",
 "evidence": "원인은 밸브 마모로 추정", "chunk_id": "M-201#p3-2", "span": [88, 99]}
```

### 5.3 재현성과 비용
- **호출 기록**: 요청 전체(모델 · 프롬프트 · 설정)의 해시를 키로 응답을 저장합니다. 같은 해시면 다시 호출하지 않습니다. 프롬프트 · 정의 · 모델이 바뀌면 해시가 바뀌어 자동으로 다시 호출됩니다.
- **모델 고정**: 모델 이름뿐 아니라 가중치 버전(파일 해시) · 서버 버전 · `temperature`를 실행 기록에 남깁니다.
- **조각 크기**: 너무 크면 사실을 놓치고, 너무 작으면 앞뒤 문맥(누가 · 어느 설비)을 잃습니다. 조각에 문서 제목 · 날짜 · 연결된 설비를 머리말로 붙이면 작게 잘라도 문맥이 유지됩니다.
- **비용 · 시간 추정**: 문서 수 × 조각 수 × (입력 + 출력 토큰). 처음 전체 구축은 배치로 밤에, 이후엔 새 문서만.

**고려할 점**
- LLM 출력은 **항상 후보**입니다. 바로 그래프에 넣지 않습니다(19장).
- `suspected`를 `confirmed`로 올리는 건 LLM이 아니라 검증(원천 대조 · 사람)입니다(18장).
- `evidence`가 원문에 실제로 있는지는 다음 단계에서 문자열로 확인합니다. LLM이 근거를 "다듬어" 쓰는 경우가 많습니다.

**데모에서는**: `pipeline/extract.py`(`schema_text` · `known_entities_text` · `build_messages` · `normalize_output`), `pipeline/llm.py`(OpenAI 호환 호출 · `parse_json` · 프롬프트 해시로 "이전 호출 재생"), `config/` 아래 LLM 설정.

---

## 6. 검증과 사람 검토

### 6.1 네 층 (값싼 것부터)
| 층 | 검사 | 실패하면 | 예 |
|---|---|---|---|
| 1 스키마 | 관계 이름 · from/to 클래스 · 필수 · 허용 값 · 개수 | reject 또는 ontology_candidate | `USED_PART`의 대상이 설비 → reject |
| 2 연결 | subject · object가 실제 uid로 연결됐나 | question (질문 큐) | "그 밸브" → 무엇인지 모름 |
| 3 원문 | `evidence`가 조각에 그대로 있나, 부정 · 계획 표현인가 | reject 또는 hold | "교체 예정" → USED_PART 아님 |
| 4 원천 | 공식 시스템과 맞나 | 맞으면 confirmed, 다르면 hold | 보고서엔 PT-V42, CMMS 작업엔 PT-V41 → hold |

```python
# pipeline/validate/check.py — 3층 원문 확인 (단순화)
NEG = ("예정", "검토 중", "안 함", "하지 않", "필요 없")

def evidence_ok(fact, chunk_text):
    ev = fact["evidence"].strip()
    if ev not in chunk_text:                     # 그대로 옮기지 않았으면
        return "reject", "evidence_not_in_text"
    if fact["predicate"] == "USED_PART" and any(w in ev for w in NEG):
        return "reject", "planned_or_negated"
    return "pass", None
```

### 6.2 누구에게 보낼까: 위험도 × 확신도 (22장)
| | 확신 높음 (원천 일치 · 규칙) | 확신 낮음 (문서만 · suspected) |
|---|---|---|
| **위험 높음** (`risk: high`, 품질 · 안전) | 자동 승인 + 표본 검토 20% | **사람 필수** |
| **위험 낮음** | 자동 승인 + 표본 1~5% | 승인하되 `suspected` 유지, 주기적 표본 |

- 판정 결과는 `approve` · `hold` · `reject` · `ontology_candidate` · `question` 다섯 가지(데모와 같음).
- **사람 화면**에는 사실 한 줄, 근거 문장(원문 위치 하이라이트), 원천 값, 비슷한 과거 판정을 같이 보여 줍니다. "예 · 아니오 · 모름"으로 답하게 하면 처리 속도가 크게 빨라집니다.
- 사람 판정은 원장에 남기고 ① 임계값 조정 ② 사전 추가 ③ 프롬프트 예시 ④ 규칙(라벨링 함수)으로 다시 씁니다(Q033).

### 6.3 질문 큐와 확장 후보 큐 (27장)
- **질문 큐**: "11/3 회의의 '그 밸브'는 PT-V42인가?" 처럼 담당자가 답하면 풀리는 것. 답이 오면 해당 후보만 다시 검증해 적재합니다. 기한이 지나면 `expired`로 닫고 사실은 넣지 않습니다.
- **확장 후보 큐**: 정의 밖 관계 · 용어(`REPLACED_BY`가 자주 나옴). 빈도순으로 모아 정의 PR로 이어집니다.
- 두 큐 모두 **파이프라인을 멈추지 않습니다.** 보류 건은 큐에 두고 실행은 끝나며, 승인되면 다음 실행에서 반영합니다.

**LLM 판정을 쓸 때**(Q034): "이 근거가 이 사실을 뒷받침하나"를 LLM에 물을 수 있지만, 사람 판정 표본으로 일치율을 먼저 재고 **검토 순서를 정하는 데만** 씁니다. LLM 판정만으로 승인하지 않습니다.

**데모에서는**: `pipeline/validate.py`(`check_fact`: 스키마 · 연결 · 원문 · 뉴스 코퍼스 대조), 데모의 "원천"은 뉴스 코퍼스이고 실제 구축에서는 CMMS · ERP 같은 공식 시스템이 그 자리에 옵니다(파일 안 `CUSTOMIZE` 주석).

---

## 7. 적재

### 7.1 그래프 모델로 옮기는 규칙
| 정의 | 그래프 | 예 |
|---|---|---|
| 클래스 | 라벨 (+ `parent`면 라벨 둘) | `(:PreventiveWork:MaintenanceWork)` |
| `key` | `uid` 속성 + 고유 제약 | `uid: 'MaintenanceWork:WO-1042'` |
| 속성 | 노드 속성 | `status`, `started_at` |
| 관계 | 관계 타입 | `[:ON_EQUIPMENT]` |
| 관계의 `key` | MERGE 패턴의 관계 속성 | `[:USED_PART {lot:'L7'}]` |
| 근거 · 출처 | 관계 속성의 ID 목록 | `sources`, `evidence` (상세는 원장) |
| 확실성 · 기간 | 관계 속성 | `certainty`, `valid_from`, `valid_to` |
| 실행 정보 | 관계 · 노드 속성 | `first_run`, `last_run`, `onto_version` |

### 7.2 멱등 적재 (다시 넣어도 그대로)
노드를 먼저 키로 MERGE하고, 관계는 두 노드를 MATCH한 뒤 MERGE합니다. 패턴 전체를 한 번에 MERGE하면 노드가 중복 생성되는 함정이 있습니다.
```cypher
// 1. 노드
UNWIND $nodes AS n
MERGE (x:MaintenanceWork {uid: n.uid})
  ON CREATE SET x += n.props, x.first_run = $run
  ON MATCH  SET x += n.props
// 2. 관계 (근거는 합집합으로)
UNWIND $rels AS r
MATCH (a {uid: r.s}) MATCH (b {uid: r.o})
CALL apoc.merge.relationship(a, r.type, r.key, {}, b, {}) YIELD rel   // 타입이 변수일 때. 없으면 타입별 쿼리 생성
SET rel.sources   = coalesce(rel.sources, []) + [x IN r.sources WHERE NOT x IN coalesce(rel.sources, [])],
    rel.certainty = CASE WHEN rel.certainty = 'confirmed' THEN 'confirmed' ELSE r.certainty END,
    rel.last_run  = $run
```
- `certainty`는 **올라가기만** 합니다(`suspected` → `confirmed`). 내려가야 하는 경우(원천이 정정됨)는 무효화 절차로 처리합니다.
- 라벨 없이 `MATCH (a {uid: …})`를 쓰면 느립니다. 실제로는 uid 앞부분(`MaintenanceWork:`)에서 라벨을 알아내 라벨을 붙인 쿼리를 만듭니다(데모의 `class_of`).
- **검사**: 같은 배치를 두 번 넣었을 때 노드 · 관계 수 변화가 0인지 테스트에 넣습니다.

### 7.3 staging → 검사 → publish
1. 새 실행 결과를 staging(별도 DB 또는 `run_id` 표시)으로 적재.
2. CQ 테스트 · 수량 비교(이전 대비 급증 · 급감) · 제약 위반 검사.
3. 통과하면 publish(본 DB에 반영 또는 별칭 전환). 실패하면 반영하지 않고 알림.
- Community 에디션처럼 DB를 여러 개 못 쓰면, 실행 단위로 `run_id`를 붙여 넣고 검사 실패 시 그 `run_id`만 지우는 방식도 됩니다.

### 7.4 삭제 대신 무효화, 시간 두 개
- 원천에서 작업지시가 취소 · 정정되면 관계를 지우지 않고 `valid_to`와 `invalidated_by`를 채웁니다.
- "언제 사실이었나"(`valid_from` · `valid_to`)와 "언제 알았나"(`recorded_at`)를 나누면 "11월 20일 기준으로 우리가 알던 상태"를 다시 볼 수 있습니다(Q030 bi-temporal).
```cypher
MATCH (:MaintenanceWork {uid:$wo})-[r:USED_PART]->(:PartType {uid:$old})
WHERE r.valid_to IS NULL
SET r.valid_to = $corrected_at, r.invalidated_by = $ingest_id
```

### 7.5 원천 참조와 문서 조각
```cypher
// 대량 값은 Dataset 노드로 참조만 (23b장)
MERGE (d:Dataset {uid: 'Dataset:MES/eqp_state_hist/FAB-A/EQ-017'})
  SET d.system = 'MES', d.table = 'eqp_state_hist', d.key_value = 'FAB-A/EQ-017',
      d.query = 'SELECT ts, state FROM eqp_state_hist WHERE site=$fab AND eqp_id=$code AND ts >= $from',
      d.owner = 'mes-team', d.columns = ['ts', 'state', 'reason_cd']
WITH d MATCH (e:Equipment {uid: 'Equipment:FAB-A/EQ-017'}) MERGE (e)-[:HAS_DATA]->(d)

// 문서 조각과 언급
MERGE (c:Chunk {uid: 'Chunk:M-201#p3-2'}) SET c.text = $text, c.page = 3, c.embedding = $vec
WITH c MATCH (e:Equipment {uid: 'Equipment:FAB-A/EQ-017'}) MERGE (c)-[:MENTIONS]->(e)
```
- 벡터 인덱스는 조각에 둡니다. 차원은 임베딩 모델에 맞춥니다.
  ```cypher
  CREATE VECTOR INDEX chunk_vec IF NOT EXISTS FOR (c:Chunk) ON c.embedding
  OPTIONS {indexConfig: {`vector.dimensions`: 1024, `vector.similarity_function`: 'cosine'}}
  ```
  임베딩 모델을 바꾸면 전체 재계산이 필요하니 모델 이름 · 차원을 속성으로 남깁니다.
- 조각 텍스트 전체를 그래프에 넣을지, 원장 · 검색 인덱스에만 둘지는 크기로 정합니다. 그래프에는 짧은 텍스트 + 원문 위치만 두는 것도 흔합니다.

### 7.6 전체 재구축
- 증분 적재만 오래 하면 "지금 그래프"와 "원본 + 정의로 새로 만든 그래프"가 조금씩 달라집니다(지운 규칙 · 바뀐 사전).
- 주 1회 또는 major 버전 변경 때 빈 DB에 전체를 다시 만들고, 현재 그래프와 노드 · 관계 수 · CQ 결과를 비교합니다. 차이가 있으면 원인을 찾습니다.

**데모에서는**: `pipeline/graph.py`(`merge_node` · `merge_rel` — 노드 먼저, 관계 나중, 근거 합집합), `pipeline/load.py`, `scripts/reset.py`(제약 생성 + 기준 그래프 적재).

---

## 8. 평가

### 8.1 CQ 테스트 (매 적재)
업무 질문을 테스트 코드처럼 관리합니다.
```yaml
# cq/cq03_part_history.yaml
id: CQ03
question: "FAB-A EQ-017의 최근 90일 PT-V42 교체 이력은?"
cypher: |
  MATCH (w:MaintenanceWork)-[:ON_EQUIPMENT]->(:Equipment {uid:'Equipment:FAB-A/EQ-017'}),
        (w)-[u:USED_PART]->(:PartType {uid:'PartType:PT-V42'})
  WHERE w.started_at >= datetime() - duration('P90D') AND u.valid_to IS NULL
  RETURN w.wo_id AS wo ORDER BY wo
expect:
  type: contains            # contains · equals · count_at_least
  value: [WO-1042]
needs: [ON_EQUIPMENT, USED_PART]      # 실패 시 원인 나누기에 씀
```
- 실패하면 원인을 나눕니다: 개념 · 관계가 없음 → 온톨로지, 추출 누락 → 프롬프트 · 조각, ER 오류 → 사전 · 규칙, 원천 누락 → 커넥터(24장).
- CQ 결과는 실행마다 스냅샷으로 남겨 "이번 변경으로 무엇이 달라졌나"를 비교합니다.

### 8.2 표본 판정 (주기적)
- 관계 종류 · 원천 · 확실성별로 **층화 표본**을 뽑아 사람이 맞음 · 틀림을 판정합니다.
- 정확도는 구간으로 말합니다. 100건 중 95건 맞음 → 95% 신뢰구간 약 89~98%(Wilson).
- 표본으로는 **빠진 사실(재현율)을 못 잽니다.** 그래프에 들어간 것 중에서 뽑기 때문입니다.

### 8.3 골든셋 (프롬프트 · 모델 · 정의 변경 때)
- 문서 30~50개에 사람이 모든 사실을 직접 달아 둔 정답 세트. 정밀도와 재현율을 같이 잽니다.
- 프롬프트 · 모델 · 정의를 바꾸는 PR은 골든셋 점수를 같이 보고합니다. 점수가 떨어지면 합치지 않습니다.
- 골든셋 문서는 추출 예시(few-shot)로 쓰지 않습니다(점수가 부풀려짐).

### 8.4 지표
| 지표 | 정의 | 목표 예 |
|---|---|---|
| CQ 통과율 | 통과 CQ / 전체 CQ | 100% (실패는 원인 기록) |
| 관계 정밀도 | 표본에서 맞은 비율 (관계 종류별) | high 위험 관계 ≥ 98% |
| 골든셋 재현율 | 정답 사실 중 그래프에 들어간 비율 | ≥ 85% |
| 미연결 표현 비율 | 연결 못 한 언급 / 전체 언급 | 매주 감소 |
| 검토 대기 | 큐에 쌓인 건수 · 평균 대기 일수 | 대기 < 3일 |
| 재구축 차이 | 증분 그래프 vs 재구축 그래프 차이 | 0 |

**데모에서는**: `pipeline/diff.py`(`run_cq` · `snapshot_cq` · `graph_diff` · `ontology_proposal`), 데모 화면의 "비교" 단계.

---

## 9. 운영: 자동화 · 버전 · 모니터링 · 보안

### 9.1 오케스트레이션 (25장)
```python
# dags/kg_daily.py — Airflow 3 예 (요지만)
from airflow.sdk import dag, task
import pendulum

@dag(schedule="0 2 * * *", start_date=pendulum.datetime(2026, 11, 1, tz="Asia/Seoul"),
     catchup=False, max_active_runs=1, tags=["kg"])
def kg_daily():
    @task(retries=3)
    def collect(): ...          # 커넥터별 증분 수집 → ingest_ids
    @task
    def clean(ids): ...
    @task
    def resolve(ids): ...
    @task(retries=2, execution_timeout=pendulum.duration(hours=3))
    def extract(ids): ...       # 호출 기록이 있으면 재호출 안 함
    @task
    def validate(ids): ...      # hold · question은 큐로, DAG는 기다리지 않음
    @task
    def load_staging(ids): ...
    @task
    def check_and_publish(): ...   # CQ · 수량 비교 통과 시 publish
    ids = collect()
    check_and_publish() << load_staging(validate(extract(resolve(clean(ids)))))

kg_daily()
```
- 모든 task는 **멱등**이어야 합니다(같은 입력으로 다시 돌려도 결과가 같음). 그래야 재시도 · 백필이 안전합니다.
- task 사이에는 큰 데이터를 직접 넘기지 않고 파일 경로 · ID만 넘깁니다.
- 사람 승인은 DAG 안에서 기다리지 않습니다. 보류 건은 큐로 빼고, 승인 이벤트가 다음 실행을 깨우게 합니다(Airflow 3의 Asset · 외부 이벤트 트리거).
- 원천이 하나 · 문서 수십 개 규모면 cron + 스크립트로 충분합니다. 단계가 함수로 나뉘어 있으면 나중에 옮기기 쉽습니다.

### 9.2 버전 다섯 가지를 실행마다 기록 (26장)
```json
{"run_id": "run-20261124-01",
 "inputs": {"ingest_ids": ["ing-20261124-0001", "…"], "watermarks": {"cmms": "2026-11-24T02:00Z"}},
 "ontology": {"version": "1.2.0", "git": "a1b2c3d"},
 "lexicon": {"version": "2026.11.20", "git": "e4f5a6b"},
 "pipeline": {"git": "9c8d7e6", "image": "kg-pipeline:1.4.2"},
 "model": {"name": "qwen-local", "weights_sha": "…", "server": "vllm 0.x", "temperature": 0},
 "prompts": {"extract_report": "sha256:…"},
 "reviews_until": "2026-11-24T01:59Z",
 "result": {"nodes_added": 41, "rels_added": 96, "held": 7, "questions": 2, "cq_pass": "12/12"}}
```
- 이 기록이 있으면 "그래프의 이 관계는 어느 실행 · 어느 정의 · 어느 모델에서 왔나"를 답할 수 있습니다(Q032 OpenLineage가 같은 생각의 표준).
- main / develop: develop 그래프에서 새 정의 · 프롬프트로 실행해 보고, CQ · 골든셋 비교 후 main으로 승격합니다. 그래프 DB에 브랜치 기능이 없어도 "같은 입력 + 다른 버전"으로 다시 만들면 됩니다.

### 9.3 모니터링
| 무엇을 | 왜 | 알림 기준 예 |
|---|---|---|
| 원천별 수집 건수 | 커넥터 고장은 "0건"으로 조용히 옴 | 평소 대비 -80% |
| 단계별 실패 · 재시도 | | 실패 1건 이상 |
| LLM 응답 형식 오류율 · 지연 | 모델 · 서버 변경 감지 | 형식 오류 > 2% |
| 판정 분포 (approve / hold / reject) | 프롬프트 · 원천 품질 변화 | reject 비율 2배 |
| 검토 큐 길이 · 대기일 | 운영 병목 | 대기 > 3일 |
| CQ 통과율 · 재구축 차이 | 품질 회귀 | 실패 1개 이상 |

### 9.4 보안 · 권한
- **사내 실행**: 문서 내용이 외부로 나가지 않게 LLM은 사내 서버(vLLM 등)로. 외부 API를 쓴다면 어떤 원천을 보낼 수 있는지 목록으로 정합니다.
- **권한 전파**: 수집 때 받은 `acl`을 문서 · 조각 · 그 조각에서 나온 사실의 근거까지 이어 둡니다. agent가 조회할 때 사용자 권한으로 걸러야 합니다(조회 쪽에서 반드시 확인).
- **비밀 정보**: DB 계정 · API 키는 `.env` · 비밀 저장소에. 저장소에는 `.env.example`만.
- **읽기 전용 계정**: 원천 DB는 읽기 전용 계정으로만 접근. 파이프라인이 원천을 바꾸는 일은 없어야 합니다.
- **라이선스**: 모델 · 파서 · DB의 라이선스 조건(상용 사용 · 배포)을 확인합니다([licenses.md](licenses.md)).

---

## 10. 조회 쪽에 넘겨줄 것

이 파이프라인의 소비자는 agent입니다(발표 3). 구축 때 아래를 남겨야 조회 쪽이 제대로 씁니다.
- **개체 설명문**: 노드마다 한두 문장(`summary`) — agent가 무엇인지 알게.
- **근거 ID와 원문 위치**: 답에 근거를 붙이게.
- **확실성 · 유효 기간**: "추정"을 "확정"처럼 말하지 않게, 지난 사실을 현재처럼 말하지 않게.
- **Dataset 참조**: 대량 값은 그래프 → 조회 방법 → 원천 순으로 가져오게(23b장).
- **조각 ↔ 개체(MENTIONS) + 벡터 인덱스**: 그래프 + 벡터 혼합 검색(Q036).
- **도구 정의**: 자주 쓰는 질의를 MCP 도구로 내보내면(Q035) agent가 Cypher를 직접 짜지 않아도 됩니다. 예: `equipment_history(fab, code, days)`, `part_usage(part_no)`, `find_dataset(uid)`.

---

## 11. 도입 순서

| 단계 | 기간 감 | 범위 | 끝났다는 기준 |
|---|---|---|---|
| 0 준비 | 1~2주 | CQ 5~10개, 원천 목록, ID 규칙, 설비 · 부품 마스터 | 전문가가 CQ와 키 규칙에 "예" |
| 1 정형 뼈대 | 2~4주 | MES 설비 + CMMS 작업 · 부품 매핑, 그래프 적재, CQ 테스트 | 정형으로 답할 수 있는 CQ 통과, 재적재 변화 0 |
| 2 문서 한 종류 | 3~6주 | 정비 보고서만: 정제 · 사전 · LLM 추출 · 검증 · 검토 화면 | 골든셋 30개 정밀도 · 재현율 측정, 검토 큐가 돌아감 |
| 3 넓히기 | 분기 | 회의록 · 메일 · STT, 질문 큐, 확장 후보 → 정의 PR | 정의 minor 버전 2~3번, 미연결 비율 감소 |
| 4 운영 | 이후 | 오케스트레이션, staging/publish, 재구축 비교, 모니터링, MCP 도구 | 사람 없이 매일 돌고, 알림만 보고 대응 |

- 단계 1을 건너뛰고 문서 LLM 추출부터 하면, 연결할 기준 개체가 없어 같은 설비가 여러 노드로 쪼개집니다. **정형 뼈대 먼저**가 가장 중요합니다.
- 각 단계 끝에서 CQ 결과를 현업에 보여 주고 다음 범위를 정합니다.

---

## 12. 흔한 실수와 점검표

### 흔한 실수
| 실수 | 결과 | 막는 방법 |
|---|---|---|
| uid에 이름(표시명)을 씀 | 이름이 바뀌면 개체가 둘로 | 업무 키(코드 · 번호)로 uid |
| 패턴 전체를 한 번에 MERGE | 노드 중복 생성 | 노드 MERGE 후 관계 MERGE |
| LLM 출력을 바로 적재 | 원문에 없는 관계 · 추정이 확정으로 | 후보 → 검증 → 적재 |
| 근거 문장을 LLM이 요약한 채로 저장 | 원문 위치로 못 돌아감 | 원문 포함 여부를 문자열로 검사 |
| 정의를 DB 제약 · 코드 · 프롬프트에 따로 고침 | 세 곳이 어긋남 | 정의 파일 하나 + 생성기 |
| 검토 결과를 다시 쓰지 않음 | 같은 질문을 계속 함 | 판정 → 사전 · 예시 · 임계값 |
| 사람 승인을 파이프라인 안에서 기다림 | 전체가 멈춤 | 큐로 빼고 다음 실행에 반영 |
| 대량 측정값을 그래프에 복사 | 용량 · 동기화 · 권한 문제 | Dataset 참조 |
| 삭제로 정정 | "언제 무엇을 알았나"를 잃음 | valid_to · invalidated_by |
| 평가를 표본 정확도로만 | 빠진 사실을 모름 | 골든셋 재현율 |

### 단계별 점검표
- [ ] CQ 5~10개가 문서로 있고 전문가가 확인했다
- [ ] 클래스마다 key와 기준 시스템(`official`)이 있다
- [ ] 정의 파일에서 JSON Schema · 검증 규칙 · DB 제약이 생성된다
- [ ] 원본은 고치지 않고 해시 · 버전과 함께 저장된다
- [ ] 수집 기록에 권한(acl)이 있다
- [ ] 정제 변경이 원래 글 · 규칙 · 위치로 남는다
- [ ] ER은 확신 없으면 합치지 않고, 병합 · 분할 이력이 있다
- [ ] LLM 출력은 서버가 스키마를 강제하고, 호출이 해시로 기록된다
- [ ] 근거 문장이 원문에 있는지 문자열로 검사한다
- [ ] 위험도 × 확신도로 사람 검토를 나눈다
- [ ] 같은 배치를 두 번 넣어도 변화가 0이다
- [ ] staging에서 검사 후 publish한다
- [ ] 삭제 대신 무효화한다
- [ ] CQ 테스트가 매 적재마다 돈다
- [ ] 실행마다 다섯 가지 버전이 기록된다
- [ ] 주기적으로 전체 재구축 후 차이를 본다

---

## 13. 데모 코드 대응표

데모는 이 문서 구조를 작게 구현한 것입니다(도메인: 반도체 · AI 뉴스).

| 이 문서 | 데모 파일 | 실제 구축에서 바꿀 것 |
|---|---|---|
| 2.1 온톨로지 파일 | `demo/ontology/ontology.v1.yaml` | 클래스 · 관계를 설비 정비 도메인으로, `official` · `risk` · `review` 블록 추가 |
| 2.2 용어 사전 | `demo/ontology/lexicon.v1.yaml` · `phonetic.yaml` | 사내 코드 · 별칭 · STT 표기 |
| 2.3 생성기 | `pipeline/extract.py`(`schema_text`) · `pipeline/graph.py`(`create_constraints`) | 별도 `gen/` 모듈로 분리, CI에서 실행 |
| 3 수집 | `pipeline/collect.py` · `data/inputs/` | 원천별 커넥터, 워터마크, 수집 원장 |
| 4 정제 · ER | `pipeline/clean.py` · `pipeline/resolve.py` | 문서 파서, 임베딩 후보, Splink, 병합 이력 |
| 5 추출 | `pipeline/extract.py` · `pipeline/llm.py` | `json_schema` 구조화 출력, 정형 매핑 파일 |
| 6 검증 | `pipeline/validate.py` | 원천 대조를 CMMS · MES로, 검토 화면 · 질문 큐 저장소 |
| 7 적재 | `pipeline/graph.py`(`merge_node` · `merge_rel`) · `pipeline/load.py` · `scripts/reset.py` | staging/publish, valid_to, Dataset · Chunk · 벡터 |
| 8 평가 | `pipeline/diff.py` | CQ yaml, 골든셋, 표본 판정 도구 |
| 9 운영 | `scripts/run_all.py` (`--live`로 LLM 다시 호출) | 오케스트레이터, 실행 기록, 모니터링 |
| 화면 "구현 내용" 패널 | `demo/docs/dev_work.yaml` | — (설명용) |

---

## 출처
- Hogan et al., "Knowledge Graphs", *ACM Computing Surveys* 54(4), 2021
- Noy & McGuinness, "Ontology Development 101" (2001) · Grüninger & Fox (1995, Competency Questions)
- LinkML 문서 (linkml.io) · W3C SHACL (2017) · W3C R2RML (2012) · Ontop 문서
- Neo4j Cypher Manual (MERGE · constraints · vector indexes) · APOC 문서 (`apoc.merge.relationship`)
- vLLM 문서, *Structured Outputs* (OpenAI 호환 `response_format`)
- Fellegi & Sunter, "A Theory for Record Linkage" (1969) · Splink 문서
- Docling 문서 (IBM) · Open Data Contract Standard (ODCS) · OpenLineage 문서
- Apache Airflow 3 문서 (TaskFlow · Assets · DAG versioning)
- Snorkel: Ratner et al., "Snorkel: Rapid Training Data Creation with Weak Supervision" (VLDB 2017)
- Zheng et al., "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" (NeurIPS 2023)
- Edge et al., "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (2024) · Model Context Protocol 명세
- Wilson, "Probable Inference, the Law of Succession, and Statistical Inference" (1927)
