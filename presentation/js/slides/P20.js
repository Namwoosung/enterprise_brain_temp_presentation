/* P20 · 검증 ① 프로그램이 먼저 거릅니다: 온톨로지에 맞는가
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P20', steps: 4, section: '4 · 검증', ctxSub: '04 검증', badge: '데모 · 공개 문서',
    title: '검증 ① 프로그램이 먼저 거릅니다: 온톨로지에 맞는가',
    takeaway: '싸고 확실한 검사부터 합니다. 형식과 온톨로지 위반은 사람에게 보내기 전에 걸러냅니다',
    src: 'Neo4j Cypher Manual · Constraints · neosemantics(n10s) SHACL validation',
    html() {
      const R = [
        ['허용 타입인가', '"증상" · "PM 주기" (온톨로지에 없음 · 데모)', chip('반려', 'rej sans') + ' → 확장 후보 큐', 1],
        ['허용 관계 · 방향인가', '<span class="mono">(Equipment)-[USED_PART_TYPE]-&gt;(PartType)</span> (데모 stt F06)', chip('반려', 'rej sans'), 1],
        ['필수 속성', 'MaintenanceWork에 evidence 없음', chip('반려', 'rej sans'), 2],
        ['중복', '같은 WO-1042가 두 번 (데모 CMMS export)', chip('병합', 'okl sans'), 2],
        ['값 범위 · 형식', '완료일 &lt; 시작일', chip('보류', 'hold sans'), 3],
        ['참조 무결성', '없는 설비 FAB-A/EQ-071 참조 (데모 WO-1044)', chip('보류', 'hold sans'), 3]];
      let s = tbl(134, 240, 1652, ['검사', '실패 예', '결과'], R.map(r => ({ a: `data-v="${r[3]}"`, c: r.slice(0, 3) })), { cls: 'lg', widths: ['22%', '50%', '28%'] });
      const I = [['적재 전 코드', 'JSON Schema · Pydantic', 'YAML에서 생성 · 어떤 DB에도 그대로 씀'], ['SHACL', 'W3C 표준 그래프 검증 규칙', 'RDF 계열 도구용 · Neo4j는 플러그인(n10s) 필요'], ['DB 자체 제약', 'DB · 에디션마다 다름', '예: Neo4j Community는 유니크만 지원']];
      I.forEach((x, i) => { s += card(134 + i * 556, 724, 540, 156, 'purple', `<h5>${x[0]}</h5><div class="s21 b s20">${x[1]}</div><p>${x[2]}</p>`, 'data-v="4"'); });
      s += t(134, 900, 1652, 'DB가 막아 주는 범위는 제품마다 다르다 → 적재 전 코드 검증을 기본으로 두고, DB 제약은 보조로', 's20 sub center', 'data-v="4"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "스키마 적합성 검사 목록과 구현 수단, 에디션별 제약 차이.",
      script: [
        "검증의 첫 단계는 프로그램입니다. 온톨로지에 없는 개념이면 반려하되 버리지 않고 확장 후보 큐로 보냅니다. 데모에서는 메일의 '압력 흔들림' 같은 증상과 회의의 'PM 주기'가 그렇게 후보가 됐습니다. 관계의 종류와 방향이 허용된 것인지도 봅니다. 데모에서 LLM이 정비 작업 대신 설비를 주어로 'B동 17호기가 RF 제너레이터를 사용'처럼 뽑았는데, 이 검사에서 거절됐습니다.",
        "(→) 필수 속성이 없으면 반려하고, 같은 작업이 두 번이면 병합합니다. 데모 CMMS export에는 WO-1042 행이 두 번 들어 있어서 한 번만 처리합니다.",
        "(→) 완료일이 시작일보다 빠르거나 없는 설비를 참조하면 보류합니다. 데모의 WO-1044는 없는 설비 EQ-071을 가리킵니다. 같은 행의 일련번호는 EQ-017을 가리키지만 자동으로 고치지 않고 행 전체를 보류합니다.",
        "(→) 구현 방법은 세 가지입니다. 적재 전에 코드로 검사하는 방법은 어떤 DB를 쓰든 그대로 쓸 수 있습니다. SHACL은 W3C 표준 검증 규칙인데 RDF 계열 도구에서 주로 쓰고, Neo4j에서는 n10s라는 플러그인이 있어야 합니다. DB 자체 제약은 제품과 에디션마다 다릅니다. 예를 들어 Neo4j Community는 유니크 제약만 있고 필수 속성은 막지 못합니다. 그래서 코드 검증을 기본으로 두고 DB 제약은 보조로 씁니다.",
      ],
      discuss: "",
      concept: "OWL은 개방 세계 가정이라 '필수 속성 없음'을 오류로 잡지 않는다. 적재 검증은 SHACL·코드(폐쇄 세계 관점).",
      src: "Neo4j Cypher Manual Constraints · neosemantics SHACL",
    },
  });
})();
