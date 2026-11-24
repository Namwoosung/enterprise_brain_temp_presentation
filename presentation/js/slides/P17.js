/* P17 · 추출 ① 온톨로지와 출력 스키마를 먼저 정합니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P17', steps: 4, section: '4 · 추출', ctxSub: '03 추출', badge: '설계 예시',
    title: '추출 ① 온톨로지와 출력 스키마를 먼저 정합니다',
    takeaway: '정의는 YAML 한 곳에 두고, LLM 출력 스키마 · 검증 코드 · DB 제약은 거기서 만들어 냅니다',
    src: 'Neo4j GraphRAG Python · SimpleKGPipeline schema 옵션 · YAML은 자체 설계 예시',
    html() {
      let s = card(134, 240, 480, 420, 'red', `<h5>스키마 없이 문서 3건에서</h5>
        <table class="tb tight" style="margin-top:6px"><tr><th>문서</th><th>노드</th><th>관계</th></tr>
        <tr><td class="k mono s15">DOC-M201</td><td>Sensor</td><td>CAUSED</td></tr>
        <tr><td class="k mono s15">MAIL-T311</td><td>PressureSensor</td><td>원인</td></tr>
        <tr><td class="k mono s15">DOC-P088</td><td>부품</td><td>RELATED_TO</td></tr></table>
        <p class="s19 c-fg" style="margin-top:16px">같은 것이 세 가지 이름 → <b class="c-red">그래프가 파편화</b>되고, 조회 쿼리를 쓸 수 없다</p>`, 'data-v="1"', 'fill-red');
      s += card(640, 240, 612, 420, 'purple', `<h5>ontology/kg-schema.yaml</h5>${code(`version: 1.1.0
node_types:
  Equipment:
    key: [fab, code]
    required: [serial]
  PartType:
    key: [code]
    synonyms: [압력센서, P/T]
  MaintenanceWork:
    key: [wo_id]
    required: [status, evidence]
relation_types:
  ON_EQUIPMENT: {from: MaintenanceWork, to: Equipment}
  SUSPECTED_CAUSE: {from: Equipment, to: FailureMode}`, 's15')}`, 'data-v="2"');
      const O = [['LLM 출력 JSON 스키마', '타입은 enum · 필수 필드는 required'], ['검증 코드 (Pydantic)', '적재 전 형식 · 허용 패턴 검사'], ['Neo4j 제약', '키 · 유니크 (에디션별 차이)'], ['SHACL (선택)', 'RDF/표준 연계가 필요할 때']];
      let ln = '';
      O.forEach((o, i) => {
        const y = 240 + i * 108;
        s += card(1286, y, 500, 96, 'mint', `<div class="s20 b">${o[0]}</div><div class="s16 sub">${o[1]}</div>`, 'data-v="3"');
        ln += path(`M1252,450 C1268,450 1262,${y + 48} 1282,${y + 48}`, 'mint', { draw: true, w: 2, a: 'data-v="3"' });
      });
      s += svg(ln);
      const M = [['FREE', '제약 없음', '발굴용'], ['EXTRACTED (기본값)', 'LLM이 먼저 스키마를 추론', '실행마다 달라질 수 있음'], ['사용자 정의', '노드 · 관계 타입 · 허용 패턴 지정', '운영 권장']];
      M.forEach((m, i) => { s += card(134 + i * 418, 690, 398, 160, 'blue', `<h5>SimpleKGPipeline schema</h5><div class="s20 b mono">${m[0]}</div><p class="c-fg">${m[1]}</p><p>${m[2]}</p>`, 'data-v="4"'); });
      s += card(1388, 690, 398, 160, 'mint', `<h5>원칙</h5><div class="s19 b">열린 추출은 확장 후보 발굴용</div><div class="s19 b c-mint">적재는 닫힌 스키마로</div>`, 'data-v="4"', 'fill-mint');
      s += t(134, 874, 1652, '스키마 밖에서 자주 나오는 개념은 버리지 않고 "확장 후보 큐"로 모아 온톨로지 PR의 근거로 씁니다', 's20 sub center', 'data-v="4"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "스키마 없는 추출은 파편화 → YAML 단일 출처에서 출력 스키마·검증·제약을 생성.",
      script: [
        "스키마 없이 문서 세 건에서 추출하면, 같은 센서가 Sensor, PressureSensor, 부품이라는 세 가지 이름으로, 관계도 CAUSED, 원인, RELATED_TO로 나옵니다. 이러면 조회 쿼리를 쓸 수 없습니다.",
        "(→) 그래서 온톨로지를 YAML로 먼저 정합니다. 노드 타입과 키, 필수 속성, 동의어, 관계의 방향까지.",
        "(→) 이 YAML 하나에서 LLM 출력 JSON 스키마, 적재 전 검증 코드, Neo4j 제약, 필요하면 SHACL까지 만들어 냅니다. 정의가 한 곳에 있으니 서로 어긋나지 않습니다.",
        "(→) 프레임워크도 이 방향입니다. Neo4j SimpleKGPipeline에는 FREE, EXTRACTED, 사용자 정의 스키마 모드가 있는데, 기본값인 EXTRACTED는 실행마다 스키마가 달라질 수 있어 운영에서는 사용자 정의가 낫습니다. 열린 추출은 발굴용, 적재는 닫힌 스키마로.",
      ],
      discuss: "",
      concept: "구조화 출력이 보장하는 것은 '형식'뿐. 내용이 맞는지는 검증 단계의 일.",
      src: "Neo4j GraphRAG Python · SimpleKGPipeline schema",
    },
  });
})();
