/* P28 · 온톨로지 구축 방법론: 무엇을 섞어 쓸까
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P28', steps: 5, section: '6 · 부록', ctxSub: '질문 대비', badge: '공개 방법론 정리',
    title: '온톨로지 구축 방법론: 무엇을 섞어 쓸까',
    takeaway: '하나만 고르기보다 업무 질문으로 골격을 잡고, 데이터와 LLM으로 채우고, 사람이 인증합니다',
    src: 'Noy & McGuinness (2001) · METHONTOLOGY · NeOn · LOT · Ontology Design Patterns · ISA-95(IEC 62264)',
    html() {
      const R = [
        ['Top-down (CQ · 전문가)', '업무 질문 → 필요한 개념 · 관계 정의', '목적이 분명 · 작게 시작', '현업 시간 필요 · 놓치는 개념', '핵심 골격'],
        ['Bottom-up (데이터 · 스키마)', '기존 DB · 문서에서 개념 도출', '실제 데이터와 맞음', '시스템 구조를 그대로 복제', '정형 소스 매핑'],
        ['LLM 보조', 'LLM이 개념 · 관계 초안, 사람이 확정', '빠른 초안 · 동의어 발굴', '그럴듯한 과잉 개념 · 실행마다 다름', '확장 후보 제안'],
        ['표준 재사용', '업계 표준 모델 차용 (제조: ISA-95 등)', '외부 연계 · 검증된 구조', '너무 넓음 · 우리 용어와 거리', '상위 개념 참고 · 검토 후보'],
        ['<span class="c-mint">하이브리드</span>', 'CQ 골격 + 데이터 매핑 + LLM 확장 + 사람 인증', '현실적', '운영 절차가 필요', '<b class="c-mint">권장</b>']];
      let s = tbl(134, 240, 1652, ['접근', '방법', '장점', '단점', '우리 적용'], R.map((r, i) => ({ a: `data-v="${i + 1}"`, c: r })), { cls: 'xl', widths: ['19%', '27%', '17%', '21%', '16%'] });
      s += card(134, 830, 1652, 122, 'gray', `<h5>고전 방법론 키워드</h5><div class="row" style="flex-wrap:wrap;gap:8px">${['Ontology Development 101', 'METHONTOLOGY', 'NeOn (재사용 시나리오)', 'LOT (애자일 · 산업)', 'Ontology Design Patterns', 'BFO · IOF Core (상위 온톨로지)'].map(x => chip(x, 'gray sans')).join('')}</div>`, 'data-v="1" data-nf', 'panel');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "Top-down / Bottom-up / LLM 보조 / 표준 재사용 / 하이브리드 비교. 질문 대비용.",
      script: [
        "질문이 들어올 수 있어서 방법론을 정리했습니다. 위에서부터, 업무 질문과 전문가로 골격을 잡는 방식은 목적이 분명하지만 현업 시간이 필요합니다.",
        "(→) 기존 DB와 문서에서 개념을 끌어내는 방식은 실제 데이터와 맞지만 시스템 구조를 그대로 복제하기 쉽습니다.",
        "(→) LLM이 초안을 만들면 빠르지만 그럴듯한 개념이 과하게 생기고 실행마다 달라집니다.",
        "(→) 업계 표준, 제조라면 ISA-95 같은 걸 재사용하면 외부 연계에 좋지만 너무 넓습니다. 우리에게 맞는지는 검토가 필요합니다.",
        "(→) 그래서 현실적인 답은 섞는 겁니다. 업무 질문으로 골격, 데이터로 매핑, LLM으로 확장 후보, 사람이 인증.",
      ],
      discuss: "",
      concept: "Ontology Development 101(Noy & McGuinness 2001), METHONTOLOGY, NeOn(재사용 시나리오), LOT(애자일·산업), ODP(설계 패턴), BFO·IOF Core(상위 온톨로지). 표준은 '검토 후보'로만 언급.",
      src: "공개 방법론 정리",
    },
  });
})();
