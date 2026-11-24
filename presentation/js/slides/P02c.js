/* P02c · 이 발표가 혼합 방식을 고른 이유
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P02c', steps: 3, section: '0 · 도입', badge: '우리 선택',
    title: '왜 이 방식인가: 우리 조건에 맞춰 골랐습니다',
    takeaway: '정의는 YAML + Git, 데이터는 속성 그래프, 대량 값은 원천 참조, 문서는 고정 스키마 LLM 추출로 묶습니다',
    src: '자체 설계 · Hogan et al. (2021) · LinkML · W3C R2RML',
    html() {
      const Y = '<span class="c-mint b">○</span>', M = '<span class="c-orange b">△</span>', N = '<span class="c-red b">×</span>';
      const R = [
        ['agent · 사람이 관계를 따라가며 조회', M, Y, Y, M, Y],
        ['관계마다 근거 · 확실성 · 기간을 붙임', M, Y, Y, N, M],
        ['자료의 절반 이상이 문서 · 메일 · 회의록', M, M, Y, N, Y],
        ['정의가 자주 바뀌고 전문가가 diff로 검토', M, N, Y, M, N],
        ['팀 · 오픈웨이트 agent가 바로 고칠 수 있음', N, Y, Y, M, Y],
        ['측정값 · 이력 같은 대량 값은 복사하지 않음', N, N, M, Y, N],
        ['틀린 사실이 업무 기준에 들어가면 안 됨', Y, M, Y, Y, N],
      ];
      const rows = R.map(r => ({ c: [r[0], ...r.slice(1).map((v, j) => [v, j === 2 ? 'class="ctr" data-c="pick@2"' : 'class="ctr"'])] }));
      let s = card(134, 236, 1060, 590, 'gray', `<h5>우리 조건 × 방식 (○ 잘 맞음 · △ 보완 필요 · × 어려움)</h5>`, 'data-v="1" data-nf', 'panel');
      s += tbl(150, 280, 1028, ['우리 조건', 'A 시맨틱 웹', 'B 속성 그래프', 'C 혼합', 'D 가상 KG', 'E LLM 추출'].map((h, i) => i ? [h, i === 3 ? 'class="ctr" data-c="pick@2"' : 'class="ctr"'] : h), rows, { a: 'data-v="1" data-nf', cls: 'lg', widths: ['40%', '12%', '12%', '12%', '12%', '12%'] });
      /* 스텝 2: 그래서 고른 조합 */
      s += card(1214, 236, 572, 590, 'mint', `<h5>그래서 고른 조합</h5>
        <div style="margin-top:10px"><div class="s22 b c-mint">정의 = YAML + Git</div><div class="s18 sub">클래스 · 키 · 관계 · 허용 값을 한 파일에, 리뷰는 PR로 (C)</div></div>
        <div style="margin-top:14px"><div class="s22 b c-mint">데이터 = 속성 그래프</div><div class="s18 sub">관계에 근거 ID · 확실성 · 유효 기간을 바로 붙임 (B)</div></div>
        <div style="margin-top:14px"><div class="s22 b c-mint">대량 값 = 원천 참조</div><div class="s18 sub">Dataset 노드에 시스템 · 테이블 · 조회 방법만 (D)</div></div>
        <div style="margin-top:14px"><div class="s22 b c-mint">문서 = 고정 스키마 LLM 추출</div><div class="s18 sub">정의에서 만든 JSON Schema로 뽑고 검증 후 적재 (E)</div></div>`, 'data-v="2"');
      /* 스텝 3: 포기한 것과 다시 볼 조건 */
      s += card(134, 846, 812, 106, 'orange', `<div class="s20 b c-orange">포기한 것</div><p class="s18 c-fg" style="margin-top:4px">표준 추론 · 외부 IRI 연결 → 필요하면 같은 정의에서 OWL · SHACL을 만들어 내보냄</p>`, 'data-v="3"');
      s += card(966, 846, 820, 106, 'blue', `<div class="s20 b c-blue">다시 볼 조건</div><p class="s18 c-fg" style="margin-top:4px">표준 어휘 교환이 필수 · 분류 추론이 핵심 · 정형 DB만 남음 → A 또는 D 중심</p>`, 'data-v="3"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "방식을 취향으로 고른 게 아니라 우리 조건 일곱 가지에 비춰 골랐다. 포기한 것과 다시 검토할 조건도 함께 밝힌다.",
      script: [
        "이 발표가 왜 이 방식을 쓰는지 먼저 밝혀 두겠습니다. 우리 조건을 일곱 가지로 적고 다섯 방식에 비춰 봤습니다. agent가 관계를 따라가며 조회해야 하고, 관계마다 근거와 기간을 붙여야 하고, 자료의 절반 이상이 문서이고, 정의가 자주 바뀌어 전문가가 변경분으로 검토해야 하고, 팀과 오픈웨이트 agent가 바로 고칠 수 있어야 하고, 대량 측정값은 복사하고 싶지 않고, 틀린 사실이 업무 기준에 들어가면 안 됩니다. 혼합 방식이 가장 많이 맞고, 대량 값은 가상 KG가, 문서는 LLM 추출이 강합니다.",
        "(→) 그래서 조합을 이렇게 골랐습니다. 정의는 YAML 파일로 Git에 두고 PR로 검토합니다. 데이터는 속성 그래프에 두고 관계에 근거와 기간을 바로 붙입니다. 측정값 같은 대량 값은 원천에 두고 조회 방법만 참조합니다. 문서는 정의에서 만든 스키마로 LLM이 뽑고, 검증을 거쳐 적재합니다.",
        "(→) 대신 포기한 것도 있습니다. OWL의 표준 추론과 외부 표준 어휘 연결입니다. 정의가 한 파일에 있으니 필요해지면 거기서 OWL과 SHACL을 만들고 데이터를 RDF로 내보내면 됩니다. 기관 간 표준 교환이 필수가 되거나, 분류 추론이 업무의 핵심이 되거나, 정형 DB만 남는다면 그때 다시 고릅니다.",
      ],
      discuss: "우리 조건 일곱 가지 중 빠진 것이나 가중치가 다른 것은?",
      concept: "평가는 일반적인 특성 기준의 정성 판단(Hogan et al. 2021 등). 정의 YAML → OWL · SHACL · JSON Schema 생성은 LinkML이 대표 도구. 구축 상세 가이드: study/pipeline_build_guide.md",
      src: "자체 설계 · Hogan et al. (2021) · LinkML 문서",
    },
  });
})();
