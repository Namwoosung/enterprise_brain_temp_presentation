/* P29 · 최신 도구에서 가져올 힌트
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P29', steps: 3, section: '6 · 부록', ctxSub: '최신 기술', badge: '공개 자료 기준 · 2026-11',
    title: '최신 도구에서 가져올 힌트',
    takeaway: '도구를 통째로 쓰기보다, 각 도구가 해결한 한 가지를 우리 파이프라인 단계에 가져옵니다',
    src: '공개 문서: Auto Ontology · MS GraphRAG · Neo4j GraphRAG · Graphiti · graphify · Airflow 3',
    html() {
      const T = [
        ['NVIDIA Auto Ontology', 'RDB 메타데이터 · 쿼리 이력 → Generate → Certify(사람) → Answer(text-to-SQL) · Postgres + pgvector', '사람 인증 단계를 제품에 내장'],
        ['Microsoft GraphRAG', '청크 → 엔티티 · 관계 → Leiden 커뮤니티 → 요약 · 1.0의 graphrag update로 증분 반영', '전역 질문용 요약 계층 · 검증 게이트는 우리가'],
        ['Neo4j GraphRAG Python', 'SimpleKGPipeline · schema FREE / EXTRACTED / 사용자 정의 · 기본 ER(라벨 + 이름 병합)', '부품으로 쓰되 기본 ER은 끄기'],
        ['Graphiti (Zep)', '엣지마다 valid_at / invalid_at + created_at · 모순되면 지우지 않고 무효화', '이력을 보존하는 시간 모델'],
        ['graphify', 'Claude Code 스킬 · 코드(tree-sitter) · 문서(LLM)로 그래프 · 커밋 훅으로 재생성 + 리포트', '변경 시 자동 재생성 + 사람이 읽는 리포트'],
        ['Apache Airflow 3', 'Asset · 외부 이벤트 트리거(Watcher) · DAG 버전 관리', '수집 → 적재 오케스트레이션']];
      let s = '';
      T.forEach((x, i) => {
        s += card(134 + (i % 3) * 556, 240 + Math.floor(i / 3) * 272, 540, 254, 'gray', `<h4 class="s24">${x[0]}</h4><p class="s17" style="margin-top:6px">${x[1]}</p><div class="s19 b" style="margin-top:10px">→ ${mk(x[2], 'mint', 'data-c="on@2-3"')}</div>`, 'data-v="1" data-nf', 'panel');
      });
      const rail = [['수집', 'Airflow 3'], ['정제', 'Splink · 규칙'], ['추출', 'Neo4j GraphRAG Python'], ['검증', 'Auto Ontology Certify'], ['적재', 'Graphiti 유효기간'], ['평가 · 운영', 'graphify 리포트 · GraphRAG update']];
      rail.forEach((r, i) => { s += card(134 + i * 278, 800, 262, 152, 'mint', `<div class="s22 b">${r[0]}</div><div class="s16 c-mint" style="margin-top:6px">${r[1]}</div>`, 'data-v="3"'); });
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "도구마다 한 가지 힌트를 뽑아 우리 단계에 배치.",
      script: [
        "최근 도구 여섯 개를 봤습니다. NVIDIA Auto Ontology는 RDB에서 온톨로지를 만들고 사람이 인증해야 쓰게 합니다. Microsoft GraphRAG는 커뮤니티 요약 계층과 증분 갱신이 있고, Neo4j GraphRAG Python은 스키마 모드와 기본 ER이 있습니다.",
        "Graphiti는 사실마다 유효 기간을 두고 지우지 않고 무효화합니다. graphify는 변경될 때마다 그래프를 다시 만들고 사람이 읽는 리포트를 남깁니다. Airflow 3는 이벤트 기반 오케스트레이션입니다.",
        "(→) 이 도구들을 통째로 들여오기보다, 각 도구가 잘 푼 한 가지씩을 우리 단계에 가져다 씁니다.",
        "(→) 수집은 Airflow, 추출은 Neo4j 라이브러리 부품, 검증은 Auto Ontology의 인증 단계, 적재는 Graphiti의 유효 기간, 운영은 graphify의 리포트 방식과 GraphRAG의 증분 갱신.",
      ],
      discuss: "",
      concept: "Auto Ontology는 비정형 문서 수집이 공개 문서에 없다. graphify는 저장소·포크가 여러 개라 인용 저장소를 하나로 정할 것.",
      src: "각 도구 공개 문서 (2026-11 기준)",
    },
  });
})();
