/* P12 · [데모] 임시 온톨로지를 Neo4j에서 봅니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P12', steps: 1, section: '3 · 데모', ctxSub: '데모 안내', badge: '라이브 데모',
    title: '[데모] 임시 온톨로지를 Neo4j에서 봅니다',
    takeaway: '발표 화면을 잠시 떠나 Neo4j Browser와 온톨로지 YAML을 직접 보여드립니다',
    src: '데모 스키마 기준 쿼리 · demo/ontology/ontology.v1.yaml · 데모 웹의 그래프 패널에서도 실행 가능',
    focus: false,
    html() {
      let s = card(134, 240, 600, 712, 'orange', `<h5>지금</h5><div class="big40" style="margin-top:6px">Neo4j Browser로<br>전환합니다</div>
        <div class="row" style="margin-top:28px"><span class="kbd">Alt</span><span class="kbd">Tab</span><span class="s18 sub">또는 브라우저 탭 전환</span></div>
        <div style="margin-top:36px"><h5>돌아올 곳</h5><div class="s26 b">13 · 수집</div></div>
        <div style="margin-top:30px"><h5>준비물</h5>${ul(['데모 웹 · 그래프 패널 로그인 확인', '온톨로지 YAML (ontology.v1.yaml)', '데모 실패 시 백업 스크린샷'], 's18')}</div>`, '', 'fill-orange');
      const items = [
        ['라벨 · 관계 타입', 'CALL db.labels();\nCALL db.relationshipTypes();'],
        ['제약 · 인덱스', 'SHOW CONSTRAINTS;  SHOW INDEXES;'],
        ['기준 서브그래프', "MATCH (e:Equipment {fab:'FAB-A', code:'EQ-017'})-[r]-(n)\nWHERE NOT n:Chunk RETURN e, r, n;"],
        ['근거 따라가기', "MATCH (w:MaintenanceWork)-[r:ON_EQUIPMENT]->(:Equipment {fab:'FAB-A', code:'EQ-017'})\nRETURN w.code, r.sources ORDER BY w.code;"],
        ['YAML ↔ 화면 대응', 'ontology/ontology.v1.yaml  →  라벨 · 관계 · 키 · 기준 시스템']];
      items.forEach((x, i) => {
        s += card(770, 240 + i * 146, 1016, 130, 'gray', `<div class="row"><span class="num gray">${i + 1}</span><span class="s22 b">${x[0]}</span></div>${code(x[1], 's16')}`, '', 'panel');
      });
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "Neo4j Browser로 전환해 라벨·제약·기준 서브그래프·근거 경로·YAML 대응을 보여준다.",
      script: [
        "지금부터 잠깐 데모 웹으로 넘어가겠습니다. 그래프 패널은 Neo4j Browser를 그대로 붙인 것입니다.",
        "먼저 라벨과 관계 타입 목록으로 온톨로지에서 정한 것만 있는지 봅니다. 다음으로 제약을 보고, FAB-A EQ-017 주변 기준 서브그래프를 봅니다. 같은 코드의 FAB-B 설비가 따로 있는 것도 확인합니다.",
        "그다음 EQ-017의 정비 작업마다 어느 기준 자료에서 왔는지 sources 속성을 따라가 보겠습니다. 마지막으로 ontology.v1.yaml 파일과 화면의 라벨·관계가 어떻게 대응하는지 보여드립니다.",
        "돌아와서는 13장, 수집부터 이어가겠습니다.",
      ],
      discuss: "",
      concept: "Browser 버튼은 질의를 입력창에 채우기만 한다. 실행은 Run을 눌러야 한다. 그래프 패널은 처음 한 번 로그인 필요. 화면 배치는 키보드 1 설명 · 2 나란히 · 3 그래프.",
      src: "데모 스키마 기준 쿼리",
    },
  });
})();
