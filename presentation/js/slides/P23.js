/* P23 · 적재: 저장소마다 역할을 나누고, 다시 넣어도 그대로이게
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P23', steps: 5, section: '4 · 적재', ctxSub: '05 적재', badge: '설계 예시',
    title: '적재: 저장소마다 역할을 나누고, 다시 넣어도 그대로이게',
    takeaway: '원본 · 원장 · 정의가 기준이고 그래프는 다시 만들 수 있는 조회용 사본입니다',
    src: 'Neo4j Cypher Manual (MERGE) · DuckDB · Apache Parquet · 자체 설계',
    html() {
      let s = tbl(134, 240, 800, ['저장소', '담는 것', '역할'], [
        ['파일 스토리지', '원본 문서 · CSV · 로그 (불변)', chip('기준', 'src sm sans')],
        ['Parquet + DuckDB', '정제본 · 수집 기록 · 추출 후보 (서버 없음)', chip('기준', 'src sm sans')],
        ['Git', '온톨로지 · 매핑 규칙 · 프롬프트', chip('기준', 'src sm sans')],
        ['RDB (필요 시)', '검토 · 승인 이력 · 질문 큐 — 여러 명이 동시에 쓸 때', chip('나중', 'hold sm sans')],
        ['Neo4j', '승인된 사실의 조회용 투영 · 청크 벡터 인덱스', chip('사본', 'gray sm sans')],
        ['RDF (필요 시)', '표준 어휘 연계 · 교환 형식', chip('선택', 'gray sm sans')]], { a: 'data-v="1"', cls: 'tight', widths: ['22%', '60%', '18%'] });
      s += card(134, 628, 800, 324, 'purple', `<h5>근거를 그래프에 어떻게 붙이나</h5>
        <div class="s19 b" style="margin-top:6px">A · 관계 속성</div><div class="mono s15">(WO-1042)-[:USED_PART_TYPE {evidence, certainty}]-&gt;(PT-V42)</div><p>단순 · 근거가 여러 개면 뭉개짐</p>
        <div class="s19 b" style="margin-top:8px">B · 사실 노드 (Assertion)</div><div class="mono s15">(WO-1042)-&gt;(:Assertion A-WO1042-COMPLETED)-&gt;(:Evidence ×2)</div><p>근거 · 검토 이력 · 유효 기간을 붙이기 쉬움 · 쿼리는 길어짐</p>
        <p class="s17 c-fg" style="margin-top:8px">→ 조회용 직접 관계 + 근거용 Assertion을 같이 두는 혼합이 흔하다</p>`, 'data-v="2"');
      s += card(970, 240, 816, 360, 'red', `<h5>MERGE 함정</h5><pre class="code s16"><span class="c">// ✗ 패턴 전체 MERGE — 패턴이 없으면 끝 노드까지 새로 만든다</span>
MERGE (w:MaintenanceWork {wo_id:'WO-1042'})
      -[:ON_EQUIPMENT]-&gt;(e:Equipment {fab:'FAB-A', code:'EQ-017'})

<span class="m">// ✓ 노드는 키로 각각, 관계는 그다음</span>
MERGE (w:MaintenanceWork {wo_id:$wo})
MERGE (e:Equipment {fab:$fab, code:$code})
MERGE (w)-[:ON_EQUIPMENT]-&gt;(e)</pre><p class="s17" style="margin-top:8px">MERGE 키에는 유니크(또는 키) 제약 — 동시 실행에서도 중복 방지</p>`, 'data-v="3"');
      s += card(970, 628, 816, 220, 'mint', `<h5>staging → 검사 → publish</h5>
        <div class="row" style="margin-top:6px">${chip('cmms load', 'okl')}<span class="s20">EQ-017 주변 노드 <span class="mono">4 → <b class="c-mint">5</b></span> · 관계 <span class="mono">2 → <b class="c-mint">4</b></span> <span class="s16 sub">(전체 41 · 91 → 73 · 155)</span></span></div>
        <div class="row" style="margin-top:8px">${chip('같은 배치 재실행', 'gray sans')}<span class="s20">변화 <b class="mono">0</b> (멱등)</span></div>
        <p class="s17 c-fg" style="margin-top:10px">삭제 대신 무효화 (valid_to · status) → 이력 보존 · 롤백 쉬움</p>`, 'data-v="4"', 'fill-mint');
      s += card(970, 868, 816, 84, 'orange', `<div class="s20"><b class="c-orange">데모</b> · 적재 단계 화면 · 그래프 패널에서 "변화" 쿼리 실행</div>`, 'data-v="5"', 'fill-orange');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "기준(원본·원장·정의) vs 사본(그래프·벡터), 근거 모델링, MERGE 함정, 멱등 publish.",
      script: [
        "저장소는 역할이 다릅니다. 원본 파일, Parquet로 남긴 정제본과 수집 기록, Git의 정의가 기준이고, Neo4j의 그래프와 벡터 인덱스는 다시 만들 수 있는 사본입니다. 지금은 RDB를 운영하지 않으니 DuckDB처럼 서버 없는 도구로 시작하고, 검토·승인 이력을 여러 사람이 동시에 쓰게 되면 그때 RDB를 들입니다. 수정은 항상 기준 쪽을 거쳐야 합니다.",
        "(→) 근거를 그래프에 붙이는 방법은 두 가지입니다. 관계 속성에 넣으면 단순하지만 근거가 여러 개면 뭉개집니다. 사실 노드를 따로 두면 근거와 검토 이력, 유효 기간을 붙이기 쉽지만 쿼리가 길어집니다. 실무에서는 둘을 같이 둡니다.",
        "(→) Cypher에서 흔한 실수입니다. 패턴 전체를 MERGE하면 패턴이 없을 때 끝 노드까지 새로 만들어 중복이 생깁니다. 노드는 키로 각각, 관계는 그다음에 MERGE하고, 키에는 유니크 제약을 겁니다.",
        "(→) 후보는 staging에 쓰고 검사를 통과하면 publish 단위로 반영합니다. 데모에서 EQ-017 주변은 노드 4개에서 5개, 관계 2개에서 4개가 됩니다. 전체로는 문서와 청크, 검토 항목까지 포함해 노드 41개에서 73개, 관계 91개에서 155개입니다. 같은 배치를 다시 돌리면 변화가 0이어야 하고, 데모에서 실제로 0인지 확인합니다. 삭제 대신 무효화해서 이력을 남깁니다.",
        "(→) 이 부분은 데모 웹의 적재 단계와 그래프 패널의 '변화' 쿼리로 보여드리겠습니다.",
      ],
      discuss: "왜 RDF/OWL이 아니라 속성 그래프인가? → 조회·탐색·개발 생산성 우선, 정의가 YAML 단일 출처라 필요 시 RDF로도 컴파일 가능.",
      concept: "Reification(사실 노드) · n항 관계 패턴. NVIDIA Auto Ontology가 그래프 개념을 Postgres 테이블로 둔 것도 '원장과 트랜잭션을 한 곳에'라는 관점으로 해석 가능(공식 설명 없음).",
      src: "Neo4j Cypher Manual · NVIDIA Auto Ontology 공개 문서",
    },
  });
})();
