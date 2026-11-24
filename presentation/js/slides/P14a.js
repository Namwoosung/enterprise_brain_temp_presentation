/* P14a · 수집 정리 · 할 일과 방법 선택
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P14a', steps: 3, section: '4 · 수집', ctxSub: '01 수집', badge: '설계 가이드',
    title: "수집 정리 · 할 일과 방법 선택",
    takeaway: "처음엔 export 파일 · 증분 수집 · 업로드 창구로 시작하고, 변경이 잦은 핵심 DB만 나중에 CDC로 바꿉니다",
    src: "Debezium 문서 · Kleppmann, Designing Data-Intensive Applications (2017) 11장 · 자체 설계",
    html() {
      let s = '';
      /* 스텝 1: 이 단계에서 개발자가 할 일 */
      s += card(134, 236, 520, 590, 'purple', `<h5>수집 · 개발자가 할 일</h5><ol class="todo s20"><li><b>소스 목록 만들기</b><span>어떤 시스템 · 폴더에 무엇이 있고, 주인은 누구이고, 접근 권한은 어떻게 받는지</span></li><li><b>소스마다 변경 감지 방식 정하기</b><span>전체 덤프 · 증분 · CDC · 이벤트 중 하나</span></li><li><b>원본 보관소와 수집 기록 만들기</b><span>원본은 그대로 · 출처 id · 버전 · 해시 · 작성/수집 시각 · 권한</span></li><li><b>다시 받아도 같은 결과</b><span>원본 id + 버전(또는 해시)을 키로, 같은 파일은 건너뜀</span></li><li><b>삭제 · 정정 반영 규칙</b><span>원천에서 지워지면 그래프에서는 무효화</span></li><li><b>스케줄 · 재시도 · 실패 격리</b><span>소스별 작업 흐름(DAG)으로 묶기</span></li></ol>`, 'data-v="1" data-nf');
      /* 스텝 2: 흔히 쓰는 방법 비교 · 스텝 3: 우리 선택 강조 */
      const rows = [
        { a: '', c: [`전체 덤프 (주기적으로 통째로)`, `가장 단순 · 삭제도 자연히 반영`, `크면 느리고 무거움`, `작은 마스터 · 코드표`] },
        { a: 'data-c="pick@3"', c: [`증분 폴링 (updated_at · 파일 시각) ${chip('우리 선택', 'ok sans')}`, `구현 쉬움 · 대부분 지원`, `삭제를 못 봄 · 시각 누락 위험`, `업무 DB export · 공유폴더`] },
        { a: '', c: [`CDC (DB 변경 로그 읽기)`, `거의 실시간 · 삭제까지 정확`, `DB 권한 · 운영 부담 큼`, `변경이 많은 핵심 DB`] },
        { a: '', c: [`이벤트 · 웹훅 · API 구독`, `바로 반응`, `소스가 지원해야 · 유실 대비 필요`, `메일 · 위키 · 메신저`] },
        { a: 'data-c="pick@3"', c: [`사람 업로드 창구 ${chip('우리 선택', 'ok sans')}`, `시스템 밖 자료도 받음`, `누락 · 형식이 제각각`, `개인 PC · 담당자 엑셀`] },
      ];
      s += card(690, 236, 1096, 590, 'gray', `<h5>흔히 쓰는 방법</h5>`, 'data-v="2"', 'panel');
      s += tbl(706, 278, 1064, ["수집 방식", "장점", "단점", "맞는 경우"], rows, { a: 'data-v="2"', cls: 'lg', widths: ['27%', '23%', '25%', '25%'] });
      /* 스텝 3: 우리 상황에서의 선택 */
      s += card(134, 846, 1652, 106, 'mint', `<div class="s22 b c-mint">우리 상황에서는</div><p class="s19 c-fg" style="margin-top:4px">원천 DB를 건드리지 않는 export 파일 + 증분 폴링, 문서는 API · 업로드 창구로 시작 → 원본과 해시를 남기니 나중에 방식을 바꿔도 다시 처리할 수 있음</p>`, 'data-v="3"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "수집 단계에서 개발자가 할 일, 흔한 방법들의 장단점, 우리 상황의 선택을 한 장으로 정리한다.",
      script: [
        "수집 단계를 정리하면, 개발자가 할 일은 이 여섯 가지입니다. 먼저 소스 목록과 주인, 권한을 조사하고, 소스마다 변경을 어떻게 알아챌지 정합니다. 원본 보관소와 수집 기록을 만들고, 같은 것이 두 번 와도 결과가 같게, 삭제와 정정을 어떻게 반영할지, 그리고 스케줄과 재시도까지.",
        "(→) 변경을 알아채는 방법은 다섯 가지가 흔합니다. 통째로 다시 받는 덤프는 단순하지만 무겁고, 증분 폴링은 쉽지만 삭제를 못 보고, CDC는 정확하지만 DB 권한과 운영 부담이 큽니다. 메일이나 위키는 이벤트나 API로, 개인 자료는 업로드 창구로 받습니다.",
        "(→) 우리 상황에서는 원천 DB를 건드리지 않는 export 파일과 증분 폴링, 그리고 업로드 창구로 시작하는 게 현실적입니다. 원본과 해시를 남겨 두면 나중에 CDC로 바꿔도 다시 처리할 수 있습니다.",
      ],
      discuss: "",
      concept: "CDC 대표 도구: Debezium(Kafka Connect 기반). 폴링의 '삭제를 못 본다'는 soft delete 컬럼이나 주기적 전체 대조로 보완한다.",
      src: "Debezium 문서 · Kleppmann, Designing Data-Intensive Applications (2017) 11장 · 자체 설계",
    },
  });
})();
