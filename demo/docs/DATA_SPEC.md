# 데이터 형식

모든 데이터는 가상입니다. 부품 · 고장 용어와 설비 상태 분류만 공개된 일반 지식을 따랐습니다.

## 입력 (`data/inputs/`)
`config/demo.yaml`의 `inputs` 순서대로 넣습니다: CMMS → 메일 → 회의록 STT. 정제 방식은 `kind`로 정해집니다.

### CMMS 작업기록 export (`kind: cmms_csv`) — 정형
CSV라 머리말이 없습니다. 문서 id · 종류 · 작성 시각은 `config/demo.yaml`의 `inputs[].meta`에 둡니다.
```csv
wo_id,fab,eq_code,serial,work_type,part,status,started_at,completed_at,technician,description,updated_at
WO-1042,FAB-A,EQ-017,SN-A017,CM,P/T V-42,completed,2026/03/06 13:10,2026/03/07 10:20,김OO,...,2026-03-07 10:25
```
- 한 행 = 한 조각. `wo_id + updated_at`가 같은 행이 또 오면 중복으로 지웁니다(`cleaning.cmms.key_columns`).
- 날짜는 `cleaning.cmms.datetime_formats` 중 하나로 읽어 `YYYY-MM-DD HH:MM`으로 맞춥니다.
- 열 → 관계 매핑은 `cmms_mapping`(LLM 없음). 설비는 `fab + eq_code`로 찾습니다.
- 데모 파일에는 일부러 넣은 문제가 있습니다: 중복 행(WO-1042), 부품 표기 흔들림(`P/T V-42`), 없는 설비 코드(WO-1044의 `EQ-071`).

### 메일 (`kind: mail`)
```markdown
---
doc_id: MAIL-T311                # 필수 · 문서 id (그래프의 Document.doc_id)
kind: mail                       # 필수
title: "RE: RE: EQ-017 압력 이상" # 필수
from: 이름 <주소>
to: 받는 사람
date: 2026-03-06 18:05           # 필수 · '3/6', '금요일' 같은 날짜 표현의 기준
thread_id: THR-...
---
본문 (한 줄 = 한 조각)

이름 직급 | 팀 | 내선          ← 서명 패턴 (config cleaning.mail.signature_patterns)
본 메일은 ...                ← 고지문 패턴
-----Original Message-----   ← 이 줄부터 끝까지 이전 메일로 보고 제거
> 인용 줄                    ← '>'로 시작하면 제거
```

### 회의록 STT (`kind: meeting_stt`)
```markdown
---
doc_id: DOC-M201
kind: meeting_stt
source_id: MTG-2026-0304-EQ      # 그룹웨어 쪽 원본 id
title: 주간 설비회의 #12 (STT 자동 기록)
series: 주간 설비회의             # "지난번처럼"을 풀 때 같은 시리즈를 찾는 단서
date: 2026-03-04
attendees:                       # STT 화자 라벨 → 사람
  화자1: 이OO 파트장 (설비기술)
---
[00:00:04] 화자1: 발화 내용       ← [hh:mm:ss] 화자: 내용  (한 줄 = 한 발화)
[00:01:28] 화자1: (불명확) ...    ← 불명확 표시 (config cleaning.stt.unclear_marker)
```

## 마스터 개체 (`data/sources/entities.yaml`)
```yaml
entities:
  - {class: Equipment, fab: FAB-A, code: EQ-017, name: FAB-A/EQ-017, serial: SN-A017, model: ETCH-X300}
  - {class: PartType, code: PT-V42, name: PT-V42 압력센서 (정전용량형 진공 게이지)}
  - {class: MaintenanceWork, code: WO-1041, name: WO-1041 PT-V42 교정 (PM), status: completed, completed_at: "2026-02-10 14:30"}
```
- uid는 온톨로지의 `key`로 만듭니다. 설비는 `key: [fab, code]`라 `Equipment:FAB-A/EQ-017`입니다. **EQ-017은 두 FAB에 다 있습니다.**
- `fab`은 `LOCATED_IN`, `model`은 `INSTANCE_OF`, `vendor`는 `MADE_BY` 관계로도 만들어집니다. 그 밖의 필드는 노드 속성이 됩니다.
- 이름과(키가 코드 하나뿐인 클래스는) 코드가 용어 사전에 자동으로 들어갑니다. 설비 코드는 넣지 않습니다.
- `prompt: false`인 개체는 그래프와 사전에는 있지만 LLM 프롬프트의 "알려진 개체" 목록에서는 빠집니다. 이 목록이 바뀌면 프롬프트 해시가 달라지므로 발표 전에 `LLM_MODE=live`로 다시 녹화합니다.

## 기준 자료 (`data/sources/reference_docs.yaml`)
```yaml
docs:
  - id: CMMS-HIST
    baseline: true
    official: cmms                # 기준 시스템 — 정비 작업은 CMMS가 기준
    kind: cmms
    date: 2026-03-01
    system: CMMS (정비 관리 시스템)
    source: cmms.work_order · 2026-03-01 00:00 증분 동기화
    title: ...
    summary: ...
    facts:
      - {s: "MaintenanceWork:WO-1041", p: ON_EQUIPMENT, o: "Equipment:FAB-A/EQ-017"}
      - {s: "Equipment:FAB-A/EQ-017", p: EQUIPMENT_STATE, value: unscheduled_down}   # 속성 사실
```
- `official: cmms | alarm_log`인 자료는 검증의 **기준 시스템**입니다. 문서가 다르면 덮어쓰지 않고 보류합니다.
- 나머지(SOP · 회의자료 · BOM · FMEA · 공급사 공지)는 기준 KG를 만드는 승인 문서입니다.

## 용어 사전 (`ontology/lexicon.v1.yaml`)
```yaml
terms:
  - {ref: "Equipment:FAB-A/EQ-017", pref: FAB-A/EQ-017, alt: [A동 17호기, SN-A017]}
  - {ref: "Equipment:FAB-A/EQ-017", pref: FAB-A/EQ-017, alt: [EQ-017, 17호기], ambiguous: true,
     context: [A동, FAB-A]}                    # 같은 코드의 두 설비를 가를 때 쓰는 맥락 단어
  - {ref: "PartType:PT-V42", pref: PT-V42, alt: [P/T V-42, 압력센서 V42]}
```

## STT 발음 표 (`ontology/phonetic.yaml`)
- `map`: 그대로 바꿀 것 (`피티 브이 사십이: PT-V42`, `오백 밀리토르: 500 mTorr`)
- `after`: 앞 단어가 맞을 때만 바꿀 것 (일반 음절과 겹치는 발음용, 이 데모에서는 비어 있음)
