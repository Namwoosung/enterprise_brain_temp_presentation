/* P27 · 모르는 것은 사람에게 묻습니다: 질문 큐
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P27', steps: 5, section: '5 · 운영', ctxSub: '운영', badge: '설계 예시',
    title: '모르는 것은 사람에게 묻습니다: 질문 큐',
    takeaway: '사람의 답변도 누가 · 언제 · 어떤 조건에서 말했는지와 함께 근거로 저장합니다',
    src: 'Nonaka SECI 모델 (표출화) · 자체 설계',
    html() {
      let s = card(134, 240, 480, 560, 'gray', `<h5>질문이 생기는 때</h5>${ul(['메타데이터 부족 ("지난번처럼")', '출처끼리 충돌', 'ER이 애매함', '온톨로지에 없는 개념이 반복', '암묵지에 기대는 판단', '개인 PC에 있을 것 같은 자료'], 's19')}`, 'data-v="1"');
      s += card(650, 240, 600, 420, 'orange', `<h5>질문 레코드</h5><div class="kv s17" style="margin-top:6px">
        <div><span class="k">id</span> <span class="v">Q-0312-07</span></div>
        <div><span class="k">question</span> <span class="v">"지난번처럼"은 어느 작업인가요?</span></div>
        <div><span class="k">linked</span> <span class="v">C05 · DOC-M201@v1 p.3</span></div>
        <div><span class="k">why</span> <span class="v">CQ-07 이전 조치 이력</span></div>
        <div><span class="k">ask_to</span> <span class="v">회의 주관자 (설비기술팀)</span></div>
        <div><span class="k">expires</span> <span class="v">2026-03-26</span></div>
        <div><span class="k">status</span> <span class="v c-orange" data-t="2:open|4:answered">open</span></div></div>`, 'data-v="2"');
      const P = [['① 담당자 답변', '주간 묶음 · 선택형 · 원문 하이라이트와 함께'], ['② 이후 자료로 자동 해소', '새 문서 · DB 변경이 질문에 답하면 연결하고 닫음'], ['③ 만료', '보류 유지 · 재질문 또는 폐기']];
      P.forEach((p, i) => { s += card(1286, 240 + i * 190, 500, 170, i === 0 ? 'mint' : 'gray', `<h4>${p[0]}</h4><p>${p[1]}</p>`, 'data-v="3"'); });
      s += card(650, 690, 600, 262, 'mint', `<h5>답변 → 근거로 저장</h5>
        <div class="row" style="margin-top:6px">${chip('? 어느 작업', 'gray sans')}<span class="s22 sub">→</span>${chip('WO-0988', 'ok')}</div>
        <div class="quote s17" style="margin-top:10px">"WO-0988 때처럼 센서 교체 후 24시간 모니터링" — 설비기술팀 김OO, 3/14</div>
        <p class="s17 c-fg" style="margin-top:8px">사람 출처 근거 → 같은 검증을 거쳐 적재 · 암묵지가 형식지가 되는 경로</p>`, 'data-v="4"', 'fill-mint');
      s += card(134, 830, 480, 122, 'gray', `<h5>부담 줄이기</h5><p class="s17 c-fg">한 번에 묶어서 · 예/아니오로 · 답이 어디에 쓰였는지 알려주기</p>`, 'data-v="5"', 'panel');
      s += card(1286, 830, 500, 122, 'orange', `<h5>함께 고민할 점</h5><p class="s18 c-fg">질문받는 사람이 귀찮지 않으려면?</p>`, 'data-v="5"', 'fill-orange');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "질문 생성 조건, 레코드, 해소 경로 3가지, 답변을 근거로 저장.",
      script: [
        "질문은 이럴 때 생깁니다. 메타데이터가 부족할 때, 출처끼리 충돌할 때, ER이 애매할 때, 온톨로지에 없는 개념이 반복될 때, 암묵지에 기대는 판단일 때.",
        "(→) 질문 하나는 이런 레코드입니다. 무엇을 묻는지, 어떤 후보와 연결되는지, 왜 필요한지, 누구에게 물을지, 언제 만료되는지.",
        "(→) 해소 경로는 셋입니다. 담당자가 답하거나, 이후 들어온 자료가 답을 주면 자동으로 닫히거나, 만료되면 보류를 유지합니다.",
        "(→) 답변이 오면 그것도 근거로 저장합니다. 누가, 언제, 어떤 조건에서 말했는지와 함께. 그리고 다른 후보와 똑같이 검증을 거칩니다. 암묵지가 형식지가 되는 경로가 이겁니다.",
        "(→) 받는 사람이 귀찮으면 안 됩니다. 한 번에 묶어서, 예·아니오로, 답이 어디에 쓰였는지 알려주는 게 중요합니다.",
      ],
      discuss: "질문받는 사람이 귀찮지 않으려면? 주간 묶음 vs 실시간 알림?",
      concept: "SECI의 표출화(Externalization)를 시스템으로 만드는 장치. 숙련자에게 '규칙을 다 써 달라'보다 구체 사례에 대한 질문이 잘 통한다.",
      src: "Nonaka SECI · 자체 설계",
    },
  });
})();
