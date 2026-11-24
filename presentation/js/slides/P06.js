/* P06 · 자료는 계속 바뀌고, 틀린 것도 섞여 있습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P06', steps: 5, section: '1 · 왜 어려운가', ctxSub: 'C 시간', badge: '교육용 가상 사례',
    title: '자료는 계속 바뀌고, 틀린 것도 섞여 있습니다',
    takeaway: '그래프의 사실에는 언제부터 언제까지 유효한지와 어느 문서 어느 버전에서 왔는지가 붙어야 합니다',
    src: '교육용 가상 사례 · 수치는 설명용',
    html() {
      const C = [284, 622, 960, 1298, 1636];
      const ev = [
        ['2월', '매뉴얼 v1', '"점검 기준 압력 0.8 Torr"', '기준값 0.8 Torr', 'green', 1, ''],
        ['3/4', '회의록 DOC-M201', '"원인은 PT-V42 열화로 추정"', `원인 추정 · PT-V42 열화 ${tag('추정', 'orange')}`, 'green', 1, ''],
        ['3/6', '메일 스레드', '"센서 교체 완료했습니다"', 'PT-V42 교체 완료', 'green', 2, ''],
        ['3/10', '매뉴얼 v2', '"기준 0.5 Torr로 정정 (v1 오기)"', `기준값 0.5 Torr ${tag('현재', 'mint')}`, 'green', 3, ''],
        ['3/12', '다른 회의록', '"0.8 Torr 넘으면 점검"', `v1 기준 재인용 ${tag('오래된 정보', 'red')}`, 'orange', 4, '']];
      let s = '', ln = path('M160,330 H1770', 'line', { w: 3 });
      ev.forEach((e, i) => {
        const x = C[i] - 150, a = `data-v="${e[5]}"`;
        ln += `<circle cx="${C[i]}" cy="330" r="9" fill="#5EEAD4" ${a}/>`;
        ln += path(`M${C[i]},512 V552`, 'sub', { a });
        s += t(x, 282, 300, `<span class="mono s20 b">${e[0]}</span>`, 'center', a);
        s += card(x, 356, 300, 154, e[4], `<h5>${e[1]}</h5><p class="s18 c-fg">${e[2]}</p>`, a);
        const extra = i === 0 ? 'data-c="strike-on@3-5"' : '';
        s += card(x, 556, 300, 150, i === 4 ? 'red' : (i === 3 ? 'mint' : 'gray'), `<h5>그래프의 사실</h5><div class="s19 b" ${extra}>${e[3]}</div>`, a, i === 3 ? 'fill-mint' : (i === 4 ? 'fill-red' : ''));
      });
      s += svg(ln);
      s += div(C[0] - 120, 666, null, null, 'chip hold sans', '유효 종료 3/10', 'data-v="3"');
      s += svg(path(`M${C[3] - 60},710 C${C[3] - 60},748 ${C[0]},748 ${C[0]},712`, 'orange', { dash: true, a: 'data-v="3"' }));
      s += card(134, 760, 1652, 196, 'gray', `<div class="row" style="gap:12px;flex-wrap:wrap">${chip('새 자료 계속 발생', 'gray lg sans')}${chip('기존 사실 변경', 'gray lg sans')}${chip('최신 · 과거 혼재', 'gray lg sans')}${chip('문서 자체 오류 · 재유통', 'gray lg sans')}</div>
        <div class="s26" style="margin-top:18px">→ 사실을 덮어쓰지 않고 <b class="c-mint">유효 기간</b>을 닫고, <b class="c-mint">출처 문서와 버전</b>을 남긴다</div>`, 'data-v="5"', 'panel');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "사실에는 유효 기간과 출처 버전이 붙어야 한다.",
      script: [
        "한 설비의 한 달을 따라가 보겠습니다. 2월 매뉴얼 v1에는 점검 기준이 0.8 Torr로 적혀 있었고, 3월 4일 회의록에는 원인이 PT-V42 열화로 '추정'된다고 나옵니다.",
        "(→) 3월 6일 메일로 센서 교체가 완료됐다는 회신이 옵니다. 새 사실입니다.",
        "(→) 3월 10일 매뉴얼 v2가 나오면서 v1의 기준값이 오기였다고 정정됩니다. 이때 v1 기반 사실을 지우는 게 아니라 유효 기간을 닫습니다.",
        "(→) 그런데 3월 12일 다른 회의록이 옛 기준 0.8 Torr를 그대로 인용합니다. 오래된 정보가 다시 돌아다니는 겁니다.",
        "(→) 그래서 사실을 덮어쓰지 않고, 언제부터 언제까지 유효한지와 어느 문서 어느 버전에서 왔는지를 남겨야 합니다.",
      ],
      discuss: "",
      concept: "유효 시간(valid time)과 기록 시간(transaction time)을 나누는 bi-temporal 모델 → 26장.",
      src: "교육용 가상 사례 · 수치는 설명용",
    },
  });
})();
