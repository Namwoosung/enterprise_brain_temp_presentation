# 쓸 수 있는 도구 · 플랫폼의 라이선스와 주의사항

조사일 2026-11-24. 관련 질문: [qna_notes.md](../qna_notes.md) Q021.

> **이 문서는 법률 자문이 아닙니다.** 사내 도입 전에는 각 도구의 LICENSE 파일 원문과 사내 법무 · 오픈소스 정책을 확인하세요.
> 표의 "확인" 칸: **원문** = 이번에 LICENSE 파일이나 공식 라이선스 페이지를 직접 읽음, **공식** = 공식 사이트 · 문서 설명, **일반** = 널리 알려진 라이선스지만 이번에 원문을 다시 열어 보지는 않음.

## 0. 먼저 알아 둘 라이선스 종류
| 종류 | 예 | 사내에서 쓸 때 | 조심할 때 |
|---|---|---|---|
| 허용형(permissive) | MIT, Apache-2.0, BSD | 수정 · 상업 이용 · 사내 배포 자유. 저작권 · 라이선스 고지만 유지 | Apache-2.0은 특허 조항 포함. 거의 문제 없음 |
| 약한 · 강한 copyleft | GPL-3.0 | 사내에서 그대로 쓰는 건 자유 | **수정한 프로그램을 외부에 배포**하면 소스 공개 의무 |
| 네트워크 copyleft | AGPL-3.0 | 사내 이용은 자유 | **수정한 프로그램을 네트워크 서비스로 외부에 제공**해도 소스 공개 의무. 많은 회사가 사내 정책으로 제한 |
| 소스 공개형(source-available) | BSL 1.1 | 소스는 볼 수 있지만 오픈소스 아님. 허용 범위가 라이선스마다 다름 | 경쟁 서비스 제공 금지 등 조건. 원문 확인 필수 |
| 상용 · 독점 | Neo4j Enterprise, NVL | 계약 범위 안에서만 | 무료 개발용 라이선스를 운영에 쓰면 위반 |
| 모델 전용 라이선스 | Llama, GLM-5.3, Qwen 커뮤니티 라이선스 | 라이선스마다 다름 | 매출 · 사용자 수 조건, 용도 제한, 출력물로 다른 모델 학습 금지 등 |

## 1. 그래프 DB와 주변 도구 (Neo4j 계열)
| 도구 | 라이선스 | 확인 | 주의사항 |
|---|---|---|---|
| Neo4j Community Edition | GPL-3.0 | 공식 | 사내에서 그대로 쓰는 건 무료. 수정한 Neo4j를 외부에 배포할 때만 GPL 의무. 기능 제한: 클러스터 · 온라인 백업 · 역할 기반 권한(RBAC) · 존재/타입/키 제약 없음, 표준 DB 1개 |
| Neo4j Enterprise Edition | 상용(구독) | 공식 | 운영에 쓰려면 계약 필요. Neo4j Desktop의 무료 Enterprise 라이선스는 **로컬 개발용**만. 소규모 스타트업 무료 프로그램은 우리와 무관 |
| Neo4j AuraDB | 클라우드 서비스 약관 | 공식 | 데이터가 외부 클라우드로 나감 → 사내 데이터 반출 규정 확인. 플러그인 자유 설치 불가(n10s 불가) |
| Neo4j Browser | GPL-3.0 | 원문 | 그대로 쓰는 건 문제없음. 데모의 :8801 중계는 Browser를 수정하지 않고 헤더만 바꿔 전달 |
| NVL (Neo4j Visualization Library) | Neo4j 독점 라이선스 | 원문 | **Aura 또는 Neo4j 상용 제품 고객만** 사용 가능. Community와 함께 쓰면 안 됨. 데모가 NVL 대신 Neo4j Browser를 쓴 이유 |
| APOC (Core) | Apache-2.0 | 공식 | 자유롭게 사용 |
| GDS (Graph Data Science) | Community 기능: GPL-3.0로 알려짐 / Enterprise 기능: 상용 | 공식(포럼) · 원문 미확인 | 병렬 처리 등 Enterprise 기능은 별도 라이선스 키 필요 |
| n10s (neosemantics) | Apache-2.0 | 일반 | Neo4j Labs 프로젝트 = 공식 기술 지원 없음. Aura에서는 못 씀 |
| neo4j Python 드라이버 | Apache-2.0 | 일반 | 자유롭게 사용 |
| neo4j-graphrag (Python) | Apache-2.0로 알려짐 | 원문 미확인 | 도입 전 PyPI 메타데이터 · 저장소 LICENSE 확인 |

