/* P10 · 각 단계를 누가 하나: 사람 · 프로그램 · LLM
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P10', steps: 4, section: '2 · 파이프라인', badge: '자체 설계',
    title: '각 단계를 누가 하나: 사람 · 프로그램 · LLM',
    takeaway: 'LLM 열에는 "확정"이 없습니다 — 확정은 규칙 · 원천 시스템 · 사람이 합니다',
    src: '자체 설계 · ● 주도 ○ 보조',
    html() {
      const v = n => `data-v="${n}"`;
      const head = ['단계', ['<span class="c-purple">사람</span>', v(1)], ['<span class="c-purple">프로그램</span>', v(2)], ['<span class="c-blue">LLM</span>', v(3)]];
      const R = [
        ['온톨로지', '● 개념 · 관계 결정', '● 스키마 · 제약 생성', '○ 확장 후보 제안'],
        ['수집', '○ 개인 자료 업로드 · 소스 지정', '● 커넥터 · 스케줄 · 해시', '—'],
        ['정제', '● 용어 사전 소유', '● 형식 정리 · 중복 · ER 규칙', '○ 동의어 · 애매한 쌍 설명'],
        ['추출', '○ 예시 · 반례 제공', '● 정형 매핑', '● 문서에서 후보 추출'],
        ['검증', '● 고위험 · 애매 승인', '● 스키마 · 원천 대조', '○ 원문 함의 1차 판정'],
        ['적재', '—', '● staging → publish', '—'],
        ['평가', '● CQ 작성 · 표본 판정', '● 지표 계산 · 회귀 테스트', '○ 표본 층 나누기 신호']];
      const rows = R.map(r => [r[0], [r[1], v(1)], [r[2], v(2)], [r[3], v(3)]]);
      let s = tbl(134, 240, 1652, head, rows, { cls: 'lg', widths: ['12%', '29%', '30%', '29%'] });
      s += card(134, 770, 900, 182, 'mint', `<h5>원칙</h5><div class="s26 b" style="margin-top:6px">LLM은 후보를 만들고, 확정은 하지 않는다</div><p class="s19 c-fg" style="margin-top:8px">규칙으로 되는 것은 규칙으로 — 비용 · 재현성 · 검증 부담이 다르다</p>`, 'data-v="4"', 'fill-mint');
      s += card(1064, 770, 722, 182, 'orange', `<h5>함께 고민할 점</h5><div class="s24 b" style="margin-top:6px">LLM이 두 번 확인한 결과는 사람 없이 올려도 될까?</div><p class="s17" style="margin-top:6px">→ 21 · 22장에서 기준을 봅니다</p>`, 'data-v="4"', 'fill-orange');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "사람은 기준과 예외, 프로그램은 반복과 검사, LLM은 비정형 후보. LLM 열에 확정은 없다.",
      script: [
        "먼저 사람의 역할입니다. 개념과 관계를 결정하고, 용어 사전을 소유하고, 고위험이나 애매한 것을 승인하고, 업무 질문을 쓰고 표본을 판정합니다.",
        "(→) 프로그램은 반복적이고 정답이 정해진 일을 맡습니다. 커넥터, 형식 정리, 정형 매핑, 스키마 검사, 적재, 지표 계산입니다.",
        "(→) LLM은 문서에서 후보를 뽑는 게 주 역할이고, 나머지는 보조입니다. 동의어 제안, 원문 함의 1차 판정, 온톨로지 확장 후보 제안 같은 것들입니다.",
        "(→) 이 표에서 가장 중요한 건 LLM 열에 '확정'이 없다는 겁니다. 그리고 규칙으로 되는 건 규칙으로 하는 게 비용, 재현성, 검증 부담 모두에서 유리합니다.",
      ],
      discuss: "LLM이 두 번 확인한 결과는 사람 없이 올려도 될까? (21·22장에서 근거)",
      concept: "",
      src: "자체 설계",
    },
  });
})();
