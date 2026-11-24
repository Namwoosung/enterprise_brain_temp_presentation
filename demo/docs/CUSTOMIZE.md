# 다른 로컬 · 다른 데이터로 재구성하기

바꿀 곳은 다음 네 군데와 코드의 `# CUSTOMIZE:` 표시뿐입니다.

| 바꿀 것 | 파일 |
|---|---|
| 기계마다 다른 값 | `.env` |
| 입력 목록 · 임계값 · 정제 패턴 · CQ · Browser 질의 | `config/demo.yaml` |
| 온톨로지 · 용어 사전 · STT 발음 표 | `ontology/` |
| 마스터 개체 · 기사 코퍼스 · 입력 문서 | `data/` |

코드에서 `CUSTOMIZE`를 검색하면 도메인에 묶인 곳이 나옵니다.

---

## 1. clone 후 처음 실행 (Neo4j를 별도 디렉터리에 설치한 경우)
1. Neo4j를 설치하고 실행합니다.
   - 배포판은 Neo4j Deployment Center에서 받습니다. 이 저장소 **밖**의 폴더에 풉니다.
   - zip 배포판(5.26 Community 기준) 예: Java 17 또는 21이 필요합니다. 압축을 푼 폴더에서 처음 한 번 비밀번호를 정하고 실행합니다.
     ```powershell
     .\bin\neo4j-admin dbms set-initial-password <비밀번호>
     ```
     ```powershell
     .\bin\neo4j console
     ```
   - Docker로 띄워도 됩니다. 데모는 주소와 포트만 씁니다.
   - GitHub 소스로 직접 빌드했다면 `http://<host>:7474/browser/`가 열리는지 먼저 확인합니다. Browser가 없으면 그래프 패널을 쓸 수 없고, 나머지 화면은 동작합니다.
2. `.env.example`을 `.env`로 복사하고 다음을 맞춥니다.
   - `NEO4J_URI`, `NEO4J_PASSWORD`, `NEO4J_HTTP_URL`: Neo4j 설치 위치와 무관하게 **주소와 포트만** 알면 됩니다.
   - `NEO4J_DATABASE`: Community는 `neo4j`
3. `python scripts/check_neo4j.py`로 버전, 에디션, 쓰기 권한, 기존 데이터를 확인합니다.
   - 기존 데이터가 있는 DB를 쓰면 `reset.py`가 멈춥니다. 데모 전용 DB나 인스턴스를 쓰세요. 정말 지워도 되면 `--force`를 붙입니다.
4. `python scripts/reset.py` → `python server/app.py`

**망분리 환경이라 pip을 못 쓰면** 인터넷 되는 PC에서 wheel을 받아 옮깁니다.
```powershell
pip download -r requirements.txt -d wheels
```
옮긴 뒤 설치합니다.
```powershell
pip install --no-index --find-links wheels -r requirements.txt
```

## 2. LLM 바꾸기
- `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`만 바꿉니다. `/v1/models`와 `/v1/chat/completions`를 제공하는 OpenAI 호환 서버면 됩니다(vLLM, 사내 게이트웨이 등).
- JSON 출력(`response_format: json_object`)을 지원하지 않는 서버라면 `pipeline/llm.py`의 `json_mode` 처리를 바꿉니다. vLLM은 이 형식을 지원합니다.
- 연결 확인: `python scripts/check_llm.py` (서버 응답 · 모델 이름 · JSON 응답을 확인).
- 오픈웨이트 모델(vLLM)용 설정: `LLM_EXTRA_BODY`(요청에 합칠 JSON, 예: Qwen3 계열의 생각 모드 끄기 `{"chat_template_kwargs": {"enable_thinking": false}}`), `LLM_JSON_MODE`(response_format 사용 여부), `LLM_TIMEOUT`(초). 응답의 `<think>` 블록 · 코드 울타리 · 앞뒤 설명은 파서가 걷어 냅니다.
- 모델이 바뀌면 추출 결과도 달라집니다. 화면에서 "실시간 호출"로 한 번 실행하거나 `python scripts/run_all.py --live`로 실행해 **저장된 호출(`runs/recorded/*.json`)을 새로 만든 뒤** 발표에는 재생 모드를 씁니다.
- 프롬프트는 `pipeline/extract.py`의 `SYSTEM`입니다. 고치면 `PROMPT_VERSION`을 올립니다. 화면은 저장 이후 프롬프트가 바뀌었는지 경고합니다.

## 3. 데이터 바꾸기 (같은 도메인)
| 바꿀 것 | 파일 | 주의 |
|---|---|---|
| 마스터 개체 | `data/sources/entities.yaml` | `class`는 온톨로지 클래스, `code`는 uid가 됨 |
| 기사 코퍼스 | `data/sources/news_corpus.yaml` | `baseline: true`는 기준 KG에, `false`는 검증 대조용 |
| 입력 문서 | `data/inputs/*.md` + `config/demo.yaml`의 `inputs` | 형식은 `DATA_SPEC.md` |
| 별칭 · 동음 단어 | `ontology/lexicon.v1.yaml` | 동음 별칭은 `ambiguous: true` + `context` 단어 |
| STT 발음 | `ontology/phonetic.yaml` | 일반 음절과 겹치면 `after` 규칙(앞 단어 조건)으로 |
| CQ | `config/demo.yaml`의 `cq` | uid가 바뀌면 함께 고침 |

바꾼 뒤에는 `reset.py`를 실행하고, LLM 저장된 호출을 새로 만듭니다.

## 4. 도메인 바꾸기 (예: 설비 정비, 계약 문서)
1. `ontology/ontology.v1.yaml`: 클래스(`key`, `required`, `enums`)와 관계(`from`, `to`, `fact`, `props`), `property_facts`를 새로 씁니다.
   - 유니크 제약: `graph.create_constraints`
   - 추출 프롬프트의 관계 목록: `extract.schema_text`
   - 스키마 검사: `validate.check_fact`

   셋 모두 이 파일에서 자동으로 만들어집니다.
2. `pipeline/extract.py`의 `SYSTEM` 규칙 예시(공급·양산 등)를 새 도메인 예시로 바꿉니다. `# CUSTOMIZE`
3. `pipeline/validate.py`의 "원천 대조"를 새 도메인의 원천으로 바꿉니다. 지금은 기사 코퍼스이고, 예컨대 CMMS·ERP 표가 될 수 있습니다.
4. `config/demo.yaml`의 `validate.high_risk`, `cleaning` 패턴, `views`의 Cypher를 맞춥니다.
5. `pipeline/resolve.py`의 "회사 이름으로 제품 지칭" 규칙(`_company_for_product`)은 이 도메인 전용입니다. 필요 없으면 지우거나 바꿉니다.

## 5. 입력 형식 바꾸기
- 실제 메일(`.eml`), 실제 STT JSON 등은 **변환기를 하나 두어 지금의 md 형식으로 바꾸는 것**이 가장 쉽습니다. 머리말 + 본문 형식입니다.
- 직접 읽으려면 `pipeline/clean.py`에 `kind`별 함수(`clean_mail`, `clean_stt`처럼)를 추가하고 `run()`의 분기에 넣습니다.

## 6. 화면 문구와 그래프 질의
- 단계 이름: `config/demo.yaml`의 `steps`
- 그래프 패널 버튼의 Cypher: `config/demo.yaml`의 `views`. `$doc_id`, `$run_id`는 화면이 채웁니다.
- "구현 내용" 패널 내용: `docs/dev_work.yaml` (코드 위치는 함수 이름으로 적고, 테스트가 실제로 있는지 확인)