## 2. 다른 그래프 DB
| 도구 | 라이선스 | 확인 | 주의사항 |
|---|---|---|---|
| Memgraph Community | BSL 1.1 (소스 공개형) | 공식 | 오픈소스가 아님. 사내 이용은 대개 허용되지만 조건은 원문 확인. Enterprise(권한 · 감사 로그 등)는 별도 상용(MEL) |
| TerminusDB | Apache-2.0 | 일반 | git식 브랜치가 필요할 때의 대안(26장) |
| RDF 저장소(GraphDB, Stardog 등) | 무료판 · 상용판 혼재 | 일반 | 무료판의 규모 · 용도 제한 확인 |

## 3. 파이프라인 · 저장 · 데이터 품질
| 도구 | 라이선스 | 확인 | 주의사항 |
|---|---|---|---|
| Apache Airflow | Apache-2.0 | 일반 | 자유. 운영 부담(스케줄러 · DB · 워커)이 실제 비용 |
| Dagster · Prefect | Apache-2.0 (오픈소스 부분) | 일반 | 각 회사의 클라우드 서비스는 별도 유료 |
| DuckDB | MIT | 일반 | 자유. 내장형이라 여러 프로세스 동시 쓰기에 약함(라이선스가 아니라 구조상 주의) |
| Apache Parquet | Apache-2.0 | 일반 | 자유 |
| PyYAML | MIT | 일반 | 데모 의존성 |
| Splink | MIT | 원문 | 자유 |
| Dedupe | MIT | 일반 | 자유 |
| **Zingg** | **AGPL-3.0** | 공식 | 사내 정책상 AGPL 금지인 회사가 많음. 수정해 서비스로 제공하면 소스 공개 의무. 상용 라이선스 별도 문의 |
| Senzing | 상용 | 일반 | 무료 평가 범위 제한 |
| LinkML | Apache-2.0 | 원문 | 자유 |
| Ontop (OBDA) | Apache-2.0 | 일반 | 자유 |
| DataHub · OpenMetadata (데이터 카탈로그) | Apache-2.0 | 일반 | 자유. 각 회사 관리형 서비스는 별도 |
| Microsoft GraphRAG | MIT | 일반 | 자유. 기본 설정은 LLM 호출이 많아 비용 주의 |
| Graphiti | Apache-2.0 | 일반 | 자유 |
| NVIDIA Auto Ontology | Apache-2.0 | 원문(README) | 코드는 자유. **기본 모델 엔드포인트(NIM)는 데이터를 NVIDIA 호스팅 모델로 보냄** → 사내 데이터면 자체 엔드포인트로 바꿔야 함. 모델 자체(Nemotron)는 NVIDIA 모델 라이선스를 따로 따름. 내부 포트 인증 없음 |
| Docker Engine | Apache-2.0 | 일반 | 서버에서 엔진만 쓰면 무료 |
| **Docker Desktop** | Docker 구독 약관 | 일반 | **직원 250명 초과 또는 연매출 1천만 달러 초과 기업은 유료 구독 필요**. 대기업 PC에서 Neo4j를 Docker Desktop으로 띄운다면 해당. 대안: zip 설치, WSL 안의 Docker Engine, Podman |

