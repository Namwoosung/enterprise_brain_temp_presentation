# 데모 편집 안내 (사람 · AI 에이전트 공용)

반도체 · AI 뉴스 도메인의 온톨로지 구축 데모입니다. 공개 기사로 만든 **기준 그래프(run 0)** 에 가상의 **메일 1건**과 **회의록 STT 1건**을 넣어
`수집 → 정제 → 추출(LLM) → 연결 → 검증 → 적재` 단계를 거친 뒤 바뀐 점을 보여 줍니다.
설치 · 실행은 [README.md](README.md), 데이터 형식은 [docs/DATA_SPEC.md](docs/DATA_SPEC.md)에 있습니다.

명령은 모두 `demo/` 폴더에서 실행합니다. Python은 가상환경의 것을 씁니다.
- Windows: `.\.venv\Scripts\python` · macOS/Linux: `.venv/bin/python` (아래에서는 `python`으로 줄여 씀)

## 파일 지도
| 바꿀 것 | 파일 |
|---|---|
| 기준 그래프의 **노드**(회사 · 제품 · 기술 · 국가 · 정책) | `data/sources/entities.yaml` |
| 기준 그래프의 **엣지**(기사가 뒷받침하는 사실) + 검증 대조용 기사 | `data/sources/news_corpus.yaml` |
| 별칭 · 동의어(예: 하이닉스 → SK hynix) | `ontology/lexicon.v1.yaml` |
| STT 발음 → 표기(예: 에이치비엠 → HBM) | `ontology/phonetic.yaml` |
| 클래스 · 관계 정의(구조 변경) | `ontology/ontology.v1.yaml` |
| 더미 메일 · 회의록 | `data/inputs/mail_hbm_update.md`, `data/inputs/meeting_weekly.stt.md` |
| 입력 목록 · 정제 규칙 · 임계값 · 업무 질문(CQ) · Browser 질의 | `config/demo.yaml` |
| LLM 녹화본(발표 때 재생) | `runs/recorded/<입력id>_extract.json` (손으로 고치지 않음) |
| 기계마다 다른 값(Neo4j · LLM 주소) | `.env` (git에 올리지 않음, `.env.example` 참고) |

코드(`pipeline/`, `server/`, `web/`)는 데이터만 바꿀 때는 고칠 필요가 없습니다.

## 고친 뒤 검사 순서
```
python scripts/check_data.py      # 1. 데이터 정합성 (Neo4j · LLM 불필요)
python -m pytest -q               # 2. 단위 테스트 (Neo4j · LLM 불필요)
python scripts/check_neo4j.py     # 3. Neo4j 연결
python scripts/run_all.py         # 4. 리셋 + 전체 실행 (녹화본 재생 또는 LLM 호출, .env의 LLM_MODE에 따름)
```
- `check_data.py`가 `ERROR` 없이 `OK`로 끝나야 다음으로 갑니다.
- `check_data.py`가 **"프롬프트가 녹화 때와 다름"** 경고를 내면 녹화본이 새 데이터와 맞지 않는 것입니다 → 아래 "LLM으로 다시 녹화".
- `run_all.py`가 출력하는 숫자(승인 · 보류, 노드 · 관계 수)가 바뀌었다면 `README.md`의 "발표 전 체크리스트" 숫자도 고칩니다.

## LLM 연결 (:10000 프록시 → vLLM)
데모는 `.env`의 `LLM_BASE_URL`(기본 `http://localhost:10000/v1`)로 OpenAI 호환 API를 부릅니다.
```
python scripts/check_llm.py
```
- 서버가 응답하는지, `LLM_MODEL`이 서버가 내놓는 모델 이름과 같은지, JSON으로 답하는지 확인합니다.
- `LLM_MODEL`은 vLLM의 `--served-model-name`(또는 `/v1/models`에 나오는 id)과 **똑같아야** 합니다.
- 생각(thinking) 모드가 있는 모델(Qwen3 계열 등)은 `.env`에 다음을 넣으면 빠르고 안정적입니다.
  `LLM_EXTRA_BODY={"chat_template_kwargs": {"enable_thinking": false}}`
