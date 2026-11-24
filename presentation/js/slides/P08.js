/* P08 · 어려움마다 막는 단계가 다릅니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P08', steps: 5, section: '1 · 왜 어려운가', badge: '자체 설계',
    title: '어려움마다 막는 단계가 다릅니다',
    takeaway: '그래서 "LLM에 넣고 끝"이 아니라 수집 · 정제 · 추출 · 검증 · 적재 · 평가를 나눠 설계합니다',
    src: '자체 설계 · 각 칸은 이후 장에서 상세',
    html() {
      const head = ['', '수집', '정제', '추출', '검증', '적재', '평가'];
      const R = [
        ['<span class="c-blue">A 모델 한계</span>', '—', '용어 사전', '스키마 · 사전 · 예시 주입', '원문 대조', '—', 'CQ로 확인'],
        ['<span class="c-green">B 자료 상태</span>', '원본 + 메타 보존', 'ER · 표준화 · 중복 제거', '문서 구조 기반 청킹', '원천 DB 대조', '단일 ID · 근거 연결', '소스별 반영률'],
        ['<span class="c-orange">C 시간</span>', '증분 · 버전', '최신본 표시', '시점 필드', '모순 검사', '유효 기간 · 이력', '반영 지연'],
        ['<span class="c-purple">D 사람</span>', '업로드 창구', '—', '불확실성 보존', '승인 기준', '사람 출처 근거', '질문 큐 해소율']];
      const rows = R.map((r, i) => ({ a: `data-v="${i + 1}"`, c: r }));
      let s = tbl(134, 246, 1652, head, rows, { cls: 'xl', widths: ['16%', '14%', '14%', '14%', '14%', '14%', '14%'] });
      s += card(134, 730, 1652, 190, 'mint', `<div class="s30 b" style="margin-top:8px">한 번의 LLM 호출로는 이 칸들을 채울 수 없습니다</div>
        <p class="s20 c-fg" style="margin-top:10px">→ 단계별로 <b>누가(사람 · 프로그램 · LLM)</b> 무엇을 맡을지 정하는 것이 구축 설계의 핵심</p>`, 'data-v="5"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "어려움 × 단계 매트릭스 → 단계별 역할 분담이 설계의 핵심.",
      script: [
        "앞의 네 묶음을 단계와 연결하면 이렇게 됩니다. 모델 한계는 추출 때 스키마와 사전을 주입하고, 검증 때 원문과 대조해서 막습니다.",
        "(→) 자료 상태는 수집에서 원본과 메타를 남기고, 정제에서 같은 대상을 묶고, 검증에서 원천 DB와 대조합니다.",
        "(→) 시간 문제는 증분 수집과 버전, 적재 때 유효 기간과 이력으로 막습니다.",
        "(→) 사람 문제는 추출 때 불확실성을 보존하고, 검증 때 승인 기준을 두고, 답변을 사람 출처 근거로 남깁니다.",
        "(→) 보시다시피 LLM 한 번 호출로 채울 수 있는 칸이 아닙니다. 그래서 단계마다 누가 무엇을 맡을지를 정해야 합니다.",
      ],
      discuss: "",
      concept: "",
      src: "자체 설계",
    },
  });
})();