## 4. LLM 서빙과 모델
| 대상 | 라이선스 | 확인 | 주의사항 |
|---|---|---|---|
| vLLM | Apache-2.0 | 원문 | 서빙 엔진은 자유. **모델 가중치의 라이선스는 별개** |
| **GLM-5.3** | 자체 "GLM-5.3 License"(MIT 아님) | 원문 | 대부분 MIT처럼 자유. 단 **Model-as-a-Service 사업**(API 등으로 제3자에게 추론 · 미세조정 제공)을 하는 라이선시 **또는 계열사**의 합산 매출이 12개월 연속 100억 달러를 넘으면 상업 이용 전에 Z.AI 보안 심사가 필요. 사내 기능에 넣는 것, 다른 곳 모델로 요청만 중계하는 것은 MaaS에서 제외로 적혀 있음. **대기업 계열사는 법무 검토 필수** |
| GLM-5.3-Flash | MIT (모델 페이지 표기) | 원문(표기만) | 플래그십보다 제약이 적음. LICENSE 파일 원문은 미확인 |
| GLM-4.5 ~ GLM-5.1 | MIT로 알려짐 | 일반 | 버전마다 다르므로 모델 카드 확인 |
| **Qwen3.7-Flash** | **가중치 비공개(API 전용)로 보도됨** | 일반 | vLLM으로 직접 띄울 수 없을 가능성이 큼. 이름이 비슷한 공개 모델은 **Qwen3.8-Flash-Next**(라이선스 `qwen-community-1.0`, 접근 승인 필요)로 확인됨 → 약관 원문 확인 필요 |
| Qwen3 (초기 세대) 공개 모델 | Apache-2.0 | 공식(저장소) | 같은 Qwen이라도 세대 · 크기마다 라이선스가 다름(대형 플래그십은 자체 라이선스) |
| OpenAI API (gpt-4.1 등) | 서비스 약관 | 일반 | 데이터가 외부로 나감 → 사내 데이터 반출 규정 확인. 이 PC의 데모 녹화는 더미 데이터로만 함 |

## 5. 우리 상황에서 정리
- **바로 써도 무리 없는 것**: Neo4j Community(그대로 사내 사용), Neo4j Browser, APOC, Airflow, DuckDB, Parquet, Splink, LinkML, vLLM, 데모 의존성(neo4j 드라이버, PyYAML).
- **조건을 확인할 것**:
  - Neo4j Enterprise 기능(클러스터, RBAC, 키 제약)이 필요해지는 순간 = 상용 계약.
  - NVL은 Community와 못 씀. 시각화는 Neo4j Browser나 다른 오픈소스 라이브러리로.
  - Docker Desktop은 회사 규모상 유료일 가능성이 큼.
  - GLM-5.3은 계열사 매출 조건 때문에 법무 검토. 가능하면 MIT인 GLM-5.3-Flash를 우선 검토.
  - Qwen3.7-Flash는 공개 가중치가 있는지부터 확인. 없으면 Qwen3.8-Flash-Next 등 공개 모델의 약관을 확인.
- **사내 정책상 보통 피하는 것**: AGPL(Zingg), 외부 클라우드로 데이터가 나가는 서비스(Aura, 외부 LLM API, Auto Ontology 기본 NIM 엔드포인트).
- **모든 경우 공통**: 오픈소스를 사내 서비스에 넣으면 라이선스 고지(NOTICE) 목록을 남깁니다. 모델은 가중치 라이선스와 별도로 **허용 용도 정책**(acceptable use)이 붙어 있는 경우가 많습니다.

## 출처
- Neo4j Licensing: https://neo4j.com/licensing/
- Neo4j 오픈 코어 전환 공지: https://neo4j.com/blog/open-core-licensing-model-neo4j-enterprise-edition/
- NVL 라이선스: https://neo4j.com/docs/reference/license/nvl
- Neo4j Browser LICENSE: https://github.com/neo4j/neo4j-browser/blob/master/LICENSE
- Neo4j 제3자 라이선스 목록(APOC 등): https://neo4j.com/terms/thirdpartylicenses/
- GDS 라이선스 관련 커뮤니티 답변: https://community.neo4j.com/t/license-model-of-gds/23664
- Memgraph Legal: https://memgraph.com/legal
- Zingg: https://github.com/zinggAI/zingg
- Splink LICENSE: https://github.com/moj-analytical-services/splink/blob/master/LICENSE
- LinkML LICENSE: https://github.com/linkml/linkml/blob/main/LICENSE
- vLLM LICENSE: https://github.com/vllm-project/vllm/blob/main/LICENSE
- GLM-5.3 LICENSE: https://huggingface.co/zai-org/GLM-5.3/blob/main/LICENSE
- GLM-5.3-Flash: https://huggingface.co/zai-org/GLM-5.3-Flash
- Qwen3.8-Flash-Next: https://huggingface.co/Qwen/Qwen3.8-Flash-Next
- Qwen3.7 Flash API 전용 보도(제3자): https://www.spheron.network/blog/qwen3-7-flash-gpu-requirements/
- Qwen3 저장소(Apache-2.0 명시): https://github.com/QwenLM/qwen3
- NVIDIA Auto Ontology: https://github.com/NVIDIA/auto-ontology