- 서버가 `response_format`을 거부하면 자동으로 한 번 빼고 다시 부릅니다. 계속 문제면 `LLM_JSON_MODE=false`.
- 응답 앞뒤의 `<think>…</think>`, ```` ```json ```` 울타리, 설명 문장은 파서가 걷어 냅니다. 형식이 틀린 사실 후보는 버리고 개수를 `dropped_facts`로 남깁니다.
- 느린 모델은 `LLM_TIMEOUT`(초)을 늘립니다.

### LLM으로 다시 녹화 (입력 · 데이터 · 사전 · 온톨로지를 바꾼 뒤)
```
python scripts/run_all.py --live      # LLM을 실제로 불러 runs/recorded/*.json 을 새로 저장
python scripts/run_all.py --replay    # 방금 녹화본으로 다시 돌려 같은 결과가 나오는지 확인
python scripts/check_data.py          # "현재 프롬프트와 일치"가 나오면 끝
```
모델이 바뀌면 결과(사실 후보 수, 승인 · 보류)도 바뀝니다. 바뀐 결과를 README 체크리스트에 반영합니다.
LLM 없이 발표할 때는 `.env`에 `LLM_MODE=replay`.

## 작업별 방법

### A. 기준 그래프의 노드 추가 · 수정 · 삭제 (`data/sources/entities.yaml`)
한 줄이 노드 하나입니다.
```yaml
- {class: Company, code: rebellions, name: Rebellions, country: kr}
- {class: Product, code: rbln-atom, name: Rebellions ATOM, status: mass_production, prompt: false}
```
- `class`는 온톨로지의 클래스(Company, Product, Technology, Country, Policy) 중 하나.
- `code`는 영문 소문자 · 숫자 · `-`. 노드 id(uid)가 `Company:rebellions`처럼 만들어지므로 **이미 쓰는 code를 바꾸면** 그 uid를 쓰는 기사 사실 · 사전 · CQ를 모두 같이 고쳐야 합니다(`check_data.py`가 찾아 줌).
- `country`(Company), `issued_by` · `targets`(Policy)는 국가 code를 적으면 관계가 자동으로 생깁니다. 그 국가가 entities에 있어야 합니다.
- Product의 `status`는 `announced | sampling | mass_production`.
- `prompt: false`는 그래프 · 사전에는 넣되 LLM 프롬프트의 "알려진 개체" 목록에서는 뺍니다. 메일 · 회의록과 상관없는 노드는 `prompt: false`로 두면 녹화를 다시 하지 않아도 됩니다.
- 새 노드의 다른 이름(한글명 등)은 `ontology/lexicon.v1.yaml`에 추가합니다:
  `- {ref: "Company:rebellions", pref: Rebellions, alt: [리벨리온], hidden: []}`
- 노드를 지울 때는 그 uid를 쓰는 기사 사실, 사전 항목, CQ도 지웁니다.

### B. 기준 그래프의 엣지 추가 · 수정 (`data/sources/news_corpus.yaml`)
엣지는 **기사의 `facts`** 로만 만듭니다. `baseline: true` 기사의 사실이 기준 그래프에 들어갑니다.
```yaml
  - id: A23                     # 기사 id, 겹치지 않게
    baseline: true              # true: 기준 그래프에 반영 / false: 검증 대조용으로만
    date: 2025-03-01
    publisher: 출처 매체
    url: https://...
    title: 기사 제목
    summary: 직접 쓴 요약(원문 복사 금지)
    facts:
      - {s: "Company:rebellions", p: DEVELOPS, o: "Product:rbln-atom"}
      - {s: "Company:sk-hynix", p: SUPPLIES, o: "Company:nvidia", props: {item: HBM3E}}
      - {s: "Product:rbln-atom", p: PRODUCT_STATUS, value: mass_production}
