/* P23b · 실제 데이터와 잇기: 그래프엔 뼈대, 세부 값은 원천에
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P23b', steps: 3, section: '4 · 적재', ctxSub: '05 적재', badge: '설계 가이드',
    title: '실제 데이터와 잇기: 그래프엔 뼈대, 세부 값은 원천에',
    takeaway: '설비 · 작업 같은 개체와 관계만 그래프에 두고, 측정값 · 이력 · 문서 본문은 원천에 둔 채 어디서 어떻게 가져오는지를 연결합니다',
    src: 'Xiao et al., Ontology-Based Data Access (IJCAI 2018) · W3C R2RML · Ontop · Neo4j GraphRAG(lexical graph)',
    html() {
      let s = '';
      const C = [
        ['green', '업무 DB · MES · CMMS', '설비 · 부품 · 작업 같은 마스터와 관계', '측정값 · 상태 이력 테이블', '개념 ↔ 테이블 · 컬럼 매핑 → 필요할 때 SQL'],
        ['orange', '엑셀 · CSV 수만 개', '파일마다 Dataset 노드(경로 · 담당 · 열 스키마 · 대상 설비 · 기간), 요약 · 핵심 사실', '셀 값 전체 (Parquet로 정리)', 'Dataset → 개체 연결 · 조회는 DuckDB 등'],
        ['blue', '문서 · 회의자료 · 메일', '검증된 사실 + 문서 · 조각 노드', '본문 (조각 텍스트 · 벡터 인덱스)', '조각 → 언급된 개체(MENTIONS) · 근거 ID']];
      C.forEach(([c, h, up, keep, link], i) => {
        s += card(134 + i * 557, 236, 538, 334, c, `<h4 class="s24">${h}</h4>
          <div class="s17 c-mint b" style="margin-top:10px">그래프에 올리는 것</div><div class="s18">${up}</div>
          <div class="s17 sub b" style="margin-top:10px">원천에 두는 것</div><div class="s18 sub">${keep}</div>
          <div class="s17 c-${c} b" style="margin-top:10px">잇는 방법</div><div class="s18">${link}</div>`, 'data-v="1" data-nf');
      });
      /* 스텝 2: 참조 모양과 agent가 쓰는 순서 */
      s += card(134, 590, 980, 236, 'purple', `<h5>그래프의 참조 예</h5><pre class="code" style="font-size:16px;line-height:1.45;margin-top:6px">(:Equipment {fab:'FAB-A', code:'EQ-017'})
  -[:HAS_DATA]->(:Dataset {system:'MES', table:'eqp_state_hist',
                            key:'EQ-017', query:'SELECT ... WHERE eqp_id = $code'})
(:Chunk {doc:'DOC-M201', page:3})-[:MENTIONS]->(:Equipment ...)</pre>`, 'data-v="2"');
      s += card(1134, 590, 652, 236, 'mint', `<h5>agent가 쓰는 순서</h5>${ul(['① 그래프로 대상 찾기 (어느 설비 · 어느 작업)', '② 연결된 Dataset의 조회 방법으로 값 가져오기', '③ 문서 조각으로 근거 붙이기'], 's19')}`, 'data-v="2"');
      /* 스텝 3: 이름과 우리 선택 */
      s += card(134, 846, 1652, 106, 'orange', `<div class="s22 b">표준 이름 · 가상 KG(OBDA: R2RML · Ontop) · 데이터 카탈로그 · 시맨틱 레이어 — NVIDIA Auto Ontology도 같은 계열</div>
        <p class="s18 c-fg" style="margin-top:6px">우리는 마스터 · 관계 · 검증된 사실은 그래프에, 대량 값은 원천 · Parquet에 두고 Dataset 노드로 참조합니다</p>`, 'data-v="3"', 'fill-orange');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "그래프에 세부 데이터를 다 넣지 않는다. 개체와 관계는 그래프, 대량 값은 원천, 그 사이를 참조로 잇는다.",
      script: [
        "온톨로지를 만든 다음 실제 데이터를 어떻게 잇느냐는 질문이 많습니다. 수만 개의 엑셀, 업무 DB, 회의자료를 그래프에 전부 넣는 건 비효율적이고 필요하지도 않습니다. 그래프에는 설비, 부품, 작업 같은 개체와 관계, 검증된 사실만 두고, 측정값이나 이력, 문서 본문은 원천에 둡니다.",
        "(→) 대신 어디서 어떻게 가져오는지를 연결합니다. 설비 노드에 Dataset 노드를 이어서 어느 시스템의 어느 테이블을 어떤 질의로 보면 되는지 적어 두고, 문서는 조각이 어떤 개체를 언급하는지 잇습니다. agent는 그래프로 대상을 찾고, 연결된 조회 방법으로 값을 가져오고, 문서 조각으로 근거를 붙입니다.",
        "(→) 이 방식에는 가상 KG, 데이터 카탈로그, 시맨틱 레이어 같은 이름이 있고, NVIDIA Auto Ontology도 같은 계열입니다. 우리는 마스터와 관계, 검증된 사실은 그래프에, 대량 값은 원천과 Parquet에 두고 참조로 잇습니다. 조회 쪽 자세한 이야기는 발표 3에서 다룹니다.",
      ],
      discuss: "우리 데이터 중 그래프에 꼭 있어야 하는 것과, 참조만 있으면 되는 것은?",
      concept: "OBDA(Ontology-Based Data Access): 온톨로지 + 매핑으로 원천 RDB를 그래프처럼 질의, 데이터 복사 없음. R2RML은 W3C 매핑 표준, Ontop이 대표 구현. 상세: study/05_load_and_use.md",
      src: "Xiao et al. (IJCAI 2018) · W3C R2RML · Ontop 문서 · NVIDIA/auto-ontology",
    },
  });
})();
