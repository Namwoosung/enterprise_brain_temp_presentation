/* v3 · P21 – P25 : 근거 검증 · 사람 검토 · 적재 · 평가 · 자동화 */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code } = H;
  const CTX = '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>';

  /* ------------------------------------------------------------ P21 */
  DECK.register({
    id: 'P21', steps: 4, section: '4 · 검증', ctx: CTX + ' · 04 검증', badge: '데모 · 가상 사례',
    title: '검증 ② 원문과 공식 시스템에 맞는지 봅니다',
    takeaway: '형식이 맞아도 원문이 그 말을 하지 않으면 떨어지고, 공식 기록과 다르면 보류합니다',
    src: 'Marchesin et al., VLDB 2026 (LLM 정확도 추정 편차) · 사례는 자체 설계',
    html() {
      const band = (y, no, title, left, right, stamp, a) =>
        card(134, y, 1166, 196, 'gray', `<div class="row"><span class="num gray">${no}</span><h4 style="margin:0">${title}</h4><span style="margin-left:auto" class="stamp ${stamp[0]}">${stamp[1]}</span></div>
          <div class="row" style="align-items:flex-start;gap:20px;margin-top:12px"><div style="flex:1">${left}</div><div class="s26 sub" style="padding-top:18px">↔</div><div style="flex:1">${right}</div></div>`, a, 'panel');
      let s = '';
      s += band(240, '1', '인용문이 원문에 있나 · 문자열 대조',
        `<h5>후보 mail F01</h5><div class="s18">"3/6 오후에 P/T V-42 교체 완료"</div>`,
        `<h5>원문 MAIL-T311@v1 #1</h5><div class="s18">"3/6 오후에 ${mk('P/T V-42 교체 완료', 'mint', 'data-c="on@1-4"')}했습니다"</div>`, ['ok', '통과'], 'data-v="1"');
      s += band(456, '2', '원문이 후보를 뒷받침하나 · 함의 판정',
        `<h5>후보 (흔한 오류 예)</h5><div class="s18 mono">CONFIRMED_CAUSE (PT-V42 열화)</div>`,
        `<h5>원문 DOC-M201@v1 [00:00:33]</h5><div class="s18">"…PT-V42 열화로 ${mk('추정', 'red', 'data-c="on@2-4"')}하고 있습니다"</div>`, ['rej', '반려 → SUSPECTED로'], 'data-v="2"');
      s += band(672, '3', '공식 시스템과 맞나 · 기준 시스템 대조',
        `<h5>메일 · mail F01</h5><div class="s18">교체 완료 <b>3/6</b></div>`,
        `<h5>CMMS · completed_at</h5><div class="s18 mono">2026-03-${mk('07', 'red', 'data-c="on@3-4"')} 10:20</div>`, ['hold', '보류 · 불일치 기록'], 'data-v="3"');
      s += t(134, 878, 1166, '속성마다 기준 시스템을 정해 둔다 (완료 시각 = CMMS) · 자동으로 덮어쓰지 않고 불일치를 남긴다 → DB 입력 누락이 발견되기도 함', 's17 sub', 'data-v="3"');
      s += card(1336, 240, 450, 712, 'blue', `<h5>LLM을 검증자로 쓸 때</h5>
        <div class="s20 b c-mint" style="margin-top:8px">쓸모</div>${ul(['대량 1차 필터', '원문 ↔ 후보 함의 판정', '반려 사유 설명'], 's18')}
        <div class="s20 b c-red" style="margin-top:12px">한계</div>${ul(['같은 모델은 같은 오류를 공유하기 쉬움', '프롬프트 · 순서에 민감', 'LLM만으로 KG 정확도를 추정하면 실제와 최대 45% 차이 보고 (VLDB 2026)'], 's18')}
        <div class="card fill-mint tone-mint" style="margin-top:14px;padding:10px 12px"><div class="s18 b">LLM 통과 = 사람이 덜 봐도 되는 후보<br><span class="c-mint">확정이 아님</span></div></div>
        <p class="s17" style="margin-top:12px"><b class="c-orange">함께 고민할 점</b> · 문서와 DB가 다르면 항상 DB가 맞나?</p>`, 'data-v="4"');
      return s;
    }
  });

  /* ------------------------------------------------------------ P22 */
  DECK.register({
    id: 'P22', steps: 4, section: '4 · 검증', ctx: CTX + ' · 04 검증', badge: '설계 가이드',
    title: '검증 ③ 언제 사람에게 묻나: 위험도 × 확신도',
    takeaway: '전부 사람이 보면 막히고, 아무도 안 보면 틀립니다 — 볼 것을 기준으로 고릅니다',
    src: '자체 설계 · human-in-the-loop · active learning 개념',
    html() {
      let s = '';
      s += card(134, 240, 380, 556, 'red', `<h5>위험도를 올리는 것</h5>${ul(['안전 · 품질 · 고객 영향', '설비 정지 · 출하 판단에 쓰임', '공식 기록과 다름', '연결이 많은 노드를 바꿈', '되돌리기 어려움 (ER 병합)'], 's18')}`, 'data-v="2"');
      s += card(1406, 240, 380, 556, 'blue', `<h5>확신도를 내리는 것</h5>${ul(['"추정 · 예정" 표현', '근거가 하나뿐 · 사본끼리만', '출처끼리 충돌', 'ER 점수 애매', 'LLM 검증 결과 불일치'], 's18')}<p class="s16" style="margin-top:10px">점수는 표본으로 보정 — "0.9"가 실제로 90% 맞는지 확인</p>`, 'data-v="2"');
      s += div(550, 240, 410, 30, 'ax center', '확신 높음', 'data-v="1" data-nf') + div(966, 240, 410, 30, 'ax center', '확신 낮음', 'data-v="1" data-nf');
      s += div(516, 290, 30, 250, 'ax', '위험<br>높음', 'data-v="1" data-nf', 'writing-mode:horizontal-tb') + div(516, 552, 30, 250, 'ax', '위험<br>낮음', 'data-v="1" data-nf');
      const Q = [[550, 278, 'orange', '사람 승인 · 빠른 확인', 'mail F01 · CMMS와 날짜 다름'], [966, 278, 'red', '사람 상세 검토 + 담당자 확인', 'stt F02 · 고장 원인 추정'], [550, 540, 'mint', '자동 승인 + 사후 표본 검수', 'cmms R04 · CMMS 작업 기록'], [966, 540, 'orange', '보류 큐 · 추가 근거 대기', 'stt Q01 · "지난번처럼"']];
      Q.forEach(q => { s += card(q[0], q[1], 410, 250, q[2], `<div class="cell" style="height:100%"><div class="s24 b">${q[3]}</div><div data-v="3">${chip(q[4], 'cand sans')}</div></div>`, 'data-v="1" data-nf', `fill-${q[2] === 'mint' ? 'mint' : (q[2] === 'red' ? 'red' : 'orange')}`); });
      const B = [['시점', '고위험은 적재 전 게이트 · 저위험은 적재 후 표본 감사 (unreviewed 표시)'], ['큐 운영', '우선순위 = 위험 × 영향 범위 × 대기 시간 · 담당자 라우팅도 데이터로'], ['함께 고민할 점', '큐가 밀리면? 하루 몇 건까지가 현실적인가 — 임계값은 처리량에 맞춘 운영 값']];
      B.forEach((b, i) => { s += card(134 + i * 556, 822, 540, 130, i === 2 ? 'orange' : 'gray', `<h5>${b[0]}</h5><p class="s18 c-fg">${b[1]}</p>`, 'data-v="4"', i === 2 ? 'fill-orange' : 'panel'); });
      return s;
    }
  });

  /* ------------------------------------------------------------ P23 */
  DECK.register({
    id: 'P23', steps: 5, section: '4 · 적재', ctx: CTX + ' · 05 적재', badge: '설계 예시',
    title: '적재: 저장소마다 역할을 나누고, 다시 넣어도 그대로이게',
    takeaway: '원본 · 원장 · 정의가 기준이고 그래프는 다시 만들 수 있는 조회용 사본입니다',
    src: 'Neo4j Cypher Manual (MERGE) · DuckDB · Apache Parquet · 자체 설계',
    html() {
      let s = tbl(134, 240, 800, ['저장소', '담는 것', '역할'], [
        ['파일 스토리지', '원본 문서 · CSV · 로그 (불변)', chip('기준', 'src sm sans')],
        ['Parquet + DuckDB', '정제본 · 수집 기록 · 추출 후보 (서버 없음)', chip('기준', 'src sm sans')],
        ['Git', '온톨로지 · 매핑 규칙 · 프롬프트', chip('기준', 'src sm sans')],
        ['RDB (필요 시)', '검토 · 승인 이력 · 질문 큐 — 여러 명이 동시에 쓸 때', chip('나중', 'hold sm sans')],
        ['Neo4j', '승인된 사실의 조회용 투영 · 청크 벡터 인덱스', chip('사본', 'gray sm sans')],
        ['RDF (필요 시)', '표준 어휘 연계 · 교환 형식', chip('선택', 'gray sm sans')]], { a: 'data-v="1"', cls: 'tight', widths: ['22%', '60%', '18%'] });
      s += card(134, 628, 800, 324, 'purple', `<h5>근거를 그래프에 어떻게 붙이나</h5>
        <div class="s19 b" style="margin-top:6px">A · 관계 속성</div><div class="mono s15">(WO-1042)-[:USED_PART_TYPE {evidence, certainty}]-&gt;(PT-V42)</div><p>단순 · 근거가 여러 개면 뭉개짐</p>
        <div class="s19 b" style="margin-top:8px">B · 사실 노드 (Assertion)</div><div class="mono s15">(WO-1042)-&gt;(:Assertion A-WO1042-COMPLETED)-&gt;(:Evidence ×2)</div><p>근거 · 검토 이력 · 유효 기간을 붙이기 쉬움 · 쿼리는 길어짐</p>
        <p class="s17 c-fg" style="margin-top:8px">→ 조회용 직접 관계 + 근거용 Assertion을 같이 두는 혼합이 흔하다</p>`, 'data-v="2"');
      s += card(970, 240, 816, 360, 'red', `<h5>MERGE 함정</h5><pre class="code s16"><span class="c">// ✗ 패턴 전체 MERGE — 패턴이 없으면 끝 노드까지 새로 만든다</span>
MERGE (w:MaintenanceWork {wo_id:'WO-1042'})
      -[:ON_EQUIPMENT]-&gt;(e:Equipment {fab:'FAB-A', code:'EQ-017'})

<span class="m">// ✓ 노드는 키로 각각, 관계는 그다음</span>
MERGE (w:MaintenanceWork {wo_id:$wo})
MERGE (e:Equipment {fab:$fab, code:$code})
MERGE (w)-[:ON_EQUIPMENT]-&gt;(e)</pre><p class="s17" style="margin-top:8px">MERGE 키에는 유니크(또는 키) 제약 — 동시 실행에서도 중복 방지</p>`, 'data-v="3"');
      s += card(970, 628, 816, 220, 'mint', `<h5>staging → 검사 → publish</h5>
        <div class="row" style="margin-top:6px">${chip('cmms load', 'okl')}<span class="s20">EQ-017 주변 노드 <span class="mono">4 → <b class="c-mint">5</b></span> · 관계 <span class="mono">2 → <b class="c-mint">4</b></span> <span class="s16 sub">(전체 41 · 91 → 73 · 155)</span></span></div>
        <div class="row" style="margin-top:8px">${chip('같은 배치 재실행', 'gray sans')}<span class="s20">변화 <b class="mono">0</b> (멱등)</span></div>
        <p class="s17 c-fg" style="margin-top:10px">삭제 대신 무효화 (valid_to · status) → 이력 보존 · 롤백 쉬움</p>`, 'data-v="4"', 'fill-mint');
      s += card(970, 868, 816, 84, 'orange', `<div class="s20"><b class="c-orange">데모</b> · 적재 단계 화면 · 그래프 패널에서 "변화" 쿼리 실행</div>`, 'data-v="5"', 'fill-orange');
      return s;
    }
  });

  /* ------------------------------------------------------------ P24 */
  DECK.register({
    id: 'P24', steps: 5, section: '4 · 평가', ctx: CTX + ' · 06 평가', badge: '개념 · 공개 연구',
    title: '평가: 온톨로지와 그래프가 좋아졌는지 무엇으로 아나',
    takeaway: '평가 지표가 있어야 온톨로지를 바꿀 근거가 생기고, 바꾼 뒤 나빠졌는지도 알 수 있습니다',
    src: 'Grüninger & Fox (1995) CQ · Marchesin et al., VLDB 2026 · Wilson 신뢰구간',
    html() {
      const ok = '<b class="c-mint">✓</b>', no = '<b class="c-red">✗</b>';
      const C = [
        ['CQ 통과율', 'blue', `<p class="c-fg">업무 질문을 Cypher 테스트로 고정</p><div class="s17 lh" style="margin-top:8px">${ok} FAB-A EQ-017의 PT-V42 교체 이력과 근거?<br>${ok} FAB-B EQ-017 이력 = WO-1038만 (ER 회귀)<br>${ok} 확정 원인 = 없음 (추정이 확정으로 안 감)<br>${no} "지난번처럼"이 가리키는 작업?</div><p style="margin-top:8px">온톨로지가 업무 질문에 답하는가</p>`],
        ['표본 정확도', 'mint', `<p class="c-fg">무작위 · 층화 표본을 사람이 판정</p><div class="s18" style="margin-top:8px">100건 중 95건 정답<br>→ 95% <span class="sub">(95% 신뢰구간 약 89–98%)</span></div><p style="margin-top:8px">LLM 판정은 층을 나누는 신호로만</p>`],
        ['반영률 · 최신성', 'green', `${ul(['소스별 반영률', '원본 변경 → 반영 지연', '보류 큐 체류 시간', '반려 사유 분포', '나중에 무효화된 비율'], 's17')}`],
        ['재현율 · 하류', 'orange', `<p class="c-fg">빠진 사실은 그래프에 없어 표본으로 못 찾는다</p>${ul(['골든셋: 문서 몇 건을 사람이 전수 주석', '원천 시스템 대비 커버리지', '답변 품질 → 발표 4'], 's17')}`]];
      let s = '';
      C.forEach((c, i) => { s += card(134 + i * 418, 240, 398, 430, c[1], `<div class="mono s16 c-${c[1]}">0${i + 1}</div><h4 class="s26">${c[0]}</h4>${c[2]}`, `data-v="${i + 1}"`); });
      const cause = [['온톨로지에 개념 없음', '온톨로지 PR'], ['추출 누락', '프롬프트 · 예시'], ['ER 오류', '규칙 · 임계값'], ['수집 누락', '커넥터'], ['쿼리 문제', '발표 3']];
      let inner = `<h5>CQ가 실패하면 — 원인을 나눠야 고칠 곳이 보인다</h5><div class="row" style="gap:12px;margin-top:10px">`;
      cause.forEach(c => { inner += `<div class="card" style="flex:1;padding:10px 12px"><div class="s18 b">${c[0]}</div><div class="s16 c-mint">→ ${c[1]}</div></div>`; });
      inner += '</div><p class="s18 c-fg" style="margin-top:12px"><b class="c-orange">함께 고민할 점</b> · CQ 목록은 누가 쓰나? 현업 질문을 어떻게 모을까?</p>';
      s += card(134, 700, 1652, 252, 'gray', inner, 'data-v="5"', 'panel');
      return s;
    }
  });

  /* ------------------------------------------------------------ P25 */
  DECK.register({
    id: 'P25', steps: 4, section: '5 · 운영', ctx: CTX + ' · 운영', badge: '설계 예시',
    title: '전체 파이프라인을 자동화합니다',
    takeaway: '사람 검토는 파이프라인을 막지 않게 옆으로 빼고, 승인되면 다음 배치에서 반영합니다',
    src: 'Apache Airflow 3.0 (Asset · Watcher · DAG 버전) · 자체 설계',
    html() {
      const R1 = ['수집 (소스별)', '파싱 · 정제', 'ER', '추출', '스키마 검사'], R2 = ['원문 · 원천 대조', 'staging 적재', '그래프 검사', 'publish', '평가 리포트'];
      const X = i => 134 + i * 340;
      let s = '', ln = '';
      R1.forEach((n, i) => { s += cb(X(i), 250, 290, 84, n, 'center t-purple', 'data-v="1" data-nf'); if (i < 4) ln += path(`M${X(i) + 292},292 H${X(i + 1) - 4}`, 'purple', { draw: true, a: 'data-v="1" data-nf' }); });
      ln += path(`M${X(4) + 145},336 V376 H${X(0) + 145} V406`, 'purple', { draw: true, a: 'data-v="1" data-nf' });
      R2.forEach((n, i) => { s += cb(X(i), 410, 290, 84, n, `center ${i === 3 ? 't-mint' : 't-purple'}`, 'data-v="1" data-nf'); if (i < 4) ln += path(`M${X(i) + 292},452 H${X(i + 1) - 4}`, i === 2 ? 'mint' : 'purple', { draw: true, a: 'data-v="1" data-nf' }); });
      s += cb(X(0) + 70, 584, 420, 84, '🕒 사람 검토 큐 · 비동기', 'center t-orange', 'data-v="2"');
      ln += path(`M${X(0) + 145},496 V580`, 'orange', { draw: true, a: 'data-v="2"' });
      ln += path(`M${X(0) + 492},626 H${X(3) + 145} V498`, 'orange', { dash: true, a: 'data-v="2"' });
      s += t(X(1) + 160, 636, 560, '승인되면 다음 publish에 반영', 's17 c-orange', 'data-v="2"');
      s += cb(X(4), 584, 290, 84, '<div><div>격리 (dead-letter)</div><div class="s15 sub">모든 단계의 실패 문서</div></div>', 'center t-red', 'data-v="3"');
      s += svg(ln);
      s += card(134, 716, 800, 236, 'red', `<h5>실패해도 멈추지 않게</h5>${ul(['단계별 재시도 · 파싱 실패 문서는 격리 후 계속', '같은 입력 재실행 = 같은 결과 (멱등)', '실패 사유를 모아 파서 · 프롬프트 개선 우선순위로'], 's19')}`, 'data-v="3"');
      s += card(970, 716, 816, 236, 'green', `<h5>트리거와 기록</h5>${ul(['새 데이터가 생기면 실행 — Airflow 3 Asset · 외부 이벤트(Watcher)', '온톨로지 버전이 바뀌면 영향받는 원본만 재처리', '실행마다 원본 · 온톨로지 · 모델 · 프롬프트 버전 기록', 'Airflow 3: 실행은 시작 시점 DAG 버전으로 끝까지'], 's18')}`, 'data-v="4"');
      return s;
    }
  });
})();
