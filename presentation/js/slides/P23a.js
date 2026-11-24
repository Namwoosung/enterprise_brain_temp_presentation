/* P23a · 적재 정리 · 할 일과 방법 선택
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P23a', steps: 3, section: '4 · 적재', ctxSub: '05 적재', badge: '설계 가이드',
    title: "적재 정리 · 할 일과 방법 선택",
    takeaway: "정의와 원장은 파일 · Git(나중에 RDB)에, 조회용 사본은 속성 그래프에, 대량의 세부 값은 원천에 두고 참조로 잇습니다",
    src: "Neo4j Cypher Manual · W3C R2RML · Ontop 문서 · 자체 설계",
    html() {
      let s = '';
      /* 스텝 1: 이 단계에서 개발자가 할 일 */
      s += card(134, 236, 520, 590, 'purple', `<h5>적재 · 개발자가 할 일</h5><ol class="todo s20"><li><b>그래프 모델 생성</b><span>정의 파일 → 라벨 · 관계 타입 · 키 제약</span></li><li><b>멱등 적재</b><span>키로 MERGE · 같은 배치 재실행 시 변화 0</span></li><li><b>staging → 검사 → publish</b><span>한 번에 반영 · 실패하면 반영 안 함</span></li><li><b>근거 · 유효 기간 저장 방식</b><span>그래프엔 근거 ID · 상세는 원장</span></li><li><b>삭제 대신 무효화</b><span>valid_to · status로 이력 보존</span></li><li><b>재구축 · 조회 준비</b><span>원본 + 정의로 다시 만들기 · 인덱스 · 벡터</span></li></ol>`, 'data-v="1" data-nf');
      /* 스텝 2: 흔히 쓰는 방법 비교 · 스텝 3: 우리 선택 강조 */
      const rows = [
        { a: 'data-c="pick@3"', c: [`속성 그래프 DB (Neo4j 등) ${chip('우리 선택', 'ok sans')}`, `관계 탐색 · 개발 편함`, `표준 의미 · 추론 약함`, `agent · 사람의 탐색 조회`] },
        { a: '', c: [`RDF 트리플 저장소`, `표준 · 추론 · 외부 연계`, `배우기 어려움`, `표준 어휘 연계 · 조직 간 교환`] },
        { a: '', c: [`RDB에 노드 · 엣지 테이블`, `운영 익숙 · 트랜잭션`, `여러 단계 탐색 쿼리가 복잡`, `원장 · 검토 이력`] },
        { a: 'data-c="pick@3"', c: [`가상 KG (원천 그대로 + 매핑) ${chip('우리 선택', 'ok sans')}`, `복사 없음 · 항상 최신`, `문서에 약함 · 원천 성능 의존`, `대량 측정값 · 이력 테이블`] },
      ];
      s += card(690, 236, 1096, 590, 'gray', `<h5>흔히 쓰는 방법</h5>`, 'data-v="2"', 'panel');
      s += tbl(706, 278, 1064, ["저장 방식", "장점", "단점", "맞는 경우"], rows, { a: 'data-v="2"', cls: 'lg', widths: ['27%', '23%', '25%', '25%'] });
      /* 스텝 3: 우리 상황에서의 선택 */
      s += card(134, 846, 1652, 106, 'mint', `<div class="s22 b c-mint">우리 상황에서는</div><p class="s19 c-fg" style="margin-top:4px">조회 사본은 속성 그래프(개체 · 관계 · 근거 ID), 측정값 · 이력 같은 대량 값은 원천에 두고 Dataset 노드로 참조, 적재는 증분 MERGE + 주기적 전체 재구축으로 차이 확인</p>`, 'data-v="3"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "적재 단계에서 개발자가 할 일, 흔한 방법들의 장단점, 우리 상황의 선택을 한 장으로 정리한다.",
      script: [
        "적재에서 개발자가 할 일은 정의 파일에서 그래프 모델을 만들고, 다시 넣어도 같은 결과가 나오게, staging과 publish로 나누고, 근거와 유효 기간을 어떻게 둘지, 삭제 대신 무효화, 그리고 재구축과 조회 준비입니다.",
        "(→) 저장 방식은 넷이 흔합니다. 속성 그래프는 탐색과 개발이 편하고, RDF 저장소는 표준과 추론에 강하고, RDB의 노드·엣지 테이블은 운영이 익숙하지만 탐색 쿼리가 복잡하고, 가상 KG는 데이터를 복사하지 않지만 문서에 약합니다.",
        "(→) 우리는 조회용 사본을 속성 그래프로, 대량 값은 원천에 두고 참조로 잇습니다. 적재는 증분으로 하되, 가끔 원본에서 전체를 다시 만들어 차이가 없는지 봅니다.",
      ],
      discuss: "",
      concept: "가상 KG(OBDA): 온톨로지 + R2RML 매핑으로 RDB를 그래프처럼 질의(Ontop). NVIDIA Auto Ontology도 개념 ↔ 테이블 매핑 + text-to-SQL이라 같은 계열.",
      src: "Neo4j Cypher Manual · W3C R2RML · Ontop 문서 · 자체 설계",
    },
  });
})();
