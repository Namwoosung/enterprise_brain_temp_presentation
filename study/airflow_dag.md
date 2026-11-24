# Apache Airflow와 DAG — 알아야 할 핵심

발표에 넣을 내용은 아니고, 25장(자동화) · 26장(버전 관리)을 설명할 때 바탕이 되는 지식입니다. 관련 질문: [qna_notes.md](../qna_notes.md) Q020.

## 1. Airflow는 무엇을 하나
- **오케스트레이터**입니다. "어떤 작업을, 어떤 순서로, 언제 돌릴지"를 Python 코드로 정의하면, 정해진 때에 실행하고, 실패하면 재시도하고, 실행 기록을 남깁니다.
- 데이터를 직접 처리하는 도구가 아닙니다. 실제 처리는 각 작업(파이썬 함수, SQL, 스크립트, Spark 작업 등)이 하고, Airflow는 그걸 부르고 지켜봅니다.
- 2014년 Airbnb에서 시작해 현재 Apache 재단 프로젝트입니다.

## 2. 꼭 알아야 할 용어
| 용어 | 뜻 | 우리 파이프라인에서 |
|---|---|---|
| DAG | Directed Acyclic Graph. 작업과 순서(의존성)의 묶음. 순환이 없어야 함 | 소스별 수집 → 정제 → 추출 → 검증 → 적재 |
| Task | DAG 안의 작업 하나 | "메일 수집", "CMMS export 정제" |
| Operator | 작업의 종류(틀). PythonOperator, BashOperator, SQL 계열 등 | 대부분 Python 함수 |
| TaskFlow API | `@dag`, `@task` 데코레이터로 함수를 그대로 작업으로 만드는 문법 | 데모의 `pipeline/*.py` 함수를 그대로 감쌀 수 있음 |
| Schedule | 언제 돌릴지. cron 식, 간격, 또는 데이터(Asset) 기준 | 매일 새벽 / 새 파일이 생기면 |
| DAG run | DAG 한 번 실행. 보통 날짜 구간(data interval)과 묶임 | "2026-03-07분 처리" |
| Retry | 실패 시 자동 재시도 횟수 · 간격 | LLM 호출 실패, 네트워크 오류 |
| Backfill | 과거 구간을 몰아서 다시 실행 | 규칙을 고친 뒤 지난 3개월 재처리 |
| XCom | 작업 사이에 작은 값을 넘기는 장치(큰 데이터는 파일 경로만 넘김) | 처리한 문서 id 목록 |
| Sensor / Deferrable | 무언가가 준비될 때까지 기다리는 작업. Deferrable은 기다리는 동안 자원을 놓아 줌 | 새 export 파일 대기 |
| Connection / Variable | 외부 시스템 접속 정보 · 설정값을 코드 밖에 둠 | Neo4j 주소, LLM 주소 |
| Scheduler · Executor · Worker | 실행 시점 판단 · 실행 방식(Local, Celery, Kubernetes) · 실제 실행자 | 처음엔 LocalExecutor로 충분 |

## 3. 가장 중요한 원칙: 멱등성
- 같은 작업을 두 번 돌려도 결과가 같아야 합니다. 재시도와 backfill이 일상이라서입니다.
- 방법: 입력 구간을 날짜 · 버전으로 고정하고, 결과는 덮어쓰기(MERGE · upsert)로 씁니다. "현재 시각"에 의존하지 않습니다.
- 데모의 적재 단계가 "같은 배치 재실행 → 변화 0"을 확인하는 이유가 이것입니다(23장).

## 4. Airflow 3에서 바뀐 것 (2025년 4월 정식 출시)
- **Asset**: 2.x의 Dataset이 Asset으로 이름이 바뀌고 문법이 정리됐습니다. "이 파일 · 테이블이 갱신되면 저 DAG를 실행"처럼 데이터 기준으로 DAG를 잇습니다.
- **이벤트 기반 실행(Watcher)**: Airflow 바깥의 이벤트(메시지 큐 등)를 보고 Asset을 갱신해 DAG를 깨웁니다. 정해진 시각이 아니라 "새 데이터가 생겼을 때" 실행할 수 있습니다.
- **DAG 버전 관리**: 각 실행이 시작할 때의 DAG 코드 버전에 묶입니다. 실행 중에 코드가 바뀌어도 그 실행은 시작 버전으로 끝까지 가고, UI에서 버전별 구조와 기록을 볼 수 있습니다. **DAG bundle**(예: Git 번들)을 쓰면 이전 버전으로 다시 실행하는 것까지 됩니다.
- 그 외: 새 React UI, 작업 실행을 API로 분리한 구조(Task SDK), 원격 실행 지원.
- 이후 3.x 릴리스에서도 기능이 계속 추가되고 있으니, 실제 도입 때는 그 시점의 릴리스 노트를 확인합니다.

## 5. 우리 KG 파이프라인에 대 보면
```python
from airflow.sdk import dag, task, Asset   # Airflow 3 문법 (TaskFlow)

cmms_export = Asset("file:///landing/cmms/wo_export.csv")

@dag(schedule=[cmms_export], catchup=False, tags=["kg"])   # 새 export가 생기면 실행
def cmms_to_kg():
    @task(retries=3)
    def collect(): ...          # 원본 보관 + 해시 · 버전 기록
    @task
    def clean(doc_id): ...      # 중복 · 날짜 · 코드 정리
    @task
    def extract(doc_id): ...    # 규칙 매핑 (문서라면 LLM 호출)
    @task
    def validate(doc_id): ...   # 스키마 · 원천 대조 → 승인 / 보류 / 기각
    @task
    def load(doc_id): ...       # staging → publish, 멱등
    load(validate(extract(clean(collect()))))

cmms_to_kg()
```
- 사람 검토는 DAG 안에서 기다리지 않습니다. 보류 건은 큐에 넣고 DAG는 끝냅니다. 승인되면 다음 실행이 반영합니다(25장 "사람 검토는 옆으로").
- 실행마다 원본 버전, 온톨로지 버전(Git 태그), 프롬프트 버전, 모델 이름을 기록합니다. DAG 버전 관리와 합치면 "어느 코드 · 어느 정의로 만든 그래프인지"가 남습니다(26장).
- 위 코드는 구조를 보여 주는 예시입니다. import 경로 등은 설치한 Airflow 버전 문서를 따릅니다.

## 6. 꼭 Airflow여야 하나
| 선택지 | 맞는 경우 |
|---|---|
| cron + 스크립트 | 소스 1~2개, 하루 한 번, 재시도 · 기록 요구가 약할 때. 시작은 이걸로도 충분 |
| Airflow | 소스가 여럿이고 재시도 · backfill · 실행 기록 · UI가 필요할 때. 사내에 이미 있으면 우선 |
| Dagster | "데이터 자산" 중심으로 사고하고 싶을 때(자산 계보가 기본 개념) |
| Prefect | Python 코드에 가볍게 붙이고 싶을 때 |

## 출처
- Apache Airflow 공식 문서: https://airflow.apache.org/docs/
- Apache Airflow 블로그, Airflow 3.0 출시 글 (2025-04): https://airflow.apache.org/blog/airflow-three-point-oh-is-here/
- Astronomer, "Intro to Airflow 3": https://www.astronomer.io/blog/intro-to-airflow-3/
