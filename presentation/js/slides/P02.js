/* P02 · 온톨로지를 쓰려면 먼저 흩어진 자료를 한곳에 모아야 합니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P02', steps: 4, section: '0 · 도입', badge: '개념도',
    title: '온톨로지를 쓰려면 먼저 흩어진 자료를 한곳에 모아야 합니다',
    takeaway: '온톨로지는 틀이고, 그 틀에 채울 내용은 흩어진 자료에서 옵니다',
    src: '자체 설계 개념도',
    html() {
      const src = [['메일', '스레드 · 첨부', 'green'], ['회의록', '주간 설비회의', 'green'], ['사내 위키 · 게시판', '절차 · 공지', 'green'],
        ['MES / CMMS', '작업 · 설비 이력', 'green'], ['공유폴더 · 엑셀', '담당자별 양식', 'green'], ['개인 PC', '로컬에만 있는 파일', 'orange']];
      let s = '', ln = '';
      src.forEach((x, i) => {
        const y = 240 + i * 106;
        s += card(134, y, 320, 92, x[2], `<div class="s22 b">${x[0]}</div><div class="s16 sub">${x[1]}</div>`, 'data-v="1"', i === 5 ? 'dashed' : '');
        ln += path(`M456,${y + 46} C540,${y + 46} 540,551 612,551`, i === 5 ? 'orange' : 'green', { draw: true, w: 2, dash: i === 5, a: 'data-v="2"' });
      });
      s += card(620, 390, 400, 322, 'green', `<h5>수집 · 저장</h5><h4 class="s28">원본 보관소</h4>${ul(['받은 그대로 보관 (수정 금지)', '버전 · 내용 해시', '출처 · 작성 시각 · 권한', '나중에 다시 처리할 수 있게'], 's19')}`, 'data-v="2"');
      ln += path('M1022,551 C1080,551 1080,700 1132,700', 'mint', { draw: true, w: 3, a: 'data-v="3"' });
      ln += path('M1460,494 V530', 'sub', { dash: true, a: 'data-v="3"' });
      s += card(1140, 240, 646, 252, 'purple', `<h5>온톨로지 = 틀 · 사람이 정의</h5>
        <div style="margin-top:8px">${['Equipment', 'PartType', 'MaintenanceWork', 'Document', 'Person'].map(x => chip(x, 'prog')).join('')}</div>
        <div style="margin-top:10px">${['ON_EQUIPMENT', 'USED_PART_TYPE', 'EVIDENCED_BY'].map(x => chip(x, 'gray sm')).join('')}</div>
        <p class="s17" style="margin-top:10px">어떤 종류의 것이 있고, 서로 어떻게 연결될 수 있는가</p>`, 'data-v="3"');
      s += t(1474, 500, 300, '틀에 맞춰 채운다', 's16 sub', 'data-v="3"');
      s += card(1140, 534, 646, 330, 'mint', `<h5>지식그래프 = 내용 · 자료에서 채움</h5>`, 'data-v="3"', 'panel');
      let g = path('M1360,660 L1520,660', 'gray', { w: 2 }) + path('M1440,790 L1330,692', 'gray', { w: 2 }) + path('M1490,790 L1590,692', 'gray', { w: 2 });
      s += `<div data-v="3" data-nf>${svg(g)}</div>`;
      s += node(1270, 660, 200, 60, 'FAB-A/EQ-017', '', '', 'data-v="3" data-nf', 's18');
      s += node(1630, 660, 200, 60, 'PT-V42', '', '', 'data-v="3" data-nf', 's18');
      s += node(1460, 816, 200, 60, 'WO-1042', '', 'new', 'data-v="3" data-nf', 's18');
      s += pill(1440, 640, 'USED_IN', '', 'data-v="3" data-nf');
      s += card(134, 896, 1652, 66, 'mint', `<div class="s24 center">자료를 모으는 단계부터 설계해야 틀(온톨로지)에 <b class="c-mint">믿을 수 있는 내용</b>을 채울 수 있습니다</div>`, 'data-v="4"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "온톨로지(틀)와 지식그래프(내용)를 구분하고, 내용은 흩어진 자료에서 온다는 점을 보인다.",
      script: [
        "우리 회사의 업무 판단에 쓰이는 자료는 메일, 회의록, 위키, MES나 CMMS 같은 시스템, 담당자 엑셀, 그리고 개인 PC에 흩어져 있습니다.",
        "(→) 이걸 먼저 원본 보관소에 모읍니다. 받은 그대로 보관하고, 버전과 출처, 권한을 같이 남깁니다.",
        "(→) 온톨로지는 어떤 종류의 것이 있고 서로 어떻게 연결될 수 있는지를 정한 틀입니다. 지식그래프는 그 틀에 실제 사실을 채운 결과입니다.",
        "(→) 틀이 아무리 좋아도 채울 내용이 엉망이면 소용없습니다. 그래서 모으는 단계부터 설계해야 합니다.",
      ],
      discuss: "지금 각자 업무 판단에 쓰는 자료는 어디 어디에 있나요? 그중 시스템에 없는 것은?",
      concept: "TBox(용어·개념 정의 = 온톨로지)와 ABox(개별 사실 = 데이터). 온톨로지는 저장소와 독립이고, DB 스키마는 그 결과물 중 하나. MES = 생산 실행 기록(로트 · 공정 · 설비 상태), CMMS = 설비 정비 기록(작업지시 · PM · 교체 부품 · 완료 시각). 발표에서는 '공식 기록(원천 시스템)'의 예로 쓴다.",
      src: "자체 개념도",
    },
  });
})();
