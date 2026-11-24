/* P05 · 같은 것이 다른 이름으로, 한 기록이 여러 시스템에 있습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P05', steps: 4, section: '1 · 왜 어려운가', ctxSub: 'B 자료 상태', badge: '교육용 가상 사례',
    title: '같은 것이 다른 이름으로, 한 기록이 여러 시스템에 있습니다',
    takeaway: '이름만 보고 합치거나 나누면 틀립니다. 무엇이 같은 대상인지부터 정해야 합니다',
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
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "의미적 이질성: 다른 이름 같은 대상, 같은 이름 다른 대상, 흩어진 컬럼, 형식 차이.",
      script: [
        "설비팀은 PM, 생산팀은 정기점검, 메일에는 예방정비라고 씁니다. 같은 개념입니다. 그런데 일정 메일의 '오후 3시 PM'은 전혀 다른 뜻이라 무조건 치환하면 안 됩니다.",
        "(→) 부품도 PT-V42, 압력센서 V42, P/T V-42처럼 표기만 다릅니다. 따로 두면 같은 부품의 이력이 세 군데로 흩어집니다.",
        "(→) 반대로 EQ-017은 이름이 같지만 FAB-A와 FAB-B의 다른 설비입니다. 이름만 보고 합치면 두 설비의 정비 이력이 섞입니다.",
        "(→) 한 작업 기록도 작업 번호는 CMMS, 완료 시각은 MES, 원인 메모는 메일이나 개인 엑셀에 있습니다. 날짜 표기도 제각각입니다.",
      ],
      discuss: "부서마다 다른 용어를 표준어로 강제할까, 동의어 사전으로 흡수할까?",
      concept: "데이터 통합의 이질성: 구문적(형식) · 구조적(스키마) · 의미적(이름-의미 불일치) · 시간적. MES(생산 실행)와 CMMS(설비 보전 관리)는 실제 제조 현장에 흔한 시스템 종류이고, 이 장의 값(EQ-017 등)은 교육용 가상 데이터.",
      src: "교육용 가상 사례",
    },
  });
})();
