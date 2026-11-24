/* 새 슬라이드 템플릿. 사용법:
   1) 이 파일을 복사해 js/slides/<새 id>.js로 저장합니다(예: P11a.js). 파일 이름 = id.
   2) 아래 id를 파일 이름과 똑같이 바꿉니다.
   3) js/deck.js의 ORDER에서 원하는 위치에 id를 넣습니다.
   4) python tools/check_deck.py 로 검사합니다.
   좌표는 1920x1080 화면 기준(px)입니다. 본문 영역은 대략 x 134~1786, y 230~960입니다.
   ※ 이 파일(_TEMPLATE)은 ORDER에 넣지 않으므로 화면에 나오지 않습니다. */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'NEW_ID',               // ← 파일 이름과 같게
    steps: 3,                   // ← 이 슬라이드의 스텝 수(→ 키를 몇 번 눌러 다 보이는지). 아래 data-v 최대값과 같게
    section: '0 · 섹션 이름',     // 아래쪽 가운데 표시
    ctxSub: '',                 // 위쪽 왼쪽 문구 뒤에 붙는 말(없으면 '')
    badge: '설계 예시',           // 위쪽 오른쪽 배지
    title: '슬라이드 제목은 한 문장으로 씁니다',
    takeaway: '핵심 한 줄',
    src: '출처 · 자체 설계',      // 아래쪽 출처
    html() {
      let s = '';
      // data-v="1"  : 스텝 1부터 보임 / data-v="2" : 스텝 2부터 / data-v="2-3" : 스텝 2~3에서만 보임
      s += card(134, 240, 800, 300, 'mint', `<h5>작은 제목</h5><h4>카드 제목</h4>${ul(['항목 1', '항목 2'])}`, 'data-v="1"');
      s += card(986, 240, 800, 300, 'blue', `<h5>두 번째 카드</h5><p class="s20">스텝 2에서 나타납니다</p>`, 'data-v="2"');
      s += card(134, 580, 1652, 120, 'gray', `<div class="s24 center">스텝 3에서 나타나는 결론</div>`, 'data-v="3"', 'panel');
      return s;
    },
    /* 발표자 노트. script는 문단 배열입니다.
       스텝 2부터는 그 스텝의 첫 문단을 '(→) '로 시작합니다. '(→)' 문단 수 = steps - 1 */
    notes: {
      convey: '이 장에서 전달할 한 가지.',
      script: [
        '스텝 1에서 할 말.',
        '(→) 스텝 2에서 할 말.',
        '(→) 스텝 3에서 할 말.',
      ],
      discuss: '',
      concept: '',
      src: '자체 구성',
    },
  });
})();
