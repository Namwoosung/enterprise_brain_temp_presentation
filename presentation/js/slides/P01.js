/* P01 · 앞에서는 "무엇인가"를, 이제는 "어떻게 만드나"를 봅니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P01', steps: 4, section: '0 · 도입', badge: '발표 흐름',
    title: '앞에서는 "무엇인가"를, 이제는 "어떻게 만드나"를 봅니다',
    takeaway: '그래프 개념은 발표 1에서 끝났다고 보고, 여기서는 만들 때 결정해야 할 것에 집중합니다',
    src: '발표 구성 · 자체 설계',
    html() {
      const xs = [134, 553, 972, 1391];
      const talks = [['발표 1', 'KG · Graph DB 개념'], ['발표 2', '구축: 수집 → 평가'], ['발표 3', '조회 · Agent 활용'], ['발표 4', '벤치마크']];
      let s = '';
      talks.forEach((k, i) => {
        const me = i === 1;
        s += card(xs[i], 236, 395, 96, me ? 'mint' : '', `<h5>${k[0]}${me ? tag('지금') : ''}</h5><h4>${k[1]}</h4>`, '', me ? 'fill-mint' : 'faded');
      });
      const st = [['01', '수집', '흩어진 자료 모으기', 'green'], ['02', '정제', '같은 것은 같게', 'purple'], ['03', '추출', '문서에서 후보 뽑기', 'blue'],
        ['04', '검증', '맞는 것만 통과', 'orange'], ['05', '적재', '저장소별로 반영', 'mint'], ['06', '평가', '좋아졌는지 재기', 'gray']];
      let ln = '';
      st.forEach((x, i) => {
        const cx = 134 + 131 + i * 278;
        ln += path(`M750,334 C750,362 ${cx},352 ${cx},388`, x[3] === 'gray' ? 'sub' : x[3], { draw: true, w: 2, a: 'data-v="2"' });
        s += card(134 + i * 278, 392, 262, 118, x[3], `<div class="mono s16 c-${x[3] === 'gray' ? 'sub' : x[3]}">${x[0]}</div><div class="s30 b">${x[1]}</div><div class="s17 sub">${x[2]}</div>`, 'data-v="2"');
      });
      s += svg(ln);
      s += card(134, 548, 1652, 190, 'gray', `<h5>이번 발표의 질문</h5><div class="big40" style="margin-top:10px">우리 회사 자료로 <span class="c-mint">믿을 수 있는</span> 그래프를 어떻게 만들고,<br>자료가 바뀌어도 <span class="c-mint">계속 맞게</span> 유지할까?</div>`, 'data-v="3"', 'panel');
      s += card(134, 772, 900, 186, 'mint', `<h5>오늘 데모</h5><div class="s24 b">반도체 설비 회의록 · 메일 · 작업기록</div><p class="s19 c-fg" style="margin-top:6px">→ 정제 · 추출 · 검증 → Neo4j 적재 → 반영 전후 차이 확인</p><p class="s17">교육용 더미 데이터 · 실제 온톨로지/그래프 DB에서 실행</p>`, 'data-v="4"', 'fill-mint');
      s += card(1064, 772, 722, 186, 'gray', `<h5>이번 발표에서 다루지 않는 것</h5>${ul(['그래프·KG 기본 개념 → 발표 1', '질의 방법(Text2Cypher, GraphRAG 검색) → 발표 3', '답변 품질 측정 → 발표 4'], 's18 sub')}`, 'data-v="4"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "발표 2의 위치와 질문을 정한다. 개념 설명은 하지 않는다.",
      script: [
        "앞 발표에서 지식그래프와 Graph DB가 무엇인지 봤습니다. 저는 그걸 우리 회사 자료로 실제로 만드는 과정을 맡았습니다.",
        "(→) 과정은 여섯 단계로 나눠 봅니다. 수집, 정제, 추출, 검증, 적재, 그리고 평가입니다.",
        "(→) 오늘 계속 붙들고 갈 질문은 이겁니다. 우리 회사 자료로 믿을 수 있는 그래프를 어떻게 만들고, 자료가 바뀌어도 계속 맞게 유지할 것인가.",
        "(→) 중간에 반도체 설비 회의록과 메일, 작업기록 더미 데이터를 실제 Neo4j에 넣어 보면서 반영 전후 차이를 보여드리겠습니다. 질의 방법과 답변 품질 측정은 3번, 4번 발표에서 다룹니다.",
      ],
      discuss: "",
      concept: "평가를 여섯 번째 단계로 넣은 이유: 평가 지표가 없으면 온톨로지를 바꿀 근거도, 바꾼 뒤 나빠졌는지도 알 수 없다.",
      src: "자체 구성",
    },
  });
})();
