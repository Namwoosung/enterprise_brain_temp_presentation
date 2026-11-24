/* v3 · P26 – P31 : 버전 관리 · 질문 큐 · 방법론 · 최신 도구 · 목표 아키텍처 · 정리 */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box } = H;
  const CTX = '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>';

  /* ------------------------------------------------------------ P26 */
  DECK.register({
    id: 'P26', steps: 5, section: '5 · 운영', ctx: CTX + ' · 운영', badge: '설계 가이드 · 공개 문서',
    title: '버전 관리: 온톨로지는 Git으로, KG는 main / develop으로',
    takeaway: '다섯 가지 버전을 고정하면 같은 KG를 다시 만들 수 있고, 그게 그래프 브랜치를 대신합니다',
    src: 'Neo4j Operations Manual (Community는 표준 DB 1개) · TerminusDB · 자체 설계',
    html() {
      let s = card(134, 240, 1652, 112, 'mint', `<div class="row" style="flex-wrap:wrap;gap:10px"><span class="s30 b mono">KG = f(</span>${chip('원본 버전', 'src lg sans')}${chip('온톨로지 버전', 'prog lg sans')}${chip('파이프라인 버전', 'prog lg sans')}${chip('모델 · 프롬프트 버전', 'llm lg sans')}${chip('승인 기록', 'hold lg sans')}<span class="s30 b mono">)</span></div>`, 'data-v="1"', 'fill-mint');
      // git lanes
      let g = path('M180,450 H900', 'mint', { w: 4, arrow: false }) + path('M180,580 H900', 'blue', { w: 4, arrow: false, dash: true });
      g += path('M300,450 C340,450 340,580 380,580', 'blue', { w: 2.5 });
      g += path('M760,580 C800,580 800,450 840,450', 'mint', { w: 3, draw: true, a: 'data-v="2"' });
      [[240, 450, '#5EEAD4'], [560, 450, '#5EEAD4'], [840, 450, '#5EEAD4'], [420, 580, '#60A5FA'], [580, 580, '#60A5FA'], [740, 580, '#60A5FA']].forEach(([x, y, c]) => { g += `<circle cx="${x}" cy="${y}" r="11" fill="${c}"/>`; });
      s += `<div data-v="2" data-nf>${svg(g)}</div>`;
      s += t(180, 396, 700, '<b class="c-mint">main KG</b> <span class="sub">· 서비스 중 · kg-schema@1.0.0</span>', 's20', 'data-v="2" data-nf');
      s += t(180, 606, 740, '<b class="c-blue">develop KG</b> <span class="sub">· 새 온톨로지 · 새 프롬프트로 재구축</span>', 's20', 'data-v="2" data-nf');
      s += pill(800, 512, '지표 비교 후 승격', 'new', 'data-v="2"');
      s += card(970, 382, 816, 296, 'purple', `<h5>CI · 온톨로지 / 프롬프트 PR마다</h5><ol class="ul s18" style="padding-left:24px">
        <li>문법 · 참조 · 하위 호환 검사 (MAJOR 변경 감지)</li><li>생성물 빌드: JSON 스키마 · Pydantic · 제약</li><li><b>골든셋 재처리</b>로 develop KG 재구축</li>
        <li>CQ 통과율 · 표본 정확도 · 노드/관계 diff</li><li>diff 리포트를 PR에 → 리뷰 승인 → 태그</li><li>main에 영향 범위만 점진 재처리</li></ol>`, 'data-v="3"');
      s += tbl(134, 712, 800, ['온톨로지 변경', '그래프 처리'], [
        ['추가 (MINOR)', '새 타입이 필요한 원본만 재추출'], ['이름 변경', '마이그레이션 스크립트 · 재추출 불필요'],
        ['분할', '기존 인스턴스 재분류 — 규칙 또는 재추출 + 검토'], ['삭제', '인스턴스 무효화 · 깨지는 CQ 확인']], { a: 'data-v="4"', cls: 'tight', widths: ['28%', '72%'] });
      s += card(970, 712, 816, 240, 'orange', `<h5>Neo4j에서 현실적으로</h5>${ul(['데이터 브랜치 기능이 없다', 'Community는 표준 DB 1개 → main / develop은 인스턴스 분리', '또는 "원본 + 버전"으로 언제든 재구축', '네이티브 branch · merge가 필요하면 TerminusDB 같은 git식 그래프 DB'], 's18')}
        <p class="s17 c-fg" style="margin-top:8px"><b class="c-orange">함께 고민할 점</b> · 온톨로지 변경 승인권자는 현업? 데이터팀?</p>`, 'data-v="5"', 'fill-orange');
      return s;
    }
  });

  /* ------------------------------------------------------------ P27 */
  DECK.register({
    id: 'P27', steps: 5, section: '5 · 운영', ctx: CTX + ' · 운영', badge: '설계 예시',
    title: '모르는 것은 사람에게 묻습니다: 질문 큐',
    takeaway: '사람의 답변도 누가 · 언제 · 어떤 조건에서 말했는지와 함께 근거로 저장합니다',
    src: 'Nonaka SECI 모델 (표출화) · 자체 설계',
    html() {
      let s = card(134, 240, 480, 560, 'gray', `<h5>질문이 생기는 때</h5>${ul(['메타데이터 부족 ("지난번처럼")', '출처끼리 충돌', 'ER이 애매함', '온톨로지에 없는 개념이 반복', '암묵지에 기대는 판단', '개인 PC에 있을 것 같은 자료'], 's19')}`, 'data-v="1"');
      s += card(650, 240, 600, 420, 'orange', `<h5>질문 레코드</h5><div class="kv s17" style="margin-top:6px">
        <div><span class="k">id</span> <span class="v">Q-0312-07</span></div>
        <div><span class="k">question</span> <span class="v">"지난번처럼"은 어느 작업인가요?</span></div>
        <div><span class="k">linked</span> <span class="v">C05 · DOC-M201@v1 p.3</span></div>
        <div><span class="k">why</span> <span class="v">CQ-07 이전 조치 이력</span></div>
        <div><span class="k">ask_to</span> <span class="v">회의 주관자 (설비기술팀)</span></div>
        <div><span class="k">expires</span> <span class="v">2026-03-26</span></div>
        <div><span class="k">status</span> <span class="v c-orange" data-t="2:open|4:answered">open</span></div></div>`, 'data-v="2"');
      const P = [['① 담당자 답변', '주간 묶음 · 선택형 · 원문 하이라이트와 함께'], ['② 이후 자료로 자동 해소', '새 문서 · DB 변경이 질문에 답하면 연결하고 닫음'], ['③ 만료', '보류 유지 · 재질문 또는 폐기']];
      P.forEach((p, i) => { s += card(1286, 240 + i * 190, 500, 170, i === 0 ? 'mint' : 'gray', `<h4>${p[0]}</h4><p>${p[1]}</p>`, 'data-v="3"'); });
      s += card(650, 690, 600, 262, 'mint', `<h5>답변 → 근거로 저장</h5>
        <div class="row" style="margin-top:6px">${chip('? 어느 작업', 'gray sans')}<span class="s22 sub">→</span>${chip('WO-0988', 'ok')}</div>
        <div class="quote s17" style="margin-top:10px">"WO-0988 때처럼 센서 교체 후 24시간 모니터링" — 설비기술팀 김OO, 3/14</div>
        <p class="s17 c-fg" style="margin-top:8px">사람 출처 근거 → 같은 검증을 거쳐 적재 · 암묵지가 형식지가 되는 경로</p>`, 'data-v="4"', 'fill-mint');
      s += card(134, 830, 480, 122, 'gray', `<h5>부담 줄이기</h5><p class="s17 c-fg">한 번에 묶어서 · 예/아니오로 · 답이 어디에 쓰였는지 알려주기</p>`, 'data-v="5"', 'panel');
      s += card(1286, 830, 500, 122, 'orange', `<h5>함께 고민할 점</h5><p class="s18 c-fg">질문받는 사람이 귀찮지 않으려면?</p>`, 'data-v="5"', 'fill-orange');
      return s;
    }
  });

  /* ------------------------------------------------------------ P28 */
  DECK.register({
    id: 'P28', steps: 5, section: '6 · 부록', ctx: CTX + ' · 질문 대비', badge: '공개 방법론 정리',
    title: '온톨로지 구축 방법론: 무엇을 섞어 쓸까',
    takeaway: '하나만 고르기보다 업무 질문으로 골격을 잡고, 데이터와 LLM으로 채우고, 사람이 인증합니다',
    src: 'Noy & McGuinness (2001) · METHONTOLOGY · NeOn · LOT · Ontology Design Patterns · ISA-95(IEC 62264)',
    html() {
      const R = [
        ['Top-down (CQ · 전문가)', '업무 질문 → 필요한 개념 · 관계 정의', '목적이 분명 · 작게 시작', '현업 시간 필요 · 놓치는 개념', '핵심 골격'],
        ['Bottom-up (데이터 · 스키마)', '기존 DB · 문서에서 개념 도출', '실제 데이터와 맞음', '시스템 구조를 그대로 복제', '정형 소스 매핑'],
        ['LLM 보조', 'LLM이 개념 · 관계 초안, 사람이 확정', '빠른 초안 · 동의어 발굴', '그럴듯한 과잉 개념 · 실행마다 다름', '확장 후보 제안'],
        ['표준 재사용', '업계 표준 모델 차용 (제조: ISA-95 등)', '외부 연계 · 검증된 구조', '너무 넓음 · 우리 용어와 거리', '상위 개념 참고 · 검토 후보'],
        ['<span class="c-mint">하이브리드</span>', 'CQ 골격 + 데이터 매핑 + LLM 확장 + 사람 인증', '현실적', '운영 절차가 필요', '<b class="c-mint">권장</b>']];
      let s = tbl(134, 240, 1652, ['접근', '방법', '장점', '단점', '우리 적용'], R.map((r, i) => ({ a: `data-v="${i + 1}"`, c: r })), { cls: 'xl', widths: ['19%', '27%', '17%', '21%', '16%'] });
      s += card(134, 830, 1652, 122, 'gray', `<h5>고전 방법론 키워드</h5><div class="row" style="flex-wrap:wrap;gap:8px">${['Ontology Development 101', 'METHONTOLOGY', 'NeOn (재사용 시나리오)', 'LOT (애자일 · 산업)', 'Ontology Design Patterns', 'BFO · IOF Core (상위 온톨로지)'].map(x => chip(x, 'gray sans')).join('')}</div>`, 'data-v="1" data-nf', 'panel');
      return s;
    }
  });

  /* ------------------------------------------------------------ P29 */
  DECK.register({
    id: 'P29', steps: 3, section: '6 · 부록', ctx: CTX + ' · 최신 기술', badge: '공개 자료 기준 · 2026-11',
    title: '최신 도구에서 가져올 힌트',
    takeaway: '도구를 통째로 쓰기보다, 각 도구가 해결한 한 가지를 우리 파이프라인 단계에 가져옵니다',
    src: 'NVIDIA Auto Ontology · MS GraphRAG 1.0 · Neo4j GraphRAG Python · Graphiti · graphify · Airflow 3 공개 문서',
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
    }
  });

  /* ------------------------------------------------------------ P30 */
  DECK.register({
    id: 'P30', steps: 4, section: '7 · 정리', ctx: CTX + ' · 정리', badge: '설계 예시',
    title: '목표 아키텍처: 그래프는 조회 계층, 기준은 파일과 Git',
    takeaway: '서버는 Neo4j 하나로 시작하고, 기준은 파일 · Parquet · Git에 둬서 그래프를 언제든 다시 만듭니다',
    src: 'Neo4j GraphRAG Python (lexical graph) · DuckDB · Apache Parquet · 자체 설계',
    html() {
      const demo = `<span data-v="4">${chip('오늘 데모', 'hold sm sans')}</span>`;
      const W = 368, G = 60, X = i => 134 + i * (W + G);
      const C = [
        ['① 원본 보관', 'raw/ · 파일', ['받은 그대로 · 날짜별 · 체크섬', 'CSV · Excel · 로그 · 문서'], chip('기준', 'src sm sans'), true],
        ['② 정제본', 'staging/ · Parquet', ['DuckDB로 정제 (서버 없음)', '타입 고정 · 넓은 표 → 긴 표', '수집 기록 · 추출 후보'], chip('기준', 'src sm sans'), false],
        ['③ 정의 · 파이프라인', 'Git', ['온톨로지 · 매핑 규칙 · 프롬프트', '여기서 제약 · 추출 스키마 생성', '추출 → 검증 → 적재 코드'], chip('기준', 'src sm sans'), true],
        ['④ 조회', 'Neo4j', ['승인된 사실 + 근거 링크', '문서 청크 + 벡터 인덱스', '멀티홉 · 경로 조회'], chip('사본 · 재구축 가능', 'gray sm sans'), true]];
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
      s += card(1270, 566, 516, 262, 'ghost', `<h5>필요해지면 붙일 것</h5>${ul(['여러 명이 검토 · 승인 기록 → <b>RDB</b>', '표준 어휘 연계 · 교환 → <b>RDF / OWL 내보내기</b>', 'main / develop → <b>Neo4j 인스턴스 분리</b>'], 's18')}<p class="s17 c-fg" style="margin-top:10px">처음부터 다 세우지 않고, 막히는 지점이 생길 때 하나씩</p>`, 'data-v="3"');
      return s;
    }
  });

  /* ------------------------------------------------------------ P31 */
  DECK.register({
    id: 'P31', steps: 3, section: '7 · 정리', ctx: CTX, badge: '정리',
    title: '정리와 함께 정할 것',
    takeaway: '고칠 수 있게 남기고, 확정은 기준으로 하고, 숫자로 개선합니다',
    src: '발표 2 정리',
    html() {
      const S = [['01', '원본과 근거를 남겨야 고칠 수 있다', '원본 불변 · 수집 기록 · 근거 위치 · 유효 기간'], ['02', 'LLM은 후보를 만들고, 확정은 규칙 · 원천 · 사람이 한다', '스키마 · 원문 대조 · 위험도 × 확신도'], ['03', '평가 지표가 있어야 온톨로지를 바꿀 수 있다', 'CQ · 표본 정확도 · 골든셋 회귀 · main / develop']];
      let s = '';
      S.forEach((x, i) => { s += card(134 + i * 556, 240, 540, 270, 'mint', `<div class="mono s20 c-mint">${x[0]}</div><div class="s28 b" style="margin-top:6px">${x[1]}</div><p class="s18" style="margin-top:12px">${x[2]}</p>`, 'data-v="1"'); });
      const D = ['용어 사전의 소유자', '사람 승인 기준과 하루 처리량', 'CQ 목록을 누가 · 어떻게 모을지', '온톨로지 변경 승인권자', '개인 PC 자료를 받는 방식'];
      s += card(134, 540, 1100, 412, 'orange', `<h5>팀이 정해야 할 것</h5><div class="s24 lh" style="margin-top:10px">${D.map(d => `<div style="margin:12px 0">${box()}${d}</div>`).join('')}</div>`, 'data-v="2"');
      s += card(1270, 540, 516, 412, 'gray', `<h5>다음 발표</h5><div class="big34" style="margin-top:10px">발표 3<br>조회 · Agent 활용</div><p class="s19 c-fg" style="margin-top:18px">오늘 남긴 근거 · 시점 · 승인 상태를 조회에서 어떻게 쓰는지 이어서 봅니다</p>`, 'data-v="3"', 'panel');
      return s;
    }
  });
})();
