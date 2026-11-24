/* P26 · 버전 관리: 온톨로지는 Git으로, KG는 main / develop으로
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P26', steps: 5, section: '5 · 운영', ctxSub: '운영', badge: '설계 가이드 · 공개 문서',
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
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "KG = f(다섯 버전) → 재구축이 브랜치를 대신. CI 흐름, 변경 유형별 처리, Neo4j 현실.",
      script: [
        "그래프는 이 다섯 가지의 함수라고 볼 수 있습니다. 원본, 온톨로지, 파이프라인, 모델과 프롬프트 버전, 그리고 승인 기록. 이걸 고정하면 같은 그래프를 다시 만들 수 있습니다.",
        "(→) 그래서 서비스 중인 main KG와, 새 온톨로지나 프롬프트로 다시 만든 develop KG를 나눕니다. 지표를 비교해서 나아졌을 때만 승격합니다.",
        "(→) 온톨로지나 프롬프트 PR마다 CI가 돕니다. 호환성 검사, 생성물 빌드, 골든셋으로 develop 재구축, 지표와 diff 계산, PR에 리포트, 승인 후 태그와 점진 재처리.",
        "(→) 온톨로지가 바뀌어도 그래프를 버리지 않습니다. 추가는 필요한 원본만 재추출, 이름 변경은 마이그레이션, 분할은 재분류, 삭제는 무효화.",
        "(→) 현실적인 제약도 있습니다. Neo4j에는 데이터 브랜치가 없고 Community는 DB가 하나라 인스턴스를 나눠야 합니다. 네이티브 브랜치가 꼭 필요하면 TerminusDB 같은 git식 그래프 DB도 있습니다.",
      ],
      discuss: "온톨로지 변경 승인권자는 현업인가 데이터팀인가?",
      concept: "온톨로지 시맨틱 버전: PATCH(설명·동의어) / MINOR(추가, 하위 호환) / MAJOR(이름 변경·삭제·분할). Bi-temporal: valid time과 transaction time을 따로(Graphiti: valid_at/invalid_at + created_at).",
      src: "Neo4j Operations Manual · TerminusDB",
    },
  });
})();
