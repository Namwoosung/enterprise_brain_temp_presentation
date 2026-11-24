/* P08 · 네 가지 어려움은 서로 다른 단계에서 막습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P08', steps: 5, section: '1 · 왜 어려운가', badge: '자체 설계',
    title: '네 가지 어려움은 서로 다른 단계에서 막습니다',
    takeaway: '어느 한 단계(LLM 호출 한 번)로는 넷을 다 막을 수 없어서, 구축을 여섯 단계로 나눠 설계합니다',
    src: '자체 설계 · 각 칸은 {{P13}}장부터 상세',
    html() {
      /* 단계 열: x = X0 + i * STEP */
      const stages = ['수집', '정제', '추출', '검증', '적재', '평가'];
      const X0 = 760, STEP = 173, CW = 161;
      /* 어려움 행: [기호, 이름, 색, 한 줄 원칙, {단계 번호: 그 단계에서 하는 일}] */
      const rows = [
        ['A', '모델 한계', 'blue', '모르는 건 알려 주고<br>답은 확인한다', { 2: '스키마 · 사전<br>넣어 주기', 3: '원문과<br>대조' }],
        ['B', '자료 상태', 'green', '같은 대상을<br>하나로 묶는다', { 0: '원본 + 메타<br>보존', 1: '같은 대상<br>연결 (ER)' }],
        ['C', '시간에 따른 변화', 'orange', '언제 · 어느 버전의<br>사실인지 남긴다', { 0: '증분 수집<br>· 버전', 4: '유효 기간<br>· 이력' }],
        ['D', '사람에게 있는 기준', 'purple', '모르면 묻고<br>답도 근거로 남긴다', { 3: '승인 기준<br>· 질문 큐', 4: '사람 답도<br>근거로' }]];
      const rgb = { blue: '96,165,250', green: '52,211,153', orange: '253,186,116', purple: '183,148,244' };
      const Y0 = 318, RH = 112, RG = 16;
      let s = '';
      /* 단계 머리글 */
      s += t(450, 262, 290, '대응 원칙', 's17 sub mono', 'data-v="1" data-nf');
      stages.forEach((name, i) => {
        s += div(X0 + i * STEP, 248, CW, 54, 'card panel', `<div class="s22 b center">${name}</div>`, 'data-v="1" data-nf', 'padding:10px 0');
      });
      /* 어려움 행 */
      rows.forEach(([k, name, color, rule, cells], r) => {
        const y = Y0 + r * (RH + RG), a = `data-v="${r + 1}"`;
        s += card(134, y, 296, RH, color, `<div class="mono s16 c-${color}">${k}</div><div class="s24 b">${name}</div>`, a);
        s += t(450, y + 22, 290, `<span class="c-${color}">→</span> ${rule}`, 's20 c-fg', a);
        stages.forEach((_, i) => {
          const x = X0 + i * STEP;
          if (cells[i]) {
            s += div(x, y, CW, RH, `card tone-${color}`, `<div class="s20 b c-fg center" style="line-height:1.3">${cells[i]}</div>`, a,
              `padding:6px;display:flex;align-items:center;justify-content:center;background:rgba(${rgb[color]},.16)`);
          } else {
            s += div(x, y, CW, RH, 'card tone-ghost', '', a, 'opacity:.35');
          }
        });
      });
      /* 평가: 네 대응이 실제로 효과가 있었는지 한꺼번에 확인 */
      const evX = X0 + 5 * STEP, rowsH = 4 * RH + 3 * RG;
      s += div(evX, Y0, CW, rowsH, 'card tone-mint', `<div class="s20 b c-mint center" style="margin-top:150px">넷 다<br>효과가<br>있었나</div><div class="s17 sub center" style="margin-top:10px">업무 질문(CQ)<br>으로 확인</div>`,
        'data-v="5"', 'background:rgba(94,234,212,.12)');
      /* 결론 */
      s += card(134, 846, 1652, 106, 'mint', `<div class="s28 b" style="margin-top:4px">모든 단계가 적어도 하나의 어려움을 맡습니다</div>
        <p class="s20 c-fg" style="margin-top:6px">그래서 "LLM에 넣고 끝"이 아니라, 여섯 단계를 나누고 단계마다 누가 맡을지 정합니다 → 다음 장</p>`, 'data-v="5"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "네 가지 어려움은 각각 다른 단계에서 막는다 → 한 번의 LLM 호출이 아니라 단계로 나눠 설계해야 한다.",
      script: [
        "앞에서 본 네 가지 어려움을 구축 단계와 연결해 보겠습니다. 위에 여섯 단계가 있고, 한 줄에 어려움 하나씩입니다. 색칠된 칸이 그 어려움을 주로 막는 단계입니다.",
        "모델 한계는 '모르는 건 알려 주고, 답은 확인한다'입니다. 추출할 때 스키마와 용어 사전을 넣어 주고, 검증할 때 원문과 대조합니다.",
        "(→) 자료 상태는 '같은 대상을 하나로 묶는다'입니다. 수집할 때 원본과 메타를 남기고, 정제할 때 이름이 달라도 같은 대상이면 연결합니다.",
        "(→) 시간에 따른 변화는 '언제, 어느 버전의 사실인지 남긴다'입니다. 증분으로 수집하고 버전을 기록하고, 적재할 때 유효 기간과 변경 이력을 붙입니다.",
        "(→) 사람에게 있는 기준은 '모르면 묻고, 답도 근거로 남긴다'입니다. 검증 단계에 승인 기준과 질문 큐를 두고, 사람이 답한 내용도 근거로 연결해 적재합니다.",
        "(→) 마지막 평가 단계는 이 네 가지 대응이 실제로 효과가 있었는지를 업무 질문으로 한꺼번에 확인합니다.",
        "이렇게 보면 모든 단계가 적어도 하나씩 맡고 있습니다. 어느 한 단계, 예를 들어 LLM 호출 한 번으로는 넷을 다 막을 수 없습니다. 그래서 구축을 여섯 단계로 나누고, 단계마다 누가 맡을지를 정합니다. 다음 장에서 여섯 단계를 짧게 훑겠습니다.",
      ],
      discuss: "",
      concept: "",
      src: "자체 설계",
    },
  });
})();
