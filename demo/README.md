# 온톨로지 구축 데모 — 반도체·AI 뉴스 KG

팀이 스크랩해 온 뉴스 기사로 만든 **기준 KG(run 0)**에 사내 **메일 1건**과 **STT 회의록 1건**을 넣습니다. 두 입력은 `수집 → 정제 → 추출 → 연결 → 검증 → 적재` 단계를 실제로 거칩니다. 마지막에 기준 상태와 비교해 무엇이 바뀌었는지 보여 줍니다.
- 그래프 변화: 새 개체, 상태 변경, 새 관계, 보류·질문
- 온톨로지 v1 → v1.1 변경 제안
- 업무 질문(CQ) 5개의 답 변화

그래프 그림은 Neo4j에 포함된 **Neo4j Browser**를 그대로 씁니다. 나머지 과정 화면만 직접 만들었습니다.

> 데이터는 모두 더미입니다.
> - 기사 코퍼스(`data/sources/news_corpus.yaml`)는 실제 공개 기사를 근거로 하되 요약은 직접 썼고, 기사마다 URL을 남겼습니다.
> - 메일·회의록과 등장인물은 가상입니다.

---

## 1. 준비물
| 항목 | 내용 |
|---|---|
| Python | 3.11 이상. 의존성은 `neo4j`, `PyYAML` 두 개뿐이고 웹 서버는 표준 라이브러리입니다 |
| Neo4j | **별도 설치.** 이 저장소에는 들어 있지 않습니다. 5.26 LTS(이 PC에서 5.26.33 Community로 확인)나 2025.x. 플러그인(APOC·GDS·n10s)은 필요 없습니다 |
| LLM | OpenAI 호환 API 서버(vLLM, 사내 게이트웨이 등). 없어도 **녹화본 재생**으로 전 과정이 돌아갑니다 |

## 2. 설치와 실행
```powershell
python -m venv .venv
```
```powershell
.\.venv\Scripts\python -m pip install -r requirements.txt
```
```powershell
Copy-Item .env.example .env
```
`.env`에서 Neo4j 주소·비밀번호와 LLM 주소를 맞춘 뒤 다음을 실행합니다.
```powershell
.\.venv\Scripts\python scripts\check_neo4j.py
```
```powershell
.\.venv\Scripts\python scripts\reset.py
```
```powershell
.\.venv\Scripts\python server\app.py
```
브라우저에서 http://localhost:8800 을 엽니다.

- 웹 없이 확인하려면: `.\.venv\Scripts\python scripts\run_all.py`
- 테스트: `.\.venv\Scripts\python -m pip install -r requirements-dev.txt` 후 `.\.venv\Scripts\python -m pytest -q`

## 3. 화면 사용법
1. **개요 · 기준 KG**: 온톨로지 v1, 기사 코퍼스, CQ의 run 0 답을 봅니다.
2. **메일 / STT 회의록 탭**: 위쪽 단계 바에서 "○○ 실행 ▶"을 눌러 한 단계씩 진행합니다. 단계마다 왼쪽은 입력, 오른쪽은 결과입니다.
3. **비교 · 결과**: run 0 대비 변화, 온톨로지 제안, CQ 전/후를 봅니다.
4. **그래프 패널**(오른쪽): Neo4j Browser입니다.
   - 버튼(기준 KG / 이 문서 / 변화 / 새 관계)을 누르면 질의가 입력창에 채워지고, Browser의 **Run**을 눌러 실행합니다.
   - 화면 배치는 위쪽 **1 설명 · 2 나란히 · 3 그래프**(키보드 1 / 2 / 3)로 바꿉니다. 기본은 "나란히"이고 그래프가 약 62%를 씁니다.
   - "나란히"에서는 가운데 경계선을 끌어 너비를 조절합니다(두 번 클릭하면 기본값). 설명 칸이 좁아지면 표와 카드가 한 줄로 쌓여 글자 크기는 그대로입니다.
   - "그래프"에서는 그래프가 화면 전체를 쓰고, 왼쪽 아래에 현재 단계의 요약 카드(제목 · 설명 · 핵심 숫자)가 뜹니다. 카드는 접을 수 있습니다.
   - 마지막으로 고른 배치와 너비는 브라우저가 기억합니다.
5. **구현 노트**: 지금 단계에서 가져다 쓴 것, 직접 만든 것, 어려웠던 점, 신경 쓴 점을 보여 줍니다.
6. **LLM 호출**: "녹화본 재생"이 기본입니다. "실시간 호출"로 바꾸면 추출 단계에서 LLM을 실제로 부르고 녹화본을 새로 저장합니다.

**Neo4j Browser 처음 한 번**
- 그래프 패널에서 비밀번호를 입력해 로그인합니다. 같은 브라우저에서는 다시 묻지 않습니다.
- 변화를 색으로 보려면 결과 범례에서 `DiffNew`, `DiffChanged`, `DiffHold` 라벨을 눌러 색을 지정합니다. Browser가 이 설정을 기억합니다.

## 4. 발표 전 체크리스트
- [ ] Neo4j 실행 중: `check_neo4j.py`가 `demo data` 또는 `empty`를 출력
- [ ] `reset.py` 실행 → 개요의 노드 57 · 관계 119
- [ ] 그래프 패널 로그인, Diff 라벨 색 지정
- [ ] LLM 호출은 "녹화본 재생"
- [ ] 메일 → STT 순서로 끝까지 실행 → 비교 화면의 새 개체 1 · 상태 변경 1 · 새 관계 2 · 보류·질문 7 · 온톨로지 후보 3 · 노드 81 · 관계 169

## 5. 문서
| 문서 | 내용 |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 구조, 단계별 입출력, 그래프 모델 |
| [docs/CUSTOMIZE.md](docs/CUSTOMIZE.md) | **다른 로컬 · 다른 데이터로 재구성하는 방법** |
| [docs/DATA_SPEC.md](docs/DATA_SPEC.md) | 입력 파일과 데이터 파일 형식 |
| [docs/DEV_NOTES.md](docs/DEV_NOTES.md) | 플랫폼으로 쓴 것과 직접 만든 것, 결정 기록, 어려웠던 점, 실서비스로 갈 때 바뀔 것 |
