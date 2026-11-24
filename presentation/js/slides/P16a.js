/* P16a · 정제 정리 · 할 일과 방법 선택
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P16a', steps: 3, section: '4 · 정제', ctxSub: '02 정제', badge: '설계 가이드',
    title: "정제 정리 · 할 일과 방법 선택",
    takeaway: "규칙과 용어 사전으로 대부분을 처리하고, 정형 레코드는 키 일치 → 확률 모델, 남는 애매한 것만 LLM 후보 + 사람 검토로",
    src: "Fellegi & Sunter (1969) · Splink 문서 · Li et al., Ditto (VLDB 2020) · Dedupe 문서",
    html() {
      let s = '';
      /* 스텝 1: 이 단계에서 개발자가 할 일 */
      s += card(134, 236, 520, 590, 'purple', `<h5>정제 · 개발자가 할 일</h5><ol class="todo s20"><li><b>소스별 잡음 제거 규칙</b><span>회신 인용 · 서명 · 고지문, STT 간투사 · 반복 · 불명확</span></li><li><b>표준화 규칙</b><span>날짜 · 단위 · 코드 표기를 한 형식으로, 원래 값은 보존</span></li><li><b>용어 사전 만들고 키우기</b><span>표준어 · 동의어 · 맥락 단어 · 미연결 큐를 빈도순으로</span></li><li><b>ER 기준 정하기</b><span>무엇이 같으면 같은 대상인지(키), 비교 범위(블로킹), 임계값 2개</span></li><li><b>판정 이유 남기기</b><span>왜 합쳤는지 · 왜 검토로 보냈는지</span></li><li><b>되돌릴 수 있게</b><span>물리 병합 대신 SAME_AS 후보 · 병합 기록</span></li></ol>`, 'data-v="1" data-nf');
      /* 스텝 2: 흔히 쓰는 방법 비교 · 스텝 3: 우리 선택 강조 */
      const rows = [
        { a: 'data-c="pick@3"', c: [`규칙 · 용어 사전 ${chip('우리 선택', 'ok sans')}`, `설명 가능 · 빠름 · 재현됨`, `새 표현을 못 잡음 · 유지 부담`, `형식이 정해진 값 · 자주 나오는 용어`] },
        { a: 'data-c="pick@3"', c: [`확률적 ER (Fellegi-Sunter · Splink) ${chip('우리 선택', 'ok sans')}`, `라벨 없이 대량 레코드 판정`, `비교 필드 설계 필요`, `여러 시스템의 정형 레코드`] },
        { a: '', c: [`학습 기반 (Dedupe 능동 학습 · Ditto)`, `정확도 높음`, `라벨 데이터 필요`, `라벨을 모을 수 있을 때`] },
        { a: '', c: [`LLM 판정`, `문맥이 필요한 애매한 언급에 강함`, `비용 · 결과 흔들림 · 없는 ID 생성`, `규칙으로 남은 소수의 텍스트 언급`] },
      ];
      s += card(690, 236, 1096, 590, 'gray', `<h5>흔히 쓰는 방법</h5>`, 'data-v="2"', 'panel');
      s += tbl(706, 278, 1064, ["방법", "장점", "단점", "맞는 경우"], rows, { a: 'data-v="2"', cls: 'lg', widths: ['27%', '23%', '25%', '25%'] });
      /* 스텝 3: 우리 상황에서의 선택 */
      s += card(134, 846, 1652, 106, 'mint', `<div class="s22 b c-mint">우리 상황에서는</div><p class="s19 c-fg" style="margin-top:4px">규칙 + 사전 우선, 설비 · 작업 같은 정형 레코드는 업무 키 일치 후 필요하면 Splink, 남는 애매한 언급만 LLM이 후보를 고르고 사람이 검토 큐에서 확정</p>`, 'data-v="3"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "정제 단계에서 개발자가 할 일, 흔한 방법들의 장단점, 우리 상황의 선택을 한 장으로 정리한다.",
      script: [
        "정제에서 개발자가 할 일은 잡음 제거 규칙, 날짜·단위·코드 표준화, 용어 사전을 만들고 키우는 일, 같은 대상 판단 기준을 정하는 일, 그리고 판정 이유를 남기고 되돌릴 수 있게 하는 일입니다.",
        "(→) 같은 대상을 찾는 방법은 크게 넷입니다. 규칙과 사전은 설명 가능하고 빠르지만 새 표현을 못 잡고, 확률 모델은 라벨 없이 대량 레코드를 판정하고, 학습 모델은 정확하지만 라벨이 필요하고, LLM은 문맥이 필요한 애매한 경우에 강하지만 비용과 흔들림이 있습니다.",
        "(→) 우리는 규칙과 사전을 먼저, 정형 레코드는 업무 키 일치와 필요하면 확률 모델, 남는 애매한 언급만 LLM이 후보를 고르고 사람이 확정하는 순서가 맞습니다. 사람은 건이 아니라 사전과 규칙을 고칩니다.",
      ],
      discuss: "",
      concept: "Splink는 Fellegi-Sunter 모델을 EM으로 학습(라벨 불필요), DuckDB · Spark에서 동작. Ditto는 사전학습 언어모델 기반 entity matching(VLDB 2020).",
      src: "Fellegi & Sunter (1969) · Splink 문서 · Li et al., Ditto (VLDB 2020) · Dedupe 문서",
    },
  });
})();
