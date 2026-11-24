/* v3 · P11 – P15 : 데모 범위 · 데모 안내 · 수집 · 정제 */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code } = H;
  const CTX = '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>';

  /* ------------------------------------------------------------ P11 */
  DECK.register({
    id: 'P11', steps: 4, section: '2 · 파이프라인', ctx: CTX + ' · 데모 범위', badge: '데모 실제 결과',
    title: '오늘 데모: 반도체 회의록 · 메일을 그래프에 넣어 봅니다',
    takeaway: '기준 상태를 먼저 고정하고, 새 자료 3건이 그래프를 얼마나 바꿔야 맞는지 끝까지 따라갑니다',
    src: '데모 저장소 demo/ · 가상 팹(FAB-A · FAB-B) · CMMS export · 메일 · 회의록 STT는 더미 · LLM gpt-4.1 녹화본',
    html() {
      let s = H.G.panel(134, 236, { h: 560, nodeA: 'data-v="1" data-nf', oldEdgeA: 'data-v="1" data-nf', slot: 'data-v="3-3"', newNode: 'data-v="4"', newEdges: 'data-v="4"' });
      s += t(134, 812, 796, `<span class="mono s24">노드 <b data-t="1:4|4:5">4</b> · 관계 <b data-t="1:2|4:4">2</b></span> <span class="s17 sub" data-t="1:EQ-017 주변 · 기준 상태 run 0|4:반영 후 · 전체 그래프 41 · 91 → 73 · 155">EQ-017 주변 · 기준 상태 run 0</span>`, 'center');
      const src = [['CMMS-WO@v1', 'CMMS 증분 export · WO-1042 · 중복 행 · EQ-071', 'purple'], ['DOC-M201@v1', '주간 설비회의 STT · "추정" · "지난번처럼"', 'blue'],
        ['MAIL-T311@v1', '메일 스레드 · 교체 완료 회신 (3/6)', 'blue'], ['기준 KG · run 0', '마스터 + CMMS 이력 · 알람 로그 · SOP · DOC-P088']];
      src.forEach((x, i) => { s += card(970 + (i % 2) * 416, 236 + Math.floor(i / 2) * 132, 400, 118, 'green', `<div class="mono s20 b">${x[0]}</div><div class="s16 sub">${x[1]}</div>`, 'data-v="2"'); });
      s += card(970, 510, 816, 190, 'blue', `<h5>처리 흐름</h5>
        <div class="row" style="flex-wrap:wrap;margin-top:6px">${['cmms 9', 'mail 3', 'stt 6'].map(c => chip(c, 'cand')).join('')}<span class="s22 sub">→</span>${chip('승인 7', 'ok sans')}${chip('기각 1', 'rej sans')}${chip('보류 10', 'hold sans')}</div>
        <p class="s18 c-fg" style="margin-top:10px">후보 18 → 승인 7 · 기각 1 · 보류 10 <span class="sub">· 그 밖에 온톨로지 후보 2 · 질문 1</span></p>`, 'data-v="3"');
      s += card(970, 724, 816, 228, 'mint', `<h5>데모 결과 · 반영 전후 차이 (EQ-017 주변)</h5><div class="s56 b c-mint mono" style="line-height:1.1">노드 +1 · 관계 +2</div>
        <p class="s18 c-fg" style="margin-top:8px">반영되지 않은 후보도 "왜 안 들어갔는지" 기록으로 남는다</p>`, 'data-v="4"', 'fill-mint');
      return s;
    }
  });

  /* ------------------------------------------------------------ P12 */
  DECK.register({
    id: 'P12', steps: 1, section: '3 · 데모', ctx: CTX + ' · 데모 안내', badge: '라이브 데모',
    title: '[데모] 임시 온톨로지를 Neo4j에서 봅니다',
    takeaway: '발표 화면을 잠시 떠나 Neo4j Browser와 온톨로지 YAML을 직접 보여드립니다',
    src: '데모 스키마 기준 쿼리 · demo/ontology/ontology.v1.yaml · 데모 웹의 그래프 패널에서도 실행 가능',
    focus: false,
    html() {
      let s = card(134, 240, 600, 712, 'orange', `<h5>지금</h5><div class="big40" style="margin-top:6px">Neo4j Browser로<br>전환합니다</div>
        <div class="row" style="margin-top:28px"><span class="kbd">Alt</span><span class="kbd">Tab</span><span class="s18 sub">또는 브라우저 탭 전환</span></div>
        <div style="margin-top:36px"><h5>돌아올 곳</h5><div class="s26 b">13 · 수집</div></div>
        <div style="margin-top:30px"><h5>준비물</h5>${ul(['데모 웹 · 그래프 패널 로그인 확인', '온톨로지 YAML (ontology.v1.yaml)', '데모 실패 시 백업 스크린샷'], 's18')}</div>`, '', 'fill-orange');
      const items = [
        ['라벨 · 관계 타입', 'CALL db.labels();\nCALL db.relationshipTypes();'],
        ['제약 · 인덱스', 'SHOW CONSTRAINTS;  SHOW INDEXES;'],
        ['기준 서브그래프', "MATCH (e:Equipment {fab:'FAB-A', code:'EQ-017'})-[r]-(n)\nWHERE NOT n:Chunk RETURN e, r, n;"],
        ['근거 따라가기', "MATCH (w:MaintenanceWork)-[r:ON_EQUIPMENT]->(:Equipment {fab:'FAB-A', code:'EQ-017'})\nRETURN w.code, r.sources ORDER BY w.code;"],
        ['YAML ↔ 화면 대응', 'ontology/ontology.v1.yaml  →  라벨 · 관계 · 키 · 기준 시스템']];
      items.forEach((x, i) => {
        s += card(770, 240 + i * 146, 1016, 130, 'gray', `<div class="row"><span class="num gray">${i + 1}</span><span class="s22 b">${x[0]}</span></div>${code(x[1], 's16')}`, '', 'panel');
      });
      return s;
    }
  });

  /* ------------------------------------------------------------ P13 */
  DECK.register({
    id: 'P13', steps: 5, section: '4 · 수집', ctx: CTX + ' · 01 수집', badge: '설계 가이드',
    title: '수집 ① 소스별 커넥터와 트리거를 고릅니다',
    takeaway: '소스마다 "언제, 무엇이 바뀌었는지" 아는 방법이 다르고, 그게 수집 방식을 정합니다',
    src: 'CDC 예: Debezium · 오케스트레이션 예: Airflow 3 (25장)',
    html() {
      const head = ['소스', '수집 방식', '증분 기준', '주의할 점'];
      const R = [
        [`MES / CMMS ${chip('CDC', 'prog sm')}`, 'DB 트랜잭션 로그(CDC) 또는 updated_at 폴링', '로그 위치 · 커서', '운영 DB 부하 · 읽기 전용 계정 · 폴링은 삭제를 못 봄'],
        [`메일 ${chip('구독', 'prog sm')}`, 'API 구독 · 주기 수집', '메시지 ID · 스레드 ID', '회신마다 인용 본문 중복 · 첨부 · 개인정보'],
        [`회의록 · 위키 ${chip('웹훅', 'prog sm')}`, '변경 웹훅 또는 일 배치', '문서 버전', '편집 중 초안 · 버전 정책'],
        [`공유폴더 · 개인 PC ${chip('업로드', 'hold sm')}`, '지정 폴더 동기화 · 업로드 창구', '내용 해시', '권한 · 누락 · 같은 파일 여러 사본']];
      let s = tbl(134, 240, 1652, head, R.map((r, i) => ({ a: `data-v="${i + 1}"`, c: r })), { cls: 'xl', widths: ['20%', '27%', '17%', '36%'] });
      const B = [['멱등하게 받기', '같은 이벤트가 두 번 와도 결과가 같게 — 원본 ID + 버전 · 해시를 키로'], ['삭제는 어떻게?', '원본에서 지워진 문서의 사실은 삭제할까, 무효화할까'], ['오케스트레이션', '소스별 DAG · 실패 재시도 · 과거 구간 재처리(백필)']];
      B.forEach((b, i) => { s += card(134 + i * 556, 700, 540, 140, 'green', `<h4>${b[0]}</h4><p>${b[1]}</p>`, 'data-v="5"'); });
      s += card(134, 862, 1652, 90, 'orange', `<div class="s22"><b class="c-orange">함께 고민할 점</b> · 개인 PC에만 있는 자료는 어떻게 들어오게 할까? 강제 업로드 vs 질문 큐로 요청</div>`, 'data-v="5"', 'fill-orange');
      return s;
    }
  });

  /* ------------------------------------------------------------ P14 */
  DECK.register({
    id: 'P14', steps: 4, section: '4 · 수집', ctx: CTX + ' · 01 수집', badge: '데모 회의록 STT',
    title: '수집 ② 원본은 바꾸지 않고, 받은 기록을 남깁니다',
    takeaway: '원본과 수집 기록이 있어야 틀린 사실을 원문과 대조하고, 그 원본만 다시 처리할 수 있습니다',
    src: 'W3C PROV-O (출처 표현) · medallion 레이어 구분 · 값은 예시',
    html() {
      let s = card(134, 240, 520, 342, 'green', `<h5>원본 · 수정 금지</h5><div class="mono s22 b">DOC-M201@v1</div>
        <div class="quote s18" style="margin-top:10px">[00:00:04] 화자1: 네 어 … 에이동 십칠 호기 압력 이상 건입니다<br>[00:00:33] 화자2: 원인은 피티 브이 사십이 열화로 추정하고 있습니다<br>[00:01:35] 화자1: 그 건은 지난번처럼 처리하기로 하죠</div>`, 'data-v="1"');
      s += card(690, 240, 560, 342, 'purple', `<h5>수집 기록 (메타데이터)</h5><div class="kv s16">
        <div><span class="k">source_system</span> <span class="v">groupware · STT</span></div>
        <div><span class="k">source_id</span> <span class="v">MTG-2026-0304-EQ</span></div>
        <div><span class="k">version · sha256</span> <span class="v">v1 · cde3…8c9f</span></div>
        <div><span class="k">created_at</span> <span class="v">2026-03-04</span></div>
        <div><span class="k">ingested_at</span> <span class="v">2026-03-05 02:00</span></div>
        <div><span class="k">attendees</span> <span class="v">4명 (설비기술 · 생산 · 공정)</span></div>
        <div><span class="k">series</span> <span class="v">주간 설비회의 #12</span></div>
        <div><span class="k">acl · stt</span> <span class="v">설비팀 · dummy-stt</span></div></div>`, 'data-v="2"');
      s += card(1286, 240, 500, 160, 'mint', `<h5>v2 도착 · 내용 해시가 다름</h5><div class="mono s20 b">DOC-M201@v2</div><p class="c-fg">새 버전으로 추가 · <b>v1은 그대로</b> 남김</p>`, 'data-v="3"');
      s += card(1286, 422, 500, 160, 'gray', `<h5>같은 파일 다시 수신 · 해시 같음</h5><div class="mono s20 b">DOC-M201@v1</div><p class="c-fg">건너뜀 · 결과 변화 없음 (멱등)</p>`, 'data-v="3"');
      const W = [['원본과 대조', '추출이 틀리면 원문 위치로 바로 가서 확인'], ['그 원본만 재처리', '규칙 · 프롬프트를 고친 뒤 영향받는 원본만 다시'], ['그래프 재구축', '그래프는 원본에서 다시 만들 수 있는 사본']];
      W.forEach((w, i) => { s += card(134 + i * 556, 614, 540, 176, 'mint', `<span class="num mint">${i + 1}</span><h4 style="margin-top:8px">${w[0]}</h4><p>${w[1]}</p>`, 'data-v="4"'); });
      s += card(134, 818, 1652, 134, 'gray', `<h5>레이어로 나누면 (medallion)</h5><div class="row" style="gap:14px;margin-top:8px">${chip('bronze · 원본 + 수집 기록', 'src lg sans')}<span class="s22 sub">→</span>${chip('silver · 정제 결과 · 후보', 'llm lg sans')}<span class="s22 sub">→</span>${chip('gold · 승인된 사실 · 그래프', 'okl lg sans')}</div>`, 'data-v="4"', 'panel');
      return s;
    }
  });

  /* ------------------------------------------------------------ P15 */
  DECK.register({
    id: 'P15', steps: 4, section: '4 · 정제', ctx: CTX + ' · 02 정제', badge: '데모 메일',
    title: '정제 ① 잡음을 걷어내고 형식을 맞춥니다',
    takeaway: '메일 회신의 인용 본문을 그대로 두면 같은 사실이 회신 수만큼 추출됩니다',
    src: '파싱 도구 키워드: Docling · Unstructured · Apache Tika',
    html() {
      const L = [
        ['<span class="sub mono s16">From: 김OO · Subject: RE: RE: EQ-017 압력 이상</span>', ''],
        ['3/6 오후에 <b>P/T V-42</b> 교체 완료했습니다. 압력은 정상 범위로 돌아왔습니다.', ''],
        ['-----Original Message-----', 'x'],
        ['&gt; 원인은 PT-V42 열화로 추정되며, 교체 후 재확인 예정', 'x'],
        ['&gt; 3/4 회의 결과 공유드립니다', 'x'],
        ['김OO 책임 | 설비기술팀 | 내선 0000', 'x'],
        ['본 메일은 사내 기밀 정보를 포함하고 있으며…', 'x']];
      let inner = '<h5>메일 원문 · MAIL-T311@v1</h5>';
      L.forEach(([txt, x]) => { inner += `<div class="s19" style="margin:12px 0" ${x ? 'data-c="strike-on@2-4"' : ''}>${txt}</div>`; });
      let s = card(134, 240, 780, 520, 'green', inner, 'data-v="1"');
      s += card(950, 240, 836, 184, 'purple', `<h5>중복 · 잡음 제거</h5>${ul(['인용 본문 제거 → 스레드 단위로 다시 묶기', '서명 · 법적 고지문 제거', '사본은 지우지 않고 대표 문서 + 사본 링크로'], 's18')}`, 'data-v="2"');
      s += tbl(950, 450, 836, ['원문', '정규화', '근거'], [
        ['3/6 오후', '<span class="mono">2026-03-06</span>', '문서 작성일 기준 해석'],
        ['P/T V-42', '<span class="mono">PT-V42</span>', '용어 사전 altLabel'],
        ['PM', '예방정비', '설비 맥락에서만'],
        ['500 mTorr', '<span class="mono">0.5 Torr</span>', '기준 단위 + 원래 값 보존']], { a: 'data-v="3"', cls: 'mid', widths: ['24%', '30%', '46%'] });
      s += card(134, 790, 1652, 162, 'orange', `<div class="row" style="align-items:flex-start;gap:40px">
        <div style="flex:1.2"><h5>파싱에서 지킬 것</h5><p class="s19 c-fg">표 구조 · 페이지/문단 위치 · 첨부 — 근거 위치를 가리키려면 위치 정보가 살아 있어야 한다</p></div>
        <div style="flex:1"><h5>함께 고민할 점</h5><p class="s19 c-fg">용어 사전은 누가 소유하고, 누가 고치나?</p></div></div>`, 'data-v="4"');
      return s;
    }
  });
})();
