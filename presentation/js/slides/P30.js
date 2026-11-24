/* P30 · 목표 아키텍처: 그래프는 조회 계층, 기준은 파일과 Git
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P30', steps: 4, section: '7 · 정리', ctxSub: '정리', badge: '설계 예시',
    title: '목표 아키텍처: 그래프는 조회 계층, 기준은 파일과 Git',
    takeaway: '그래프 DB 하나로 시작하고(데모는 Neo4j), 기준은 파일 · Parquet · Git에 둬서 그래프를 언제든 다시 만듭니다',
    src: 'Neo4j GraphRAG Python (lexical graph) · DuckDB · Apache Parquet · 자체 설계',
    html() {
      const demo = `<span data-v="4">${chip('오늘 데모', 'hold sm sans')}</span>`;
      const W = 368, G = 60, X = i => 134 + i * (W + G);
      const C = [
        ['① 원본 보관', 'raw/ · 파일', ['받은 그대로 · 날짜별 · 체크섬', 'CSV · Excel · 로그 · 문서'], chip('기준', 'src sm sans'), true],
        ['② 정제본', 'staging/ · Parquet', ['DuckDB로 정제 (서버 없음)', '타입 고정 · 넓은 표 → 긴 표', '수집 기록 · 추출 후보'], chip('기준', 'src sm sans'), false],
        ['③ 정의 · 파이프라인', 'Git', ['온톨로지 · 매핑 규칙 · 프롬프트', '여기서 제약 · 추출 스키마 생성', '추출 → 검증 → 적재 코드'], chip('기준', 'src sm sans'), true],
        ['④ 조회', '그래프 DB (예: Neo4j)', ['승인된 사실 + 근거 링크', '문서 청크 + 벡터 인덱스', '멀티홉 · 경로 조회'], chip('사본 · 재구축 가능', 'gray sm sans'), true]];
      let s = '', g = '';
      C.forEach((c, i) => {
        s += card(X(i), 240, W, 290, i === 3 ? 'mint' : 'gray', `<h4>${c[0]}</h4><div class="mono s18 c-mint" style="margin-top:4px">${c[1]}</div>${ul(c[2], 's18')}<div class="row" style="margin-top:10px;gap:8px">${c[3]}${c[4] ? demo : ''}</div>`, 'data-v="1"', i === 3 ? 'fill-mint' : 'panel');
        if (i < 3) g += path(`M${X(i) + W + 6},385 H${X(i + 1) - 8}`, 'mint', { w: 3 });
      });
      s += `<div data-v="1" data-nf>${svg(g)}</div>`;
      s += tbl(134, 566, 1100, ['자료', '보관', '그래프에 올리는 것'], [
        ['CSV · Excel', '원본 → Parquet (긴 표)', '엔터티 · 관계 · 값은 요약과 링크'],
        ['로그', '원본 → Parquet 이벤트 표', '의미 있는 이벤트 · 집계 + 원문 위치'],
        { a: 'data-c="hl@4"', c: ['회의록 · 메일 · md', '원본 파일 그대로', 'Document → Chunk → 엔터티 + 근거'] },
        ['온톨로지', 'Git (버전 태그)', '라벨 · 관계 타입 · 제약으로 생성']], { a: 'data-v="2"', cls: 'xl', widths: ['22%', '33%', '45%'] });
      s += card(1270, 566, 516, 262, 'ghost', `<h5>필요해지면 붙일 것</h5>${ul(['여러 명이 검토 · 승인 기록 → <b>RDB</b>', '표준 어휘 연계 · 교환 → <b>RDF / OWL 내보내기</b>', 'main / develop → <b>그래프 DB 인스턴스 분리</b>'], 's18')}<p class="s17 c-fg" style="margin-top:10px">처음부터 다 세우지 않고, 막히는 지점이 생길 때 하나씩</p>`, 'data-v="3"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "오늘 본 단계를 한 장으로 묶기. 기준(파일·Parquet·Git)과 사본(그래프 DB)을 나누고, 자료별 경로와 나중에 붙일 것, 오늘 데모 범위를 보여 준다.",
      script: [
        "지금까지 본 단계를 한 장으로 묶어 보겠습니다. 원본은 받은 그대로 파일로 보관하고, 정제본은 Parquet로 남겨 DuckDB로 다룹니다. 온톨로지와 매핑 규칙, 프롬프트, 파이프라인 코드는 Git에 둡니다. 그래프 DB는 이 셋으로 언제든 다시 만들 수 있는 조회 계층입니다. 운영할 서버는 그래프 DB 하나입니다. 오늘은 그래프를 눈으로 보기 좋아서 Neo4j를 썼지만, 여기까지의 방법은 어떤 그래프 DB를 고르든 같습니다.",
        "(→) 자료마다 그래프에 올리는 것이 다릅니다. 넓은 Excel 표는 긴 표로 바꾼 뒤 엔터티와 관계만 올리고 값은 요약과 링크로 둡니다. 로그도 원문 대신 의미 있는 이벤트만 올립니다. 문서는 Document, Chunk, 엔터티로 이어 근거를 남깁니다. 온톨로지는 Git에서 라벨과 제약으로 생성합니다.",
        "(→) 처음부터 다 세우지는 않습니다. 여러 사람이 검토 기록을 동시에 쓰게 되면 RDB를, 표준 어휘와 연계해야 하면 RDF 내보내기를, main과 develop을 나눠 운영하면 인스턴스 분리를 붙입니다.",
        "(→) 오늘 데모는 이 중 문서 원본, 임시 온톨로지와 추출, Neo4j 조회 부분이었습니다. 정형 표와 로그 경로는 같은 구조에 붙이면 됩니다.",
      ],
      discuss: "우리 자료 중 가장 먼저 이 구조에 올릴 것은 문서인가, 정형 표인가? RDB가 필요해지는 시점은 언제일까?",
      concept: "KG는 원본·정의·파이프라인 버전의 함수로 재구축 가능한 파생물(P26). 문서 쪽은 neo4j-graphrag의 lexical graph(Document–Chunk–Entity) 패턴. DuckDB는 내장형이라 다중 동시 쓰기에 약함 — 승인 워크플로가 커지면 트랜잭션 저장소가 필요.",
      src: "Neo4j GraphRAG Python 문서 · DuckDB 문서 · Apache Parquet",
    },
  });
})();
