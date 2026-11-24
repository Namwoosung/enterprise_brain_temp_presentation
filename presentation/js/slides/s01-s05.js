/* v3 · P01 – P05 : 도입 · 왜 어려운가 */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q } = H;
  const CTX = '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>';

  /* ------------------------------------------------------------ P01 */
  DECK.register({
    id: 'P01', steps: 4, section: '0 · 도입', ctx: CTX, badge: '발표 흐름',
    title: '앞에서는 "무엇인가"를, 이제는 "어떻게 만드나"를 봅니다',
    takeaway: '그래프 개념은 발표 1에서 끝났다고 보고, 여기서는 만들 때 결정해야 할 것에 집중합니다',
    src: '발표 구성 · 자체 설계',
    html() {
      const xs = [134, 553, 972, 1391];
      const talks = [['발표 1', 'KG · Graph DB 개념'], ['발표 2', '구축: 수집 → 평가'], ['발표 3', '조회 · Agent 활용'], ['발표 4', '벤치마크']];
      let s = '';
      talks.forEach((k, i) => {
        const me = i === 1;
        s += card(xs[i], 236, 395, 96, me ? 'mint' : '', `<h5>${k[0]}${me ? tag('지금') : ''}</h5><h4>${k[1]}</h4>`, '', me ? 'fill-mint' : 'faded');
      });
      const st = [['01', '수집', '흩어진 자료 모으기', 'green'], ['02', '정제', '같은 것은 같게', 'purple'], ['03', '추출', '문서에서 후보 뽑기', 'blue'],
        ['04', '검증', '맞는 것만 통과', 'orange'], ['05', '적재', '저장소별로 반영', 'mint'], ['06', '평가', '좋아졌는지 재기', 'gray']];
      let ln = '';
      st.forEach((x, i) => {
        const cx = 134 + 131 + i * 278;
        ln += path(`M750,334 C750,362 ${cx},352 ${cx},388`, x[3] === 'gray' ? 'sub' : x[3], { draw: true, w: 2, a: 'data-v="2"' });
        s += card(134 + i * 278, 392, 262, 118, x[3], `<div class="mono s16 c-${x[3] === 'gray' ? 'sub' : x[3]}">${x[0]}</div><div class="s30 b">${x[1]}</div><div class="s17 sub">${x[2]}</div>`, 'data-v="2"');
      });
      s += svg(ln);
      s += card(134, 548, 1652, 190, 'gray', `<h5>이번 발표의 질문</h5><div class="big40" style="margin-top:10px">우리 회사 자료로 <span class="c-mint">믿을 수 있는</span> 그래프를 어떻게 만들고,<br>자료가 바뀌어도 <span class="c-mint">계속 맞게</span> 유지할까?</div>`, 'data-v="3"', 'panel');
      s += card(134, 772, 900, 186, 'mint', `<h5>오늘 데모</h5><div class="s24 b">반도체 설비 회의록 · 메일 · 작업기록</div><p class="s19 c-fg" style="margin-top:6px">→ 정제 · 추출 · 검증 → Neo4j 적재 → 반영 전후 차이 확인</p><p class="s17">교육용 더미 데이터 · 실제 온톨로지/그래프 DB에서 실행</p>`, 'data-v="4"', 'fill-mint');
      s += card(1064, 772, 722, 186, 'gray', `<h5>이번 발표에서 다루지 않는 것</h5>${ul(['그래프·KG 기본 개념 → 발표 1', '질의 방법(Text2Cypher, GraphRAG 검색) → 발표 3', '답변 품질 측정 → 발표 4'], 's18 sub')}`, 'data-v="4"');
      return s;
    }
  });

  /* ------------------------------------------------------------ P02 */
  DECK.register({
    id: 'P02', steps: 4, section: '0 · 도입', ctx: CTX, badge: '개념도',
    title: '온톨로지를 쓰려면 먼저 흩어진 자료를 한곳에 모아야 합니다',
    takeaway: '온톨로지는 틀이고, 그 틀에 채울 내용은 흩어진 자료에서 옵니다',
    src: '자체 설계 개념도',
    html() {
      const src = [['메일', '스레드 · 첨부', 'green'], ['회의록', '주간 설비회의', 'green'], ['사내 위키 · 게시판', '절차 · 공지', 'green'],
        ['MES / CMMS', '작업 · 설비 이력', 'green'], ['공유폴더 · 엑셀', '담당자별 양식', 'green'], ['개인 PC', '로컬에만 있는 파일', 'orange']];
      let s = '', ln = '';
      src.forEach((x, i) => {
        const y = 240 + i * 106;
        s += card(134, y, 320, 92, x[2], `<div class="s22 b">${x[0]}</div><div class="s16 sub">${x[1]}</div>`, 'data-v="1"', i === 5 ? 'dashed' : '');
        ln += path(`M456,${y + 46} C540,${y + 46} 540,551 612,551`, i === 5 ? 'orange' : 'green', { draw: true, w: 2, dash: i === 5, a: 'data-v="2"' });
      });
      s += card(620, 390, 400, 322, 'green', `<h5>수집 · 저장</h5><h4 class="s28">원본 보관소</h4>${ul(['받은 그대로 보관 (수정 금지)', '버전 · 내용 해시', '출처 · 작성 시각 · 권한', '나중에 다시 처리할 수 있게'], 's19')}`, 'data-v="2"');
      ln += path('M1022,551 C1080,551 1080,700 1132,700', 'mint', { draw: true, w: 3, a: 'data-v="3"' });
      ln += path('M1460,494 V530', 'sub', { dash: true, a: 'data-v="3"' });
      s += card(1140, 240, 646, 252, 'purple', `<h5>온톨로지 = 틀 · 사람이 정의</h5>
        <div style="margin-top:8px">${['Equipment', 'PartType', 'MaintenanceWork', 'Document', 'Person'].map(x => chip(x, 'prog')).join('')}</div>
        <div style="margin-top:10px">${['ON_EQUIPMENT', 'USED_PART_TYPE', 'EVIDENCED_BY'].map(x => chip(x, 'gray sm')).join('')}</div>
        <p class="s17" style="margin-top:10px">어떤 종류의 것이 있고, 서로 어떻게 연결될 수 있는가</p>`, 'data-v="3"');
      s += t(1474, 500, 300, '틀에 맞춰 채운다', 's16 sub', 'data-v="3"');
      s += card(1140, 534, 646, 330, 'mint', `<h5>지식그래프 = 내용 · 자료에서 채움</h5>`, 'data-v="3"', 'panel');
      let g = path('M1360,660 L1520,660', 'gray', { w: 2 }) + path('M1440,790 L1330,692', 'gray', { w: 2 }) + path('M1490,790 L1590,692', 'gray', { w: 2 });
      s += `<div data-v="3" data-nf>${svg(g)}</div>`;
      s += node(1270, 660, 200, 60, 'FAB-A/EQ-017', '', '', 'data-v="3" data-nf', 's18');
      s += node(1630, 660, 200, 60, 'PT-V42', '', '', 'data-v="3" data-nf', 's18');
      s += node(1460, 816, 200, 60, 'WO-1042', '', 'new', 'data-v="3" data-nf', 's18');
      s += pill(1440, 640, 'USED_IN', '', 'data-v="3" data-nf');
      s += card(134, 896, 1652, 66, 'mint', `<div class="s24 center">자료를 모으는 단계부터 설계해야 틀(온톨로지)에 <b class="c-mint">믿을 수 있는 내용</b>을 채울 수 있습니다</div>`, 'data-v="4"', 'fill-mint');
      return s;
    }
  });

  /* ------------------------------------------------------------ P03 */
  DECK.register({
    id: 'P03', steps: 3, section: '1 · 왜 어려운가', ctx: CTX, badge: '문제 정리',
    title: '우리 도메인에서 막히는 지점은 네 종류입니다',
    takeaway: '항목은 13개지만 모델 · 자료 · 시간 · 사람 네 묶음으로 나뉩니다',
    src: '팀 논의 항목 정리 · 자체 분류',
    html() {
      const G = [['A', '모델 한계', 'blue', '→ 04'], ['B', '자료 상태', 'green', '→ 05'], ['C', '시간에 따른 변화', 'orange', '→ 06'], ['D', '사람에게 있는 기준', 'purple', '→ 07']];
      const items = [
        [0, '모델이 도메인을 모름'], [0, '전부 컨텍스트에 못 넣음'],
        [1, '방대하고 여러 플랫폼에 분산'], [1, '개인 PC · 컬럼까지 산재'], [1, '부서마다 다른 용어'], [1, '형식 · 시점 · 담당자별 불일치'], [1, '설명 · 메타데이터 부족'],
        [2, '새 데이터가 계속 생김'], [2, '기존 정보가 바뀜'], [2, '최신 · 과거 정보 혼재'], [2, '잘못된 문서도 있음'],
        [3, '정답 기준이 암묵지'], [3, '문서화 안 된 경험 판단']];
      const scatter = [[170, 280], [600, 300], [1040, 270], [1400, 310], [240, 430], [690, 460], [1120, 420], [1410, 470], [180, 600], [620, 620], [1060, 590], [1400, 640], [760, 760]];
      let s = '';
      G.forEach((g, i) => {
        s += card(134 + i * 418, 244, 398, 566, g[2], `<div class="mono s16 c-${g[2]}">${g[0]}<span class="sub" data-v="3" style="float:right">${g[3]}</span></div><h4 class="s28">${g[1]}</h4>`, 'data-v="2"');
      });
      const cnt = [0, 0, 0, 0];
      items.forEach(([gi, txt], k) => {
        const tx = 134 + gi * 418 + 18, ty = 330 + cnt[gi]++ * 64;
        const [ox, oy] = scatter[k];
        s += cb(ox, oy, 362, 56, txt, '', `data-v="1" data-nf data-tr="2:${tx - ox},${ty - oy}" data-c="t-${G[gi][2]}@2-3"`);
      });
      s += card(134, 840, 1652, 112, 'gray', `<div class="s24" style="margin-top:6px">각 묶음마다 <b>막는 단계가 다릅니다</b>. 다음 네 장에서 우리 데이터 예시로 하나씩 보고, 08장에서 단계와 연결합니다.</div>`, 'data-v="3"', 'panel');
      return s;
    }
  });

  /* ------------------------------------------------------------ P04 */
  DECK.register({
    id: 'P04', steps: 4, section: '1 · 왜 어려운가', ctx: CTX + ' · A 모델 한계', badge: '개념 · 공개 연구',
    title: '모델은 우리 도메인을 모르고, 전부 넣어 줄 수도 없습니다',
    takeaway: '필요한 사실만 골라 꺼낼 구조가 필요하고, 그 구조를 만들 때도 기준은 사람이 먼저 줍니다',
    src: 'Liu et al., Lost in the Middle (TACL 2024) · 그 외 자체 설명',
    html() {
      let s = '';
      s += card(134, 240, 800, 76, 'gray', `<div class="s24"><span class="mono sub">Q.</span> FAB-A <span class="mono">EQ-017</span>의 <b>PM 주기</b>는?</div>`, 'data-v="1"', 'panel');
      s += svg(path('M534,318 V346', 'sub', { a: 'data-v="1"' }) + path('M534,416 V444', 'sub', { a: 'data-v="1"' }));
      s += card(134, 350, 800, 64, 'blue', `<div class="s20"><b class="c-blue">LLM</b> <span class="sub">· 사내 자료 없이 답함</span></div>`, 'data-v="1"', 'fill-blue');
      s += card(134, 448, 800, 128, 'gray', `<p class="s19 c-fg">"일반적으로 CVD 장비 예방정비는 수개월 주기로…"</p>`, 'data-v="1"');
      s += div(600, 526, null, null, 'stamp rej', '근거 없음 · 우리 기준 아님', 'data-v="1"');
      s += card(134, 608, 800, 344, 'blue', `<h5>모델이 아는 것 / 모르는 것</h5>
        <div class="row" style="align-items:flex-start;gap:24px;margin-top:8px">
          <div style="flex:1"><div class="s20 b c-mint">안다</div>${ul(['공개 문서 · 논문 · 매뉴얼', '일반 업무 · 설비 지식', '언어 · 문서 구조'], 's18')}</div>
          <div style="flex:1.3"><div class="s20 b c-red">모른다</div>${ul(['우리 설비 코드 체계 (EQ-017이 두 대)', '부서 약어 ("PM"이 무엇인지)', '사내 절차 · 기준값', '지난 회의에서 정한 것', '학습 시점 이후 정보'], 's18')}</div>
        </div>`, 'data-v="2"');
      // right
      s += card(974, 240, 812, 230, 'gray', `<h5>그럼 사내 자료를 전부 넣으면?</h5>
        <div class="s18" style="margin-top:14px">사내 문서 전체</div><div class="bar" style="width:740px;background:var(--sub);opacity:.7;margin-top:4px"></div>
        <div class="s18" style="margin-top:14px">컨텍스트 창</div><div class="bar" style="width:70px;background:var(--blue);margin-top:4px"></div>
        <p class="s15" style="margin-top:12px">길이는 비율을 보여주기 위한 그림 · 실제 비율은 자료량에 따라 다름</p>`, 'data-v="3"');
      const R = [['①', '양', '전사 자료보다 작고, 자료는 계속 는다'], ['②', '비용 · 지연', '질문마다 넣으면 비싸고 느리다'], ['③', '활용', '긴 입력의 중간은 덜 쓰인다']];
      R.forEach((r, i) => { s += card(974 + i * 276, 488, 260, 210, 'blue', `<span class="num blue">${r[0]}</span><h4 style="margin-top:8px">${r[1]}</h4><p>${r[2]}</p>`, 'data-v="3"'); });
      s += card(974, 726, 812, 226, 'mint', `<h5>그래서</h5><div class="s24 b" style="margin-top:4px">필요한 사실만 골라 꺼낼 수 있는 구조 <span class="sub s19">(그래프 + 검색)</span></div>
        <p class="s19 c-fg" style="margin-top:10px">만드는 단계에서도 모델은 도메인을 모른다 →<br><b>용어 사전 · 스키마 · 예시</b>를 먼저 주고, 그래도 틀릴 수 있으니 <b>검증</b>한다</p>`, 'data-v="4"', 'fill-mint');
      return s;
    }
  });

  /* ------------------------------------------------------------ P05 */
  DECK.register({
    id: 'P05', steps: 4, section: '1 · 왜 어려운가', ctx: CTX + ' · B 자료 상태', badge: '교육용 가상 사례',
    title: '같은 것이 다른 이름으로, 한 기록이 여러 시스템에 있습니다',
    takeaway: '이름만 보고 합치거나 나누면 틀립니다 — 무엇이 같은 대상인지가 먼저 정해져야 합니다',
    src: '교육용 가상 사례 · 반도체 설비 정비',
    html() {
      let s = '';
      const arrow = '<span class="s30 sub" style="margin:0 10px">→</span>';
      s += card(134, 240, 818, 340, 'green', `<div class="mono s16 c-green">B-1</div><h4 class="s26">같은 개념, 부서마다 다른 말</h4>
        <div class="row" style="flex-wrap:wrap;margin-top:18px">${chip('설비팀 "PM"', 'gray lg sans')}${chip('생산팀 "정기점검"', 'gray lg sans')}${chip('메일 "예방정비"', 'gray lg sans')}</div>
        <div class="row" style="margin-top:14px">${arrow}${chip('예방정비 · PreventiveMaintenance', 'okl lg sans')}</div>
        <p class="s18" style="margin-top:14px">단, 일정 메일의 <span class="c-orange">"오후 3시 PM"</span>은 다른 뜻 → 소스·맥락별로 적용</p>`, 'data-v="1"');
      s += card(968, 240, 818, 340, 'green', `<div class="mono s16 c-green">B-2</div><h4 class="s26">같은 부품, 표기만 다름</h4>
        <div class="row" style="flex-wrap:wrap;margin-top:18px">${chip('PT-V42', 'gray lg')}${chip('압력센서 V42', 'gray lg sans')}${chip('P/T V-42', 'gray lg')}</div>
        <div class="row" style="margin-top:14px">${arrow}${chip('PartType · PT-V42', 'okl lg')}</div>
        <p class="s18" style="margin-top:14px">따로 두면 같은 부품의 이력이 세 군데로 흩어져 검색에서 빠진다</p>`, 'data-v="2"');
      s += card(134, 600, 818, 352, 'red', `<div class="mono s16 c-red">B-3</div><h4 class="s26">같은 코드, 다른 설비</h4>
        <div class="row" style="margin-top:18px">${chip('EQ-017', 'gray lg')}${arrow}<div class="col" style="gap:8px">${chip('FAB-A / EQ-017 · SN-A017', 'okl lg')}${chip('FAB-B / EQ-017 · SN-B017', 'okl lg')}</div></div>
        <p class="s18" style="margin-top:14px">이름이 같다고 합치면 <b class="c-red">두 설비의 정비 이력이 섞인다</b></p>`, 'data-v="3"');
      s += card(968, 600, 818, 352, 'orange', `<div class="mono s16 c-orange">B-4</div><h4 class="s26">한 기록이 여러 시스템에, 형식도 제각각</h4>
        <table class="tb tight" style="margin-top:8px"><tr><td class="k">작업 번호 · 설비</td><td>CMMS</td></tr><tr><td class="k">완료 시각</td><td>MES 이벤트</td></tr><tr><td class="k">원인 메모</td><td>메일 · 담당자 개인 엑셀</td></tr></table>
        <p class="s18" style="margin-top:10px">날짜만 해도 <span class="mono c-fg">2026.03.06</span> · <span class="mono c-fg">3/6</span> · <span class="mono c-fg">26W10</span></p>`, 'data-v="4"');
      return s;
    }
  });
})();