```
- `p`는 `ontology/ontology.v1.yaml`의 `relations`에 있는 이름. 방향은 `from → to`를 지킵니다(예: `USES_COMPONENT`는 완제품 → 부품, `SUPPLIES`는 공급사 → 고객사).
- `props`에는 그 관계에 정의된 속성만. `SUPPLIES`는 `props.item`이 꼭 필요합니다.
- 마스터에 없는 제품은 `baseline: false` 기사에서만 `s: {new: 이름}` · `o_new: {class: Product, name: …}`로 씁니다.
- 온톨로지에 없는 관계(예: `PARTNERS_WITH`)는 `baseline: false` 기사에서만 씁니다(온톨로지 변경 제안 근거).

### C. 더미 메일 · 회의록 바꾸기 (`data/inputs/`)
형식은 [docs/DATA_SPEC.md](docs/DATA_SPEC.md). 요점:
- 맨 위 `---` 머리말에 `doc_id`, `kind`(mail | meeting_stt), `title`, `date`가 꼭 있어야 합니다. "어제", "3월" 같은 날짜 표현은 `date` 기준으로 풉니다.
- 메일: 한 줄 = 한 조각. 서명(`이름 | 팀 | 내선`), 고지문(`본 메일은 …`), `-----Original Message-----` 아래는 정제 단계에서 지워집니다(일부러 넣은 잡음).
- 회의록 STT: 한 줄 = `[hh:mm:ss] 화자N: 내용`. `화자N`은 머리말 `attendees`에 있어야 합니다. 영어 약어 · 숫자를 한글 발음으로 적었다면(예: "에이치비엠 쓰리 이") `ontology/phonetic.yaml`에 표기를 추가합니다.
- 일부러 넣은 함정이 있습니다. 바꾸더라도 **각 함정의 예가 하나씩은 남도록** 하면 데모 설명이 유지됩니다.
  | 함정 | 지금 예 | 데모에서 보이는 것 |
  |---|---|---|
  | 동음 별칭 | "삼성"(전자/SDI), "SK"(하이닉스/지주) | 주변 단어로 가르거나 검토로 보냄 |
  | 비슷한 코드 | H20 vs H200 | 유사도만으로 확정하지 않음 |
  | 추정 표현 | "~얘기가 돈다", "아마 ~했을 거예요" | suspected → 보류 |
  | 지시어 | "지난번처럼", "지난번 HBM 기사 정리" | 질문 항목 |
  | 온톨로지 밖 관계 | 협력 · MOU | 온톨로지 변경 후보 |
  | STT 발음 | "씨오더블유오에스 엘" → CoWoS-L | 발음 복원 |
- 바꾼 뒤: `check_data.py` → `run_all.py --live`(다시 녹화) → `run_all.py --replay` → 결과 숫자를 README에 반영.

### D. 입력 문서 추가 · 빼기
`config/demo.yaml`의 `inputs`에 `{id: 소문자id, label: 화면 이름, file: data/inputs/파일.md}`를 추가하거나 지웁니다. 화면 탭은 자동으로 생깁니다. 새 입력은 녹화본이 없으므로 `run_all.py --live`가 필요합니다.

### E. 업무 질문(CQ) 바꾸기
`config/demo.yaml`의 `cq`. Cypher 안의 `uid:'Company:…'`가 entities에 있는지 `check_data.py`가 확인합니다. 결과는 웹 "비교 · 결과" 화면과 `run_all.py` 끝에 나옵니다.

### F. 구조 변경(클래스 · 관계 추가)
`ontology/ontology.v1.yaml`에 추가하면 제약조건, LLM 프롬프트, 검증이 자동으로 따라갑니다. LLM 프롬프트가 바뀌므로 반드시 다시 녹화합니다.
`pipeline/extract.py`의 `SYSTEM` 규칙 예문(2~4, 11~12번)은 도메인 예시라 새 관계에 맞는 예를 추가하면 작은 모델의 정확도가 올라갑니다(고치면 `PROMPT_VERSION`을 올림).

## 테스트가 깨질 때
`tests/test_pipeline.py` 일부는 현재 데이터의 예(H20/H200, 삼성 전자/SDI, 기사 A02 · B01)를 씁니다.
그 예를 **일부러** 지웠다면 테스트의 예를 새 데이터에 맞게 바꿉니다. 그렇지 않다면 데이터 실수일 가능성이 큽니다.
파이프라인 규칙을 느슨하게 바꿔서 테스트를 통과시키지 않습니다.

## 하지 말 것
- `.env`를 git에 올리지 않습니다. 비밀번호 · 토큰을 다른 파일에 적지 않습니다.
- Neo4j를 이 저장소 안에 설치하지 않습니다(따로 설치, 주소만 `.env`에).
- `runs/recorded/*.json`을 손으로 고치지 않습니다(프롬프트 해시가 어긋남). 항상 `--live`로 다시 만듭니다.
- 기사 `summary`에 원문을 복사하지 않습니다(직접 요약 + `url`).
