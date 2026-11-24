/* v3 · P16 – P20 : ER · 추출 · 스키마 검증 */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code } = H;
  const CTX = '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>';

  /* ------------------------------------------------------------ P16 */
  DECK.register({
    id: 'P16', steps: 5, section: '4 · 정제', ctx: CTX + ' · 02 정제', badge: '개념 · 공개 자료',
    title: '정제 ② Entity resolution: 같은 대상을 같은 ID로',
    takeaway: '이름이 같다는 건 약한 증거입니다 — 애매하면 합치지 않고 후보로 남깁니다',
    src: 'Fellegi & Sunter (1969) · Splink (UK MoJ) · Neo4j GraphRAG Python KG Builder 문서',
    html() {
      const P = [['정규화', '코드 · 이름 형태 맞추기'], ['블로킹', '비교할 쌍 줄이기'], ['쌍 비교', '필드별 유사도'], ['판정', '규칙 → 확률 → 사람'], ['대표 ID', '클러스터 · 대표 레코드']];
      let s = '', ln = '';
      P.forEach((p, i) => {
        s += card(134 + i * 336, 240, 310, 96, 'purple', `<div class="s22 b">${p[0]}</div><div class="s16 sub">${p[1]}</div>`, 'data-v="1"');
        if (i < 4) ln += path(`M${134 + i * 336 + 312},288 H${134 + (i + 1) * 336 - 4}`, 'purple', { a: 'data-v="1"' });
      });
      s += svg(ln);
      s += card(134, 366, 800, 286, 'gray', `<h5>블로킹 · 같은 FAB · 같은 장비군끼리만 비교</h5>
        <div class="row" style="align-items:flex-start;gap:16px;margin-top:10px">
          <div class="card flat" style="flex:1;padding:10px 12px"><div class="mono s16 sub">block: FAB-A</div>${chip('FAB-A/EQ-017', 'gray')}${chip('A동 17호기', 'gray sans')}${chip('PT-V42', 'gray')}${chip('압력센서 V42', 'gray sans')}</div>
          <div class="card flat" style="flex:1;padding:10px 12px"><div class="mono s16 sub">block: FAB-B</div>${chip('FAB-B/EQ-017', 'gray')}${chip('B동 17호기', 'gray sans')}</div></div>
        <p class="s17" style="margin-top:10px">모든 쌍 비교는 n² · 블록을 너무 좁히면 진짜 짝을 놓치고, 그 놓침은 측정이 어렵다</p>`, 'data-v="2"');
      const pairs = [['PT-V42', '압력센서 V42', 'ok', '같음'], ['FAB-A/EQ-017', 'FAB-B/EQ-017', 'rej', '다름'], ['WO-1042', '메일 "3/6 센서 교체"', 'hold', '검토']];
      pairs.forEach((p, i) => {
        s += card(970, 366 + i * 98, 816, 86, 'gray', `<div class="row" style="height:100%">${chip(p[0], 'gray')}<span class="s22 sub">↔</span>${chip(p[1], 'gray')}<span style="margin-left:auto" class="stamp ${p[2]}">${p[3]}</span></div>`, 'data-v="3"', 'panel');
      });
      s += card(134, 680, 800, 272, 'blue', `<h5>왜 "이름만 같음"은 약한 증거인가 · Fellegi-Sunter</h5>
        <p class="s17 c-fg" style="margin-top:4px"><b>m</b> = 진짜 같은 대상일 때 일치할 확률 · <b>u</b> = 남인데 우연히 일치할 확률</p>
        <table class="tb tight" style="margin-top:6px"><tr><td class="k">코드 EQ-017 일치</td><td>u 높음 (FAB마다 코드 재사용) → <b class="c-orange">약함</b></td></tr>
        <tr><td class="k">FAB + 코드 + 일련번호 일치</td><td>u 매우 낮음 → <b class="c-mint">강함</b></td></tr></table>
        <p class="s17" style="margin-top:8px"><b class="c-red">함정</b> · Neo4j <span class="mono">SimpleKGPipeline</span> 기본 ER은 같은 라벨 + 같은 이름을 병합 → EQ-017 두 대를 합친다</p>`, 'data-v="4"');
      s += card(970, 680, 816, 272, 'mint', `<h5>정책</h5>
        <table class="tb tight"><tr><td class="k c-red">잘못 합침</td><td>두 설비 이력이 섞임 · 되돌리기 어려움</td></tr><tr><td class="k c-orange">못 합침</td><td>검색 누락 · 나중에 합치기는 쉬움</td></tr></table>
        <p class="s19 c-fg" style="margin-top:8px">→ 애매하면 <b class="c-mint">SAME_AS 후보</b>로 남기고 검토 · 내부 ID와 업무 키(FAB+코드) 분리</p>
        <p class="s17" style="margin-top:6px"><b class="c-orange">함께 고민할 점</b> · 우리에게 더 비싼 실수는 어느 쪽인가?</p>`, 'data-v="5"', 'fill-mint');
      return s;
    }
  });

  /* ------------------------------------------------------------ P17 */
  DECK.register({
    id: 'P17', steps: 4, section: '4 · 추출', ctx: CTX + ' · 03 추출', badge: '설계 예시',
    title: '추출 ① 온톨로지와 출력 스키마를 먼저 정합니다',
    takeaway: '정의는 YAML 한 곳에 두고, LLM 출력 스키마 · 검증 코드 · DB 제약은 거기서 만들어 냅니다',
    src: 'Neo4j GraphRAG Python · SimpleKGPipeline schema 옵션 · YAML은 자체 설계 예시',
    html() {
      let s = card(134, 240, 480, 420, 'red', `<h5>스키마 없이 문서 3건에서</h5>
        <table class="tb tight" style="margin-top:6px"><tr><th>문서</th><th>노드</th><th>관계</th></tr>
        <tr><td class="k mono s15">DOC-M201</td><td>Sensor</td><td>CAUSED</td></tr>
        <tr><td class="k mono s15">MAIL-T311</td><td>PressureSensor</td><td>원인</td></tr>
        <tr><td class="k mono s15">DOC-P088</td><td>부품</td><td>RELATED_TO</td></tr></table>
        <p class="s19 c-fg" style="margin-top:16px">같은 것이 세 가지 이름 → <b class="c-red">그래프가 파편화</b>되고, 조회 쿼리를 쓸 수 없다</p>`, 'data-v="1"', 'fill-red');
      s += card(640, 240, 612, 420, 'purple', `<h5>ontology/kg-schema.yaml</h5>${code(`version: 1.1.0
node_types:
  Equipment:
    key: [fab, code]
    required: [serial]
  PartType:
    key: [code]
    synonyms: [압력센서, P/T]
  MaintenanceWork:
    key: [wo_id]
    required: [status, evidence]
relation_types:
  ON_EQUIPMENT: {from: MaintenanceWork, to: Equipment}
  SUSPECTED_CAUSE: {from: Equipment, to: FailureMode}`, 's15')}`, 'data-v="2"');
      const O = [['LLM 출력 JSON 스키마', '타입은 enum · 필수 필드는 required'], ['검증 코드 (Pydantic)', '적재 전 형식 · 허용 패턴 검사'], ['Neo4j 제약', '키 · 유니크 (에디션별 차이)'], ['SHACL (선택)', 'RDF/표준 연계가 필요할 때']];
      let ln = '';
      O.forEach((o, i) => {
        const y = 240 + i * 108;
        s += card(1286, y, 500, 96, 'mint', `<div class="s20 b">${o[0]}</div><div class="s16 sub">${o[1]}</div>`, 'data-v="3"');
        ln += path(`M1252,450 C1268,450 1262,${y + 48} 1282,${y + 48}`, 'mint', { draw: true, w: 2, a: 'data-v="3"' });
      });
      s += svg(ln);
      const M = [['FREE', '제약 없음', '발굴용'], ['EXTRACTED (기본값)', 'LLM이 먼저 스키마를 추론', '실행마다 달라질 수 있음'], ['사용자 정의', '노드 · 관계 타입 · 허용 패턴 지정', '운영 권장']];
      M.forEach((m, i) => { s += card(134 + i * 418, 690, 398, 160, 'blue', `<h5>SimpleKGPipeline schema</h5><div class="s20 b mono">${m[0]}</div><p class="c-fg">${m[1]}</p><p>${m[2]}</p>`, 'data-v="4"'); });
      s += card(1388, 690, 398, 160, 'mint', `<h5>원칙</h5><div class="s19 b">열린 추출은 확장 후보 발굴용</div><div class="s19 b c-mint">적재는 닫힌 스키마로</div>`, 'data-v="4"', 'fill-mint');
      s += t(134, 874, 1652, '스키마 밖에서 자주 나오는 개념은 버리지 않고 "확장 후보 큐"로 모아 온톨로지 PR의 근거로 씁니다', 's20 sub center', 'data-v="4"');
      return s;
    }
  });

  /* ------------------------------------------------------------ P18 */
  DECK.register({
    id: 'P18', steps: 5, section: '4 · 추출', ctx: CTX + ' · 03 추출', badge: '데모 회의록 STT',
    title: '추출 ② "추정"을 "확정"으로 바꾸지 않습니다',
    takeaway: '확실성 · 시점 · 근거 위치를 후보의 필드로 남겨야 조회 결과가 원문보다 단정적이지 않습니다',
    src: '사실성(factuality) · 헤지(hedging) 연구 주제 · 예시는 자체 설계',
    html() {
      let s = card(134, 240, 1652, 108, 'green', `<h5>원문 · DOC-M201@v1 [00:00:33] · 정제 후</h5><div class="s24">"원인은 PT-V42 열화로 ${mk('추정', 'red', 'data-c="on@1-5"')}하고 있습니다 교체하고 나서 ${mk('다시 확인', 'red', 'data-c="on@1-5"')}하겠습니다"</div>`, 'data-v="1"');
      s += card(134, 376, 600, 262, 'red', `<h5>잘못된 추출</h5><div class="mono s20" style="margin-top:8px">(EQ-017)-[<b class="c-red">CAUSED_BY</b>]-&gt;(PT-V42 열화)</div><div class="mono s20" style="margin-top:4px">certainty: <b class="c-red">"확정"</b></div>
        <p class="s18 c-fg" style="margin-top:14px">"추정"이 사라짐 → 나중에 조회하면 <b>확정된 원인</b>으로 답한다</p>`, 'data-v="2"', 'fill-red');
      s += card(770, 376, 1016, 262, 'mint', `<h5>후보로 남길 모양</h5><pre class="code s16" style="margin-top:4px">{ <span class="k">"relation"</span>: <span class="m">"SUSPECTED_CAUSE"</span>, <span class="k">"status"</span>: <span class="p">"candidate"</span>,
  <span class="k">"subject"</span>: <span class="s">"FAB-A/EQ-017"</span>, <span class="k">"object"</span>: <span class="s">"PT-V42 열화"</span>,
  <span class="k">"certainty"</span>: <span class="m">"suspected"</span>, <span class="k">"polarity"</span>: <span class="s">"positive"</span>,
  <span class="k">"asserted_at"</span>: <span class="s">"2026-03-04"</span>, <span class="k">"asserted_by"</span>: <span class="s">"주간 설비회의"</span>,
  <span class="k">"evidence"</span>: { <span class="k">"chunk"</span>: <span class="s">"DOC-M201#c03"</span>, <span class="k">"ts"</span>: <span class="s">"00:00:33"</span>,
                <span class="k">"quote"</span>: <span class="s">"원인은 PT-V42 열화로 추정하고 있습니다"</span> } }</pre>`, 'data-v="3"', 'fill-mint');
      const E = [['부정', '"원인은 PT-V42가 아니었다"', '원인 관계 생성'], ['예정 · 시제', '"교체 예정"', '교체 완료 이벤트'], ['조건문', '"압력이 떨어지면 밸브 점검"', '사실로 추출'], ['질문문', '"PT-V42 문제인가요?"', '단언으로 추출']];
      E.forEach((e, i) => { s += card(134 + i * 418, 668, 398, 140, 'orange', `<h5>${e[0]}</h5><div class="s18 c-fg">${e[1]}</div><div class="s16 c-red" style="margin-top:4px">→ ${e[2]}</div>`, 'data-v="4"'); });
      s += card(134, 834, 1652, 118, 'mint', `<div class="row" style="flex-wrap:wrap;gap:8px">${chip('certainty · polarity · status 필드', 'okl sans')}${chip('관계 분리: SUSPECTED / CONFIRMED', 'okl sans')}${chip('확정은 공식 근거(고장 코드 등)가 있을 때만', 'okl sans')}</div>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px">${chip('검증 규칙: 인용문에 "추정 · 예정 · 아니 · 만약 · ?" + confirmed → 보류', 'hold sans')}${chip('프롬프트에 반례 예시', 'okl sans')}</div>`, 'data-v="5"', 'fill-mint');
      return s;
    }
  });

  /* ------------------------------------------------------------ P19 */
  DECK.register({
    id: 'P19', steps: 4, section: '4 · 추출', ctx: CTX + ' · 03 추출', badge: '데모 실제 결과',
    title: '추출 ③ 정형은 규칙으로, 문서는 LLM으로 — 둘 다 후보입니다',
    takeaway: '만드는 방법은 달라도 결과는 같은 모양(후보 + 근거 + 판정 전)으로 모읍니다',
    src: '자체 설계 · 매핑 규칙 예: R2RML 계열',
    html() {
      let s = card(134, 240, 1090, 196, 'purple', `<h5>정형 · 프로그램</h5><div class="row" style="margin-top:16px;gap:14px">${chip('CMMS-WO@v1 행 3', 'src lg')}<span class="s26 sub">→</span><div class="card" style="padding:10px 14px"><div class="s20 b c-purple">매핑 규칙</div><div class="s16 sub">결정적 · 같은 입력 = 같은 결과</div></div><span class="s26 sub">→</span>${chip('R04–R06', 'cand lg')}</div>
        <p class="s17" style="margin-top:12px">정답이 정해져 있으니 LLM이 필요 없다 · 싸고 재현 가능</p>`, 'data-v="1"');
      s += card(134, 460, 1090, 220, 'blue', `<h5>비정형 · LLM</h5><div class="row" style="margin-top:16px;gap:14px">${chip('DOC-M201', 'src')}${chip('MAIL-T311', 'src')}<span class="s26 sub">→</span><div class="card" style="padding:10px 14px"><div class="s20 b c-blue">LLM 추출</div><div class="s16 sub">스키마 + 용어 사전 + 반례</div></div><span class="s26 sub">→</span>${['mail F01–F03', 'stt F01–F06'].map(c => chip(c, 'cand lg')).join('')}</div>
        <p class="s17" style="margin-top:12px">같은 입력도 결과가 흔들릴 수 있다 → 모델 ID · 프롬프트 버전 · 실행 ID를 후보마다 기록</p>`, 'data-v="2"');
      s += card(1260, 240, 526, 440, 'gray', `<h5>후보 저장소 · 아직 사실이 아님</h5>
        <table class="tb tight" style="margin-top:6px"><tr><th>후보</th><th>만든 곳</th><th>근거</th></tr>
        <tr><td class="k mono">R04</td><td>cmms-mapper@0.3</td><td class="mono s15">CMMS-WO 행 3</td></tr>
        <tr><td class="k mono">mail F01</td><td>extract-fab-v1</td><td class="mono s15">MAIL-T311#c02</td></tr>
        <tr><td class="k mono">stt F02</td><td>extract-fab-v1</td><td class="mono s15">DOC-M201#c03</td></tr>
        <tr><td class="k mono">stt F05</td><td>extract-fab-v1</td><td class="mono s15">DOC-M201#c05</td></tr>
        <tr><td class="k mono">stt F06</td><td>extract-fab-v1</td><td class="mono s15">DOC-M201#c06</td></tr></table>
        <p class="s17" style="margin-top:8px">18개 모두 <b class="c-orange">pending</b> → 검증 단계로 · LLM은 gpt-4.1</p>`, 'data-v="3"', 'panel');
      s += svg(path('M1226,338 C1240,338 1240,420 1256,420', 'purple', { draw: true, a: 'data-v="3"' }) + path('M1226,570 C1240,570 1240,500 1256,500', 'blue', { draw: true, a: 'data-v="3"' }));
      const W = [['정형 행', '프로그램', '정답이 정해져 있음'], ['템플릿 문서 · 표', '프로그램 + LLM', '양식 부분은 규칙'], ['자유 서술', 'LLM → 후보', '확정 권한 없음'], ['온톨로지 확장', 'LLM 제안 → 사람', '의미는 조직의 합의'], ['암묵지', '사람', '질문 큐 (27장)']];
      W.forEach((w, i) => { s += card(134 + i * 334, 712, 318, 240, 'gray', `<h5>${w[0]}</h5><div class="s22 b" style="margin-top:6px">${w[1]}</div><p style="margin-top:6px">${w[2]}</p>`, 'data-v="4"'); });
      return s;
    }
  });

  /* ------------------------------------------------------------ P20 */
  DECK.register({
    id: 'P20', steps: 4, section: '4 · 검증', ctx: CTX + ' · 04 검증', badge: '데모 · 공개 문서',
    title: '검증 ① 프로그램이 먼저 거릅니다: 온톨로지에 맞는가',
    takeaway: '싸고 확실한 검사부터 — 형식과 온톨로지 위반은 사람에게 보내기 전에 걸러냅니다',
    src: 'Neo4j Cypher Manual · Constraints · neosemantics(n10s) SHACL validation',
    html() {
      const R = [
        ['허용 타입인가', '"증상" · "PM 주기" (온톨로지에 없음 · 데모)', chip('반려', 'rej sans') + ' → 확장 후보 큐', 1],
        ['허용 관계 · 방향인가', '<span class="mono">(Equipment)-[USED_PART_TYPE]-&gt;(PartType)</span> (데모 stt F06)', chip('반려', 'rej sans'), 1],
        ['필수 속성', 'MaintenanceWork에 evidence 없음', chip('반려', 'rej sans'), 2],
        ['중복', '같은 WO-1042가 두 번 (데모 CMMS export)', chip('병합', 'okl sans'), 2],
        ['값 범위 · 형식', '완료일 &lt; 시작일', chip('보류', 'hold sans'), 3],
        ['참조 무결성', '없는 설비 FAB-A/EQ-071 참조 (데모 WO-1044)', chip('보류', 'hold sans'), 3]];
      let s = tbl(134, 240, 1652, ['검사', '실패 예', '결과'], R.map(r => ({ a: `data-v="${r[3]}"`, c: r.slice(0, 3) })), { cls: 'lg', widths: ['22%', '50%', '28%'] });
      const I = [['적재 전 코드', 'JSON Schema · Pydantic', 'YAML에서 생성 · 가장 이식성 좋음'], ['SHACL', 'n10s로 Neo4j 그래프 검증', '셀프호스팅만 · Aura에서는 사용 불가'], ['Neo4j 제약', '유니크: Community 포함', '존재 · 속성 타입 · 키: Enterprise 전용']];
      I.forEach((x, i) => { s += card(134 + i * 556, 724, 540, 156, 'purple', `<h5>${x[0]}</h5><div class="s21 b s20">${x[1]}</div><p>${x[2]}</p>`, 'data-v="4"'); });
      s += t(134, 900, 1652, 'Community로 운영하면 DB가 "필수 속성"을 막지 못한다 → 적재 전 코드 검증이 필수', 's20 sub center', 'data-v="4"');
      return s;
    }
  });
})();
