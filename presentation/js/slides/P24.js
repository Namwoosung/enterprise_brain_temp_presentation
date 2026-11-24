/* P24 · 평가: 온톨로지와 그래프가 좋아졌는지 무엇으로 아나
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P24', steps: 5, section: '4 · 평가', ctxSub: '06 평가', badge: '개념 · 공개 연구',
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
      let inner = `<h5>CQ가 실패하면 원인부터 나눈다</h5><div class="row" style="gap:12px;margin-top:10px">`;
      cause.forEach(c => { inner += `<div class="card" style="flex:1;padding:10px 12px"><div class="s18 b">${c[0]}</div><div class="s16 c-mint">→ ${c[1]}</div></div>`; });
      inner += '</div><p class="s18 c-fg" style="margin-top:12px"><b class="c-orange">함께 고민할 점</b> · CQ 목록은 누가 쓰나? 현업 질문을 어떻게 모을까?</p>';
      s += card(134, 700, 1652, 252, 'gray', inner, 'data-v="5"', 'panel');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "CQ 통과율 · 표본 정확도 · 운영 지표 · 재현율, 실패 원인 분류 → 개선.",
      script: [
        "첫째, 업무 질문을 Cypher 테스트로 고정합니다. 이걸 competency question이라고 하고, 통과율이 온톨로지가 업무에 답하는지를 보여줍니다. 데모에는 다섯 개가 있습니다. FAB-A EQ-017의 PT-V42 이력처럼 답이 있어야 하는 질문과, FAB-B 이력에 FAB-A 작업이 섞이지 않았는지, 확정 원인이 비어 있는지처럼 '없어야 맞는' 질문도 넣어서 ER과 추정 처리가 잘못되지 않았는지 매번 확인합니다.",
        "(→) 둘째, 적재된 사실에서 무작위·층화 표본을 뽑아 사람이 판정합니다. 100건 중 95건이 맞아도 신뢰구간으로 보면 대략 89에서 98퍼센트입니다. 숫자 하나보다 구간으로 말해야 합니다. LLM 판정은 표본 층을 나누는 데만 씁니다.",
        "(→) 셋째, 운영 지표입니다. 소스별 반영률, 반영 지연, 보류 큐 체류 시간, 반려 사유 분포, 나중에 무효화된 비율.",
        "(→) 넷째, 빠진 사실은 그래프에 없으니 표본으로 못 찾습니다. 문서 몇 건을 사람이 전수 주석한 골든셋으로 재현율을 재고, 답변 품질은 발표 4로 넘깁니다.",
        "(→) CQ가 실패하면 원인을 나눠야 고칠 곳이 보입니다. 개념이 없으면 온톨로지 PR, 추출 누락이면 프롬프트, ER 오류면 규칙, 수집 누락이면 커넥터.",
      ],
      discuss: "CQ 목록은 누가 쓰나? 현업 질문을 어떻게 모을까?",
      concept: "CQ(Grüninger & Fox 1995): 쿼리로 답을 꺼낼 수 있으면 모델링된 것. Wilson 구간: 표본이 작거나 비율이 극단일 때도 안정적인 비율 신뢰구간.",
      src: "Grüninger & Fox (1995) · Marchesin et al., VLDB 2026",
    },
  });
})();
