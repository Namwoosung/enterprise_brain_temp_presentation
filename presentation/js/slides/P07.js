/* P07 · 정답 판단 기준이 문서가 아니라 사람에게 있습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P07', steps: 4, section: '1 · 왜 어려운가', ctxSub: 'D 사람', badge: '교육용 가상 사례',
    title: '정답 판단 기준이 문서가 아니라 사람에게 있습니다',
    takeaway: '문서만으로 판단이 안 되는 빈칸은 억지로 채우지 말고, 물어볼 곳을 남겨 둡니다',
    src: 'Polanyi(암묵지) · Nonaka SECI 모델 · 사례는 교육용 가상',
    html() {
      let s = '';
      s += card(134, 240, 800, 222, 'purple', `<h5>숙련자 · 설비기술팀</h5>${q('"재시작 직후 10분 안에 뜨는 압력 알람은 무시해도 돼요."')}
        <p class="s18" style="margin-top:12px">어디에도 적혀 있지 않음 · <b class="c-fg">조건(재시작 직후, 10분)</b>이 빠지면 다른 상황에 잘못 쓰인다</p>`, 'data-v="1"');
      s += card(134, 490, 800, 222, 'green', `<h5>회의록 DOC-M201@v1 · p.3</h5>${q(`"${mk('그 건', '', 'data-c="on@2-4"')}은 ${mk('지난번처럼', '', 'data-c="on@2-4"')} 처리하기로 함."`)}
        <p class="s18" style="margin-top:12px">이 문서만으로는 무엇을, 어느 때를 가리키는지 알 수 없다</p>`, 'data-v="2"');
      s += node(1170, 600, 250, 80, '? 어느 작업', '연결 대상 미상', 'ghost', 'data-v="2"');
      s += node(1590, 600, 250, 80, '? 어느 조치', '"지난번"이 언제인지', 'ghost', 'data-v="2"');
      s += svg(path('M936,580 C990,580 1000,600 1040,600', 'sub', { dash: true, a: 'data-v="2"' }) + path('M936,620 C1200,700 1400,690 1462,628', 'sub', { dash: true, a: 'data-v="2"' }));
      const cand = [['같은 회의 시리즈', '이전 회의록 #11, #10'], ['같은 기간 메일', 'EQ-017 관련 스레드'], ['참석자의 작업 이력', 'CMMS 최근 작업지시']];
      cand.forEach((c, i) => { s += card(974 + i * 276, 252, 260, 120, 'gray', `<div class="s19 b">${c[0]}</div><div class="s16 sub">${c[1]}</div>`, 'data-v="3"', 'dashed'); });
      s += svg([1104, 1380, 1656].map((x, i) => path(`M${x},374 C${x},460 ${i < 2 ? 1170 : 1590},470 ${i < 2 ? 1170 : 1590},556`, 'sub', { dot: true, w: 2.5, a: 'data-v="3"' })).join(''));
      s += t(974, 668, 812, '어디를 볼지도 자료 안에 없다 → 단서는 <b class="c-fg">수집 메타(시리즈 · 참석자 · 날짜)</b>', 's18 sub', 'data-v="3"');
      s += card(134, 744, 1652, 210, 'orange', `<h5>함께 고민할 점</h5><div class="s30 b" style="margin-top:6px">이런 빈칸을 누가, 언제 채우게 할까?</div>
        <p class="s20 c-fg" style="margin-top:10px">억지로 연결하지 않고 <b class="c-orange">질문 큐</b>로 보낸다 → 27장에서 이어서</p>`, 'data-v="4"', 'fill-orange');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "암묵지와 문서 밖 맥락은 억지로 채우지 말고 질문으로 남긴다.",
      script: [
        "숙련자는 '재시작 직후 10분 안에 뜨는 압력 알람은 무시해도 된다'고 압니다. 이건 어디에도 적혀 있지 않고, 조건이 빠지면 다른 상황에 잘못 쓰입니다.",
        "(→) 회의록에는 '그 건은 지난번처럼 처리하기로 함' 같은 문장이 흔합니다. 이 문서만으로는 무엇을, 언제를 가리키는지 알 수 없습니다.",
        "(→) 더 어려운 건 어디를 더 봐야 하는지도 문서 안에 없다는 겁니다. 같은 회의 시리즈의 이전 회의록, 같은 기간 메일, 참석자의 작업 이력이 단서가 될 수 있는데, 그러려면 수집할 때 시리즈와 참석자 같은 메타를 남겨 둬야 합니다.",
        "(→) 그래도 안 풀리면 억지로 연결하지 않고 질문 큐로 보냅니다. 27장에서 이어서 보겠습니다.",
      ],
      discuss: "이런 빈칸을 누가, 언제 채우게 할까?",
      concept: "Polanyi: 사람은 말할 수 있는 것보다 더 많이 안다. Nonaka SECI의 표출화(Externalization) = 암묵지를 말·문서로 꺼내는 단계.",
      src: "Polanyi · Nonaka SECI · 사례는 교육용 가상",
    },
  });
})();
