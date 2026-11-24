# 사내 지식 그래프 · 온톨로지 구축 — 발표자료와 데모

온톨로지 기반 지식 그래프(KG)를 만드는 과정을 설명하는 발표자료와, 그 과정을 실제로 돌려 보는 데모입니다.
- 발표자료는 사내 반도체 팹의 설비 정비 도메인(설비 · 부품 · 정비 작업 · CMMS)을 예로 듭니다.
- 데모는 같은 과정을 반도체 · AI 뉴스 기사 도메인으로 보여 줍니다. 공개 기사로 기준 KG를 만들고, 가상의 사내 메일 1건과 회의록 STT 1건을 넣습니다.

> 데모의 기사 요약은 공개 기사를 근거로 직접 썼고 기사마다 URL을 남겼습니다. 메일 · 회의록과 등장인물은 가상입니다.

## 구성
| 폴더 | 내용 |
|---|---|
| [`presentation/`](presentation/) | 발표자료(31장, HTML). 빌드 없이 브라우저로 엽니다 |
| [`demo/`](demo/) | 온톨로지 구축 데모(Python + Neo4j, 반도체 · AI 뉴스 KG). 설치와 사용법은 [demo/README.md](demo/README.md) |

## 발표자료 보기
- `presentation/index.html`을 브라우저로 엽니다. 서버가 필요 없습니다.
- 넘기기: `→` `↓` `Space` / 뒤로: `←` `↑`. 주소 끝에 `#P11-1`처럼 붙이면 해당 장의 해당 단계로 바로 갑니다.
- 발표자 노트: `presentation/notes.html`을 다른 창에 열면 발표 화면의 위치를 따라갑니다(같은 브라우저).

## 데모 실행 요약
자세한 내용은 [demo/README.md](demo/README.md)와 [demo/docs/CUSTOMIZE.md](demo/docs/CUSTOMIZE.md)를 보세요.
1. **Neo4j는 이 저장소에 없습니다.** Neo4j 5.26 Community(zip 배포판 등)를 저장소 밖에 따로 설치하고 실행합니다. 플러그인은 필요 없습니다.
2. `demo/.env.example`을 `demo/.env`로 복사하고 Neo4j 주소 · 비밀번호, LLM 주소를 적습니다. `.env`는 git에 올라가지 않습니다.
3. LLM 서버가 없어도 저장된 녹화본(`demo/runs/recorded/`)을 재생해 전 과정이 돌아갑니다. `.env`에 `LLM_MODE=replay`를 두면 항상 녹화본을 씁니다.
4. `demo/` 폴더에서 가상환경을 만들고 `scripts/check_neo4j.py` → `scripts/reset.py` → `server/app.py` 순서로 실행한 뒤 http://localhost:8800 을 엽니다.
