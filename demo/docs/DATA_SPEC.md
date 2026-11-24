# 데이터 형식

## 입력 문서 (`data/inputs/*.md`)
YAML 머리말 + 본문 형식입니다. `kind`에 따라 정제 방식이 정해집니다.

### 메일 (`kind: mail`)
```markdown
---
doc_id: MAIL-2024-0927-01        # 필수 · 문서 id (그래프의 Document.doc_id)
kind: mail                       # 필수
title: "RE: RE: ..."             # 필수
from: 이름 <주소>
to: 받는 사람
date: 2024-09-27 09:12           # 필수 · '어제', '3월' 같은 상대 날짜의 기준
thread_id: THR-...
---
본문 (한 줄 = 한 조각)

이름 | 팀 | 내선           ← 서명 패턴 (config cleaning.mail.signature_patterns)
본 메일은 ...               ← 고지문 패턴
-----Original Message-----  ← 이 줄부터 끝까지 이전 메일로 보고 제거
> 인용 줄                   ← '>'로 시작하면 제거
```

### STT 회의록 (`kind: meeting_stt`)
```markdown
---
doc_id: MTG-2025-0120-W
kind: meeting_stt
title: ...
date: 2025-01-20
stt_engine: dummy-stt
attendees:                       # STT 화자 라벨 → 사람
  화자1: 박팀장 (리서치팀)
---
[00:00:05] 화자1: 발화 내용       ← [hh:mm:ss] 화자: 내용  (한 줄 = 한 발화)
[00:01:41] 화자3: (불명확) ...    ← 불명확 표시 (config cleaning.stt.unclear_marker)
```

## 마스터 개체 (`data/sources/entities.yaml`)
```yaml
entities:
  - {class: Company, code: sk-hynix, name: SK hynix, country: kr}   # uid = Company:sk-hynix
  - {class: Product, code: skh-hbm3e-8h, name: SK hynix HBM3E 8단, status: sampling}
```
`country`는 `HEADQUARTERED_IN`, `issued_by`는 `ISSUED_BY`, `targets`는 `TARGETS` 관계로 바뀝니다. 그 밖의 필드는 노드 속성이 됩니다.

`prompt: false`인 개체는 기준 그래프와 용어 사전에는 들어가지만, LLM 추출 프롬프트의 "알려진 개체" 목록에서는 빠집니다. 프롬프트에는 감시 주제(HBM 공급망)에 필요한 개체만 넣어 길이를 관리합니다. 이 목록을 바꾸면 프롬프트 해시가 달라지므로 발표 전에 `LLM_MODE=live`로 다시 녹화해야 합니다. 기준 그래프만 키우려면 새 개체에 `prompt: false`를 붙이면 녹화본을 그대로 쓸 수 있습니다.

관계의 `key`(온톨로지)는 관계의 정체성에 포함되는 속성입니다. 예를 들어 `SUPPLIES`는 `key: [item]`이라 SK hynix → NVIDIA `{item: HBM3}`와 `{item: HBM3E}`가 서로 다른 관계로 저장되고, 원천 대조도 품목이 같은 기사만 근거로 인정합니다.

## 기사 코퍼스 (`data/sources/news_corpus.yaml`)
```yaml
articles:
  - id: B01
    baseline: false            # true: 기준 KG를 만듦 / false: 검증 때 대조만
    date: 2024-03-19
    publisher: ...
    url: https://...
    title: 우리 말로 쓴 제목
    summary: 우리 말로 쓴 요약 (기사 본문을 복사하지 않음)
    facts:
      - {s: "Product:skh-hbm3e-8h", p: PRODUCT_STATUS, value: mass_production}
      - {s: "Company:sk-hynix", p: SUPPLIES, o: "Company:nvidia", props: {item: HBM3E}}
      - {s: "Company:sk-hynix", p: DEVELOPS, o_new: {class: Product, name: ...}}   # 마스터에 없는 개체
      - {s: "Company:sk-hynix", p: PARTNERS_WITH, o: "Company:tsmc"}             # 온톨로지 밖 관계도 대조용으로 둘 수 있음
```

## 용어 사전 (`ontology/lexicon.v1.yaml`)
```yaml
terms:
  - {ref: "Company:sk-hynix", pref: SK hynix, alt: [SK하이닉스, 하이닉스], hidden: [hynix],
     context: [메모리, HBM]}                       # 동음 별칭을 가를 때 쓰는 맥락 단어
  - {ref: "Company:sk-inc", pref: SK Inc., alt: [SK], ambiguous: true, context: [지주]}
```

## STT 발음 표 (`ontology/phonetic.yaml`)
- `map`: 그대로 바꿀 것 (`에이치비엠: HBM`)
- `after`: 앞 단어가 맞을 때만 바꿀 것 (`{prev: CoWoS, say: 엘, write: "-L"}`)

## 산출물 (`runs/`)
| 파일 | 내용 |
|---|---|
| `runs/<input>/<step>.json` | 단계 산출물 (웹이 읽음). git에 넣지 않음 |
| `runs/recorded/<input>_extract.json` | LLM 녹화본: 요청 메시지, 응답, 모델, 시간, 프롬프트 해시. **git에 넣음** |
| `runs/cq_run0.json` | 초기화 시점의 CQ 답 |
| `runs/ontology.v1.1.proposal.yaml` | 온톨로지 변경 제안 |
