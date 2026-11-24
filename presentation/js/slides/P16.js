/* P16 · 정제 ② Entity resolution: 같은 대상을 같은 ID로
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P16', steps: 5, section: '4 · 정제', ctxSub: '02 정제', badge: '개념 · 공개 자료',
    title: '정제 ② Entity resolution: 같은 대상을 같은 ID로',
    takeaway: '이름이 같다는 건 약한 증거입니다. 애매하면 합치지 않고 후보로 남깁니다',
    src: 'Fellegi & Sunter (1969) · Splink (UK MoJ) · Neo4j GraphRAG Python KG Builder 문서',
    html() {
      const P = [['정규화', '코드 · 이름 형태 맞추기'], ['블로킹', '비교할 쌍 줄이기'], ['쌍 비교', '필드별 유사도'], ['판정', '규칙 → 확률 → 사람'], ['대표 ID', '클러스터 · 대표 레코드']];
      let s = '', ln = '';
      P.forEach((p, i) => {
        s += card(134 + i * 336, 240, 310, 96, 'purple', `<div class="s22 b">${p[0]}</div><div class="s16 sub">${p[1]}</div>`, 'data-v="1"');
        if (i < 4) ln += path(`M${134 + i * 336 + 312},288 H${134 + (i + 1) * 336 - 4}`, 'purple', { a: 'data-v="1"' });
      });
      s += svg(ln);
      s += card(134, 366, 800, 286, 'gray', `<h5>블로킹 · 같은 FAB · 같은 장비군끼리만 비교</h5>
        <div class="row" style="align-items:flex-start;gap:16px;margin-top:10px">
          <div class="card flat" style="flex:1;padding:10px 12px"><div class="mono s16 sub">block: FAB-A</div>${chip('FAB-A/EQ-017', 'gray')}${chip('A동 17호기', 'gray sans')}${chip('PT-V42', 'gray')}${chip('압력센서 V42', 'gray sans')}</div>
          <div class="card flat" style="flex:1;padding:10px 12px"><div class="mono s16 sub">block: FAB-B</div>${chip('FAB-B/EQ-017', 'gray')}${chip('B동 17호기', 'gray sans')}</div></div>
        <p class="s17" style="margin-top:10px">모든 쌍 비교는 n² · 블록을 너무 좁히면 진짜 짝을 놓치고, 그 놓침은 측정이 어렵다</p>`, 'data-v="2"');
      const pairs = [['PT-V42', '압력센서 V42', 'ok', '같음'], ['FAB-A/EQ-017', 'FAB-B/EQ-017', 'rej', '다름'], ['WO-1042', '메일 "3/6 센서 교체"', 'hold', '검토']];
      pairs.forEach((p, i) => {
        s += card(970, 366 + i * 98, 816, 86, 'gray', `<div class="row" style="height:100%">${chip(p[0], 'gray')}<span class="s22 sub">↔</span>${chip(p[1], 'gray')}<span style="margin-left:auto" class="stamp ${p[2]}">${p[3]}</span></div>`, 'data-v="3"', 'panel');
      });
      s += card(134, 680, 800, 272, 'blue', `<h5>왜 "이름만 같음"은 약한 증거인가 · Fellegi-Sunter</h5>
        <p class="s17 c-fg" style="margin-top:4px"><b>m</b> = 진짜 같은 대상일 때 일치할 확률 · <b>u</b> = 남인데 우연히 일치할 확률</p>
        <table class="tb tight" style="margin-top:6px"><tr><td class="k">코드 EQ-017 일치</td><td>u 높음 (FAB마다 코드 재사용) → <b class="c-orange">약함</b></td></tr>
        <tr><td class="k">FAB + 코드 + 일련번호 일치</td><td>u 매우 낮음 → <b class="c-mint">강함</b></td></tr></table>
        <p class="s17" style="margin-top:8px"><b class="c-red">함정</b> · Neo4j <span class="mono">SimpleKGPipeline</span> 기본 ER은 같은 라벨 + 같은 이름을 병합 → EQ-017 두 대를 합친다</p>`, 'data-v="4"');
      s += card(970, 680, 816, 272, 'mint', `<h5>정책</h5>
        <table class="tb tight"><tr><td class="k c-red">잘못 합침</td><td>두 설비 이력이 섞임 · 되돌리기 어려움</td></tr><tr><td class="k c-orange">못 합침</td><td>검색 누락 · 나중에 합치기는 쉬움</td></tr></table>
        <p class="s19 c-fg" style="margin-top:8px">→ 애매하면 <b class="c-mint">SAME_AS 후보</b>로 남기고 검토 · 내부 ID와 업무 키(FAB+코드) 분리</p>
        <p class="s17" style="margin-top:6px"><b class="c-orange">함께 고민할 점</b> · 우리에게 더 비싼 실수는 어느 쪽인가?</p>`, 'data-v="5"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "ER 절차, 블로킹 트레이드오프, m/u 직관, 기본 ER 함정, 보수적 병합 정책.",
      script: [
        "같은 대상을 찾아 하나의 ID로 묶는 작업을 entity resolution이라고 합니다. 정규화, 블로킹, 쌍 비교, 판정, 대표 ID 순서입니다.",
        "(→) 모든 쌍을 비교하면 n제곱이라, 같은 FAB이나 장비군끼리만 비교하는 블로킹을 씁니다. 다만 너무 좁히면 진짜 짝을 놓치고, 그 놓침은 측정하기 어렵습니다.",
        "(→) 판정 결과는 셋입니다. PT-V42와 압력센서 V42는 같음, FAB-A와 FAB-B의 EQ-017은 다름, WO-1042와 메일의 '3/6 센서 교체'는 사람이 검토.",
        "(→) 왜 코드만 같으면 약한 증거일까요. Fellegi-Sunter 모델에서 u는 남인데 우연히 일치할 확률입니다. EQ-017은 FAB마다 재사용되니 u가 높아서 약한 증거고, FAB과 코드와 일련번호가 다 맞으면 u가 매우 낮아 강한 증거입니다. 참고로 Neo4j의 SimpleKGPipeline은 기본으로 같은 라벨과 같은 이름을 병합해서, 이 사례에서는 두 설비를 합쳐 버립니다.",
        "(→) 잘못 합치면 이력이 섞이고 되돌리기 어렵습니다. 못 합치면 검색에서 빠지지만 나중에 합치기는 쉽습니다. 그래서 애매하면 합치지 않고 SAME_AS 후보로 남기는 게 안전합니다.",
      ],
      discuss: "우리에게 더 비싼 실수는 잘못 합침인가, 못 합침인가?",
      concept: "m = 진짜 같은 쌍일 때 필드가 일치할 확률, u = 다른 쌍인데 우연히 일치할 확률. 일치 시 log(m/u)를 더해 매치 가중치. 전이성 함정: A=B, B=C가 A=C를 강제.",
      src: "Fellegi & Sunter (1969) · Splink · Neo4j GraphRAG Python 문서",
    },
  });
})();
