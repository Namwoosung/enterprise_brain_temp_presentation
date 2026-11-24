/* P31 · 정리와 함께 정할 것
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P31', steps: 3, section: '7 · 정리', badge: '정리',
    title: '정리와 함께 정할 것',
    takeaway: '고칠 수 있게 남기고, 확정은 기준으로 하고, 숫자로 개선합니다',
    src: '발표 2 정리',
    html() {
      const S = [['01', '원본과 근거를 남겨야 고칠 수 있다', '원본 불변 · 수집 기록 · 근거 위치 · 유효 기간'], ['02', 'LLM은 후보를 만들고, 확정은 규칙 · 원천 · 사람이 한다', '스키마 · 원문 대조 · 위험도 × 확신도'], ['03', '평가 지표가 있어야 온톨로지를 바꿀 수 있다', 'CQ · 표본 정확도 · 골든셋 회귀 · main / develop']];
      let s = '';
      S.forEach((x, i) => { s += card(134 + i * 556, 240, 540, 270, 'mint', `<div class="mono s20 c-mint">${x[0]}</div><div class="s28 b" style="margin-top:6px">${x[1]}</div><p class="s18" style="margin-top:12px">${x[2]}</p>`, 'data-v="1"'); });
      const D = ['용어 사전의 소유자', '사람 승인 기준과 하루 처리량', 'CQ 목록을 누가 · 어떻게 모을지', '온톨로지 변경 승인권자', '개인 PC 자료를 받는 방식'];
      s += card(134, 540, 1100, 412, 'orange', `<h5>팀이 정해야 할 것</h5><div class="s24 lh" style="margin-top:10px">${D.map(d => `<div style="margin:12px 0">${box()}${d}</div>`).join('')}</div>`, 'data-v="2"');
      s += card(1270, 540, 516, 412, 'gray', `<h5>다음 발표</h5><div class="big34" style="margin-top:10px">발표 3<br>조회 · Agent 활용</div><p class="s19 c-fg" style="margin-top:18px">오늘 남긴 근거 · 시점 · 승인 상태를 조회에서 어떻게 쓰는지 이어서 봅니다</p>`, 'data-v="3"', 'panel');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "세 가지 원칙과 팀이 정해야 할 다섯 가지.",
      script: [
        "세 가지로 정리하겠습니다. 원본과 근거를 남겨야 고칠 수 있습니다. LLM은 후보를 만들고, 확정은 규칙과 원천 시스템과 사람이 합니다. 그리고 평가 지표가 있어야 온톨로지를 바꿀 수 있습니다.",
        "(→) 기술보다 먼저 팀이 정해야 할 것이 있습니다. 용어 사전의 주인, 사람 승인 기준과 하루 처리량, 업무 질문을 모으는 방법, 온톨로지 변경 승인권자, 개인 PC 자료를 받는 방식.",
        "(→) 다음 발표에서는 오늘 남긴 근거와 시점, 승인 상태를 조회에서 어떻게 쓰는지 이어서 보겠습니다.",
      ],
      discuss: "다섯 가지 결정 항목 중 우리 팀에서 가장 먼저 정해야 할 것은?",
      concept: "",
      src: "발표 2 정리",
    },
  });
})();
