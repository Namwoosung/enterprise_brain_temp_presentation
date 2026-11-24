# 이 저장소에서 일하는 AI 에이전트 · 사람을 위한 안내

두 부분이 서로 독립입니다. 작업할 부분의 안내를 먼저 읽습니다.

| 폴더 | 내용 | 안내 | 고친 뒤 검사 |
|---|---|---|---|
| `presentation/` | 발표자료(HTML, 32장, 설비 정비 시나리오) | [presentation/AGENTS.md](presentation/AGENTS.md) | `python presentation/tools/check_deck.py` |
| `demo/` | 온톨로지 구축 데모(Python + Neo4j, 반도체 · AI 뉴스 도메인) | [demo/AGENTS.md](demo/AGENTS.md) | `demo` 폴더에서 `python scripts/check_data.py` → `python -m pytest -q` |

그 밖에 `qna_notes.md`(질문 기록, Q 번호 순)와 `study/`(학습 자료)가 있습니다. 질문에 답하면 `qna_notes.md` 끝에 다음 번호로 추가하고, 길어지면 `study/`에 문서를 만들어 링크합니다.

## 공통 규칙
- 작업 전에 바꿀 파일만 엽니다. 발표자료는 **한 장 = 한 파일**(`presentation/js/slides/<id>.js`), 데모 데이터는 `demo/data/`와 `demo/ontology/`의 YAML입니다.
- 고친 뒤 위 검사를 돌려 `OK`가 나올 때까지 고칩니다. 검사 결과를 보고 없이 "완료"라고 하지 않습니다.
- 반복되는 기계적 작업은 도구를 씁니다: 장 추가(`presentation/tools/new_slide.py`), 스텝 넣기 · 합치기(`presentation/tools/step.py`), LLM 다시 녹화(`demo/scripts/run_all.py --live`).
- 글은 한국어, 문장은 짧게. 기존 표기(가운뎃점 ` · `, 화살표 `→`)를 따릅니다.
- `demo/.env`(비밀번호 · 주소)는 git에 올리지 않습니다. Neo4j는 저장소 밖에 따로 설치합니다.
- 데모 LLM은 `demo/.env`의 `LLM_BASE_URL`(기본 `http://localhost:10000/v1`, vLLM 등 OpenAI 호환 서버)로 연결됩니다. 연결 확인: `demo` 폴더에서 `python scripts/check_llm.py`.
- 발표자료와 데모는 도메인이 다릅니다(덱: 설비 정비, 데모: 뉴스). 한쪽을 바꿨다고 다른 쪽을 맞추지 않습니다(요청이 있을 때만).
