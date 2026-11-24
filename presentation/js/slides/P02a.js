/* P02a · 용어 정리: 데이터 모델 · 정의 언어 · 파일 형식은 서로 다른 층입니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P02a', steps: 3, section: '0 · 도입', badge: '개념 정리',
    title: '용어 정리: RDF · OWL · YAML · 속성 그래프는 같은 층이 아닙니다',
    takeaway: 'RDF와 속성 그래프는 데이터를 담는 모양, OWL은 개념을 정의하는 표준 언어, YAML은 파일 형식입니다',
    src: 'W3C RDF 1.1 · OWL 2 Primer · ISO/IEC 39075 GQL · Hogan et al., Knowledge Graphs (2021)',
    html() {
      let s = '';
      const L = [
        ['purple', '데이터 모델', '무엇에 담나', [['RDF', '모든 것을 주어 – 술어 – 목적어 세 칸(트리플)으로'], ['속성 그래프', '노드 · 관계에 라벨과 속성(키-값) — Neo4j 등']]],
        ['blue', '정의 언어', '개념 · 관계를 어떻게 정하나', [['RDFS · OWL', 'W3C 표준 · 클래스 계층 · 개수 · 역관계 → 추론기가 이해'], ['자체 스키마', 'YAML · LinkML · DB 제약 — 표준 추론은 없음']]],
        ['gray', '파일 형식', '어떻게 적어 두나', [['Turtle · JSON-LD', 'RDF를 글자로 적는 방법'], ['YAML · JSON', '그냥 파일 문법 — 내용은 쓰는 사람이 정함']]]];
      L.forEach(([c, h, sub, rows], i) => {
        const body = rows.map(([k, v]) => `<div style="margin-top:12px"><div class="s22 b">${k}</div><div class="s18 sub">${v}</div></div>`).join('');
        s += card(134 + i * 557, 236, 538, 360, c, `<h5>${sub}</h5><div class="s28 b c-${c === 'gray' ? 'fg' : c}">${h}</div>${body}`, 'data-v="1" data-nf');
      });
      /* 스텝 2: 같은 사실을 두 데이터 모델로 */
      s += card(134, 616, 818, 210, 'purple', `<h5>속성 그래프 (Cypher)</h5><pre class="code" style="font-size:16px;line-height:1.4;margin-top:6px">(:MaintenanceWork {wo_id:'WO-1042'})
  -[:ON_EQUIPMENT {source:'CMMS'}]->
(:Equipment {fab:'FAB-A', code:'EQ-017'})</pre><p class="s17" style="margin-top:6px">관계에 출처 · 기간을 바로 붙임</p>`, 'data-v="2"');
      s += card(968, 616, 818, 210, 'purple', `<h5>RDF (Turtle)</h5><pre class="code" style="font-size:16px;line-height:1.4;margin-top:6px">:WO-1042  a :MaintenanceWork ;
          :onEquipment :FAB-A_EQ-017 .</pre><p class="s17" style="margin-top:6px">출처를 달려면 사실을 노드로 빼거나 RDF-star가 필요 · OWL로 정의하면 추론 가능</p>`, 'data-v="2"');
      /* 스텝 3: 이 발표의 선택 */
      s += card(134, 846, 1652, 106, 'mint', `<div class="s24 b">이 발표의 선택 · 정의 = YAML + Git · 데이터 = 속성 그래프 · 표준 연계가 필요하면 RDF / OWL로 내보내기</div>
        <p class="s18 c-fg" style="margin-top:6px">agent가 쓰는 데 필요한 것(고정된 정의 · 같은 ID · 근거 · 질의)은 이 조합으로 충분합니다 → {{P17a}}장(정의 파일) · {{P23}}장(저장)</p>`, 'data-v="3"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "RDF · OWL · YAML · 속성 그래프를 같은 줄에 놓고 비교하지 않게, 층을 먼저 나눠 둔다.",
      script: [
        "온톨로지 이야기를 하면 RDF, OWL, YAML, 속성 그래프가 한꺼번에 나와서 헷갈립니다. 이 넷은 같은 층의 선택지가 아닙니다. RDF와 속성 그래프는 데이터를 담는 모양이고, RDFS와 OWL은 개념과 관계를 정의하는 표준 언어, YAML은 그냥 파일 형식입니다.",
        "(→) 같은 사실을 두 모양으로 적으면 이렇습니다. 속성 그래프는 관계에 출처나 기간을 바로 붙일 수 있고, RDF는 그러려면 사실을 따로 노드로 빼야 합니다. 대신 RDF에 OWL로 정의를 붙이면 표준 추론과 외부 표준 어휘 연결이 됩니다.",
        "(→) 이 발표에서는 정의는 YAML 파일로 Git에, 데이터는 속성 그래프에 둡니다. 외부 표준과 연결해야 할 때 RDF나 OWL로 내보내면 됩니다. agent가 쓰는 데 필요한 것은 이 조합으로 충분합니다.",
      ],
      discuss: "",
      concept: "RDF는 시맨틱 웹(2001)의 데이터 모델. RDF만으로는 추론이 거의 안 되고 RDFS(클래스 계층 · domain/range)부터 간단한 추론, OWL은 기술 논리 기반의 강한 표현력. OWL은 개방 세계라 '값 없음'을 오류로 보지 않음 → 검사는 SHACL · 코드. 상세: study/01_kg_and_ontology.md, study/ontology_formats.md",
      src: "W3C RDF 1.1 · OWL 2 Primer · Berners-Lee et al. (2001) · Hogan et al. (2021)",
    },
  });
})();
