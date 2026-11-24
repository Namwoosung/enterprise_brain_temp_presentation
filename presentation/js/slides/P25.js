/* P25 · 전체 파이프라인을 자동화합니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P25', steps: 4, section: '5 · 운영', ctxSub: '운영', badge: '설계 예시',
    title: '전체 파이프라인을 자동화합니다',
    takeaway: '사람 검토는 파이프라인을 막지 않게 옆으로 빼고, 승인되면 다음 배치에서 반영합니다',
    src: 'Apache Airflow 3.0 (Asset · Watcher · DAG 버전) · 자체 설계',
    html() {
      const R1 = ['수집 (소스별)', '파싱 · 정제', 'ER', '추출', '스키마 검사'], R2 = ['원문 · 원천 대조', 'staging 적재', '그래프 검사', 'publish', '평가 리포트'];
      const X = i => 134 + i * 340;
      let s = '', ln = '';
      R1.forEach((n, i) => { s += cb(X(i), 250, 290, 84, n, 'center t-purple', 'data-v="1" data-nf'); if (i < 4) ln += path(`M${X(i) + 292},292 H${X(i + 1) - 4}`, 'purple', { draw: true, a: 'data-v="1" data-nf' }); });
      ln += path(`M${X(4) + 145},336 V376 H${X(0) + 145} V406`, 'purple', { draw: true, a: 'data-v="1" data-nf' });
      R2.forEach((n, i) => { s += cb(X(i), 410, 290, 84, n, `center ${i === 3 ? 't-mint' : 't-purple'}`, 'data-v="1" data-nf'); if (i < 4) ln += path(`M${X(i) + 292},452 H${X(i + 1) - 4}`, i === 2 ? 'mint' : 'purple', { draw: true, a: 'data-v="1" data-nf' }); });
      s += cb(X(0) + 70, 584, 420, 84, '🕒 사람 검토 큐 · 비동기', 'center t-orange', 'data-v="2"');
      ln += path(`M${X(0) + 145},496 V580`, 'orange', { draw: true, a: 'data-v="2"' });
      ln += path(`M${X(0) + 492},626 H${X(3) + 145} V498`, 'orange', { dash: true, a: 'data-v="2"' });
      s += t(X(1) + 160, 636, 560, '승인되면 다음 publish에 반영', 's17 c-orange', 'data-v="2"');
      s += cb(X(4), 584, 290, 84, '<div><div>격리 (dead-letter)</div><div class="s15 sub">모든 단계의 실패 문서</div></div>', 'center t-red', 'data-v="3"');
      s += svg(ln);
      s += card(134, 716, 800, 236, 'red', `<h5>실패해도 멈추지 않게</h5>${ul(['단계별 재시도 · 파싱 실패 문서는 격리 후 계속', '같은 입력 재실행 = 같은 결과 (멱등)', '실패 사유를 모아 파서 · 프롬프트 개선 우선순위로'], 's19')}`, 'data-v="3"');
      s += card(970, 716, 816, 236, 'green', `<h5>트리거와 기록</h5>${ul(['새 데이터가 생기면 실행 — Airflow 3 Asset · 외부 이벤트(Watcher)', '온톨로지 버전이 바뀌면 영향받는 원본만 재처리', '실행마다 원본 · 온톨로지 · 모델 · 프롬프트 버전 기록', 'Airflow 3: 실행은 시작 시점 DAG 버전으로 끝까지'], 's18')}`, 'data-v="4"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "DAG, 비동기 사람 큐, 실패 격리, 이벤트 트리거와 버전 기록.",
      script: [
        "전체 흐름을 DAG로 묶으면 이렇습니다. 수집부터 스키마 검사, 원문과 원천 대조, staging, 그래프 검사, publish, 평가 리포트까지.",
        "(→) 사람 검토는 이 흐름을 막으면 안 됩니다. 옆으로 빼서 비동기로 돌리고, 승인되면 다음 publish에 반영합니다.",
        "(→) 실패해도 멈추지 않게, 단계별로 재시도하고 실패한 문서는 격리한 뒤 계속 갑니다. 같은 입력을 다시 돌리면 같은 결과가 나와야 하고, 실패 사유는 모아서 개선 우선순위로 씁니다.",
        "(→) 트리거는 새 데이터가 생겼을 때입니다. Airflow 3에서는 Asset과 외부 이벤트 Watcher로 이걸 할 수 있고, 실행은 시작 시점의 DAG 버전으로 끝까지 갑니다. 그리고 실행마다 원본, 온톨로지, 모델, 프롬프트 버전을 기록합니다.",
      ],
      discuss: "",
      concept: "Airflow 3(2025-04): Dataset→Asset, @asset, Asset Watcher 기반 외부 이벤트 스케줄링(AIP-82), DAG 버전 관리. 대안 키워드: Dagster(자산 중심), Prefect. 계보: OpenLineage.",
      src: "Apache Airflow 3.0 공식 블로그",
    },
  });
})();
