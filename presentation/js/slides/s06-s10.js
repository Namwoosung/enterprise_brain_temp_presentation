/* v3 · P06 – P10 : 왜 어려운가(계속) · 파이프라인 개요 */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl } = H;
  const CTX = '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>';

  /* ------------------------------------------------------------ P06 */
  DECK.register({
    id: 'P06', steps: 5, section: '1 · 왜 어려운가', ctx: CTX + ' · C 시간', badge: '교육용 가상 사례',
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
    }
  });

  /* ------------------------------------------------------------ P07 */
  DECK.register({
    id: 'P07', steps: 4, section: '1 · 왜 어려운가', ctx: CTX + ' · D 사람', badge: '교육용 가상 사례',
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
    }
  });

  /* ------------------------------------------------------------ P08 */
  DECK.register({
    id: 'P08', steps: 5, section: '1 · 왜 어려운가', ctx: CTX, badge: '자체 설계',
    title: '어려움마다 막는 단계가 다릅니다',
    takeaway: '그래서 "LLM에 넣고 끝"이 아니라 수집 · 정제 · 추출 · 검증 · 적재 · 평가를 나눠 설계합니다',
    src: '자체 설계 · 각 칸은 이후 장에서 상세',
    html() {
      const head = ['', '수집', '정제', '추출', '검증', '적재', '평가'];
      const R = [
        ['<span class="c-blue">A 모델 한계</span>', '—', '용어 사전', '스키마 · 사전 · 예시 주입', '원문 대조', '—', 'CQ로 확인'],
        ['<span class="c-green">B 자료 상태</span>', '원본 + 메타 보존', 'ER · 표준화 · 중복 제거', '문서 구조 기반 청킹', '원천 DB 대조', '단일 ID · 근거 연결', '소스별 반영률'],
        ['<span class="c-orange">C 시간</span>', '증분 · 버전', '최신본 표시', '시점 필드', '모순 검사', '유효 기간 · 이력', '반영 지연'],
        ['<span class="c-purple">D 사람</span>', '업로드 창구', '—', '불확실성 보존', '승인 기준', '사람 출처 근거', '질문 큐 해소율']];
      const rows = R.map((r, i) => ({ a: `data-v="${i + 1}"`, c: r }));
      let s = tbl(134, 246, 1652, head, rows, { cls: 'xl', widths: ['16%', '14%', '14%', '14%', '14%', '14%', '14%'] });
      s += card(134, 730, 1652, 190, 'mint', `<div class="s30 b" style="margin-top:8px">한 번의 LLM 호출로는 이 칸들을 채울 수 없습니다</div>
        <p class="s20 c-fg" style="margin-top:10px">→ 단계별로 <b>누가(사람 · 프로그램 · LLM)</b> 무엇을 맡을지 정하는 것이 구축 설계의 핵심</p>`, 'data-v="5"', 'fill-mint');
      return s;
    }
  });

  /* ------------------------------------------------------------ P09 */
  DECK.register({
    id: 'P09', steps: 6, section: '2 · 파이프라인', ctx: CTX, badge: '개요',
    title: '수집 → 정제 → 추출 → 검증 → 적재 → 평가',
    takeaway: '각 단계를 10초씩 먼저 보고, 13장부터 하나씩 자세히 봅니다',
    src: '자체 설계 · 저장 형태는 23장, 평가는 24장',
    html() {
      const st = [
        ['01', '수집', 'green', '메일 · 회의록 · 위키 · MES/CMMS에서 커넥터로', ['원본은 바꾸지 않고 보관', '버전 · 해시 · 권한 기록', '배치 · 이벤트 · CDC']],
        ['02', '정제', 'purple', '같은 것은 같게, 다른 것은 다르게', ['중복 · 인용 본문 제거', '명칭 · 단위 · 날짜 표준화', 'entity resolution']],
        ['03', '추출', 'blue', '정형은 규칙, 문서는 LLM', ['스키마에 맞춘 후보', '근거 위치(문서 · 페이지 · 문장)', '확실성(추정 · 확정)']],
        ['04', '검증', 'orange', '형식 → 원문 → 원천 → 사람', ['스키마 검사 (프로그램)', '원문 · 공식 DB 대조', '위험한 것만 사람 승인']],
        ['05', '적재', 'mint', '저장소마다 역할이 다르다', ['정의: YAML (Git)', '원장: RDB', '조회: 속성 그래프 · 필요 시 RDF']],
        ['06', '평가', 'sub', '좋아졌는지 숫자로', ['CQ 통과율', '표본 정확도', '최신성 · 반영률']]];
      let s = card(134, 238, 1652, 62, 'purple', `<div class="s20"><b class="c-purple">기준</b> · 온톨로지 · 용어 사전 · 검증 규칙 — 사람이 정하고 Git으로 관리</div>`, 'data-v="1" data-nf', 'panel');
      st.forEach((x, i) => {
        s += card(134 + i * 278, 330, 262, 440, x[2] === 'sub' ? 'gray' : x[2], `<div class="mono s18 c-${x[2]}">${x[0]}</div><div class="s34 b">${x[1]}</div><p class="s17 c-fg" style="margin:8px 0 12px">${x[3]}</p>${ul(x[4], 's17')}`, `data-v="${i + 1}"`);
      });
      s += svg(path('M1655,772 V826 H118 V270 H128', 'mint', { draw: true, w: 3, a: 'data-v="6"' }));
      s += pill(960, 826, '평가 결과 → 온톨로지 · 규칙 · 프롬프트 개선', 'new', 'data-v="6"');
      s += t(134, 870, 1652, '사람 승인과 평가가 막히면 그래프는 늦어지고, 없으면 틀린다 — 둘 다 설계 대상입니다', 's22 center sub', 'data-v="6"');
      return s;
    }
  });

  /* ------------------------------------------------------------ P10 */
  DECK.register({
    id: 'P10', steps: 4, section: '2 · 파이프라인', ctx: CTX, badge: '자체 설계',
    title: '각 단계를 누가 하나: 사람 · 프로그램 · LLM',
    takeaway: 'LLM 열에는 "확정"이 없습니다 — 확정은 규칙 · 원천 시스템 · 사람이 합니다',
    src: '자체 설계 · ● 주도 ○ 보조',
    html() {
      const v = n => `data-v="${n}"`;
      const head = ['단계', ['<span class="c-purple">사람</span>', v(1)], ['<span class="c-purple">프로그램</span>', v(2)], ['<span class="c-blue">LLM</span>', v(3)]];
      const R = [
        ['온톨로지', '● 개념 · 관계 결정', '● 스키마 · 제약 생성', '○ 확장 후보 제안'],
        ['수집', '○ 개인 자료 업로드 · 소스 지정', '● 커넥터 · 스케줄 · 해시', '—'],
        ['정제', '● 용어 사전 소유', '● 형식 정리 · 중복 · ER 규칙', '○ 동의어 · 애매한 쌍 설명'],
        ['추출', '○ 예시 · 반례 제공', '● 정형 매핑', '● 문서에서 후보 추출'],
        ['검증', '● 고위험 · 애매 승인', '● 스키마 · 원천 대조', '○ 원문 함의 1차 판정'],
        ['적재', '—', '● staging → publish', '—'],
        ['평가', '● CQ 작성 · 표본 판정', '● 지표 계산 · 회귀 테스트', '○ 표본 층 나누기 신호']];
      const rows = R.map(r => [r[0], [r[1], v(1)], [r[2], v(2)], [r[3], v(3)]]);
      let s = tbl(134, 240, 1652, head, rows, { cls: 'lg', widths: ['12%', '29%', '30%', '29%'] });
      s += card(134, 770, 900, 182, 'mint', `<h5>원칙</h5><div class="s26 b" style="margin-top:6px">LLM은 후보를 만들고, 확정은 하지 않는다</div><p class="s19 c-fg" style="margin-top:8px">규칙으로 되는 것은 규칙으로 — 비용 · 재현성 · 검증 부담이 다르다</p>`, 'data-v="4"', 'fill-mint');
      s += card(1064, 770, 722, 182, 'orange', `<h5>함께 고민할 점</h5><div class="s24 b" style="margin-top:6px">LLM이 두 번 확인한 결과는 사람 없이 올려도 될까?</div><p class="s17" style="margin-top:6px">→ 21 · 22장에서 기준을 봅니다</p>`, 'data-v="4"', 'fill-orange');
      return s;
    }
  });
})();
