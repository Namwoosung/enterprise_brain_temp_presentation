/* P04 · 모델은 우리 도메인을 모르고, 전부 넣어 줄 수도 없습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P04', steps: 4, section: '1 · 왜 어려운가', ctxSub: 'A 모델 한계', badge: '개념 · 공개 연구',
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
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "LLM의 지식 한계와 컨텍스트 한계 → 필요한 사실만 꺼내는 구조 + 구축 때도 사람이 기준을 먼저 준다.",
      script: [
        "LLM에 우리 설비의 PM 주기를 물으면 이런 답이 나옵니다. 틀린 말은 아니지만 우리 기준은 아닙니다. 근거도 없습니다.",
        "(→) 모델이 아는 건 공개된 일반 지식입니다. EQ-017이라는 코드가 FAB마다 따로 있다는 것, 설비팀이 말하는 PM이 무엇인지, 지난 회의에서 무엇을 정했는지는 모릅니다.",
        "(→) 그럼 사내 자료를 전부 넣으면 될까요. 세 가지 이유로 어렵습니다. 창이 커져도 전사 자료보다는 작고, 질문마다 전부 넣으면 비싸고 느리고, 긴 입력의 중간에 있는 정보는 덜 쓰인다는 연구가 있습니다.",
        "(→) 그래서 필요한 사실만 골라 꺼낼 구조가 필요합니다. 그리고 그 구조를 만드는 단계에서도 모델은 여전히 도메인을 모르니까, 용어 사전과 스키마와 예시를 먼저 주고, 그래도 틀릴 수 있으니 검증합니다.",
      ],
      discuss: "벡터 RAG로 문서 청크만 넣으면 안 되나? → 발표 3에서 이어서. 여기서는 '연결된 사실'과 '근거·시점·승인 상태'가 필요하다는 점만.",
      concept: "파라메트릭 지식(가중치) vs 비파라메트릭 지식(검색·컨텍스트로 주입). Lost in the Middle: 관련 정보가 입력 중간에 있으면 처음·끝보다 성능이 떨어짐.",
      src: "Liu et al., Lost in the Middle (TACL 2024)",
    },
  });
})();
