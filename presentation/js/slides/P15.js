/* P15 · 정제 ① 잡음을 걷어내고 형식을 맞춥니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P15', steps: 4, section: '4 · 정제', ctxSub: '02 정제', badge: '데모 메일',
    title: '정제 ① 잡음을 걷어내고 형식을 맞춥니다',
    takeaway: '메일 회신의 인용 본문을 그대로 두면 같은 사실이 회신 수만큼 추출됩니다',
    src: '파싱 도구 키워드: Docling · Unstructured · Apache Tika',
    html() {
      const L = [
        ['<span class="sub mono s16">From: 김OO · Subject: RE: RE: EQ-017 압력 이상</span>', ''],
        ['3/6 오후에 <b>P/T V-42</b> 교체 완료했습니다. 압력은 정상 범위로 돌아왔습니다.', ''],
        ['-----Original Message-----', 'x'],
        ['&gt; 원인은 PT-V42 열화로 추정되며, 교체 후 재확인 예정', 'x'],
        ['&gt; 3/4 회의 결과 공유드립니다', 'x'],
        ['김OO 책임 | 설비기술팀 | 내선 0000', 'x'],
        ['본 메일은 사내 기밀 정보를 포함하고 있으며…', 'x']];
      let inner = '<h5>메일 원문 · MAIL-T311@v1</h5>';
      L.forEach(([txt, x]) => { inner += `<div class="s19" style="margin:12px 0" ${x ? 'data-c="strike-on@2-4"' : ''}>${txt}</div>`; });
      let s = card(134, 240, 780, 520, 'green', inner, 'data-v="1"');
      s += card(950, 240, 836, 184, 'purple', `<h5>중복 · 잡음 제거</h5>${ul(['인용 본문 제거 → 스레드 단위로 다시 묶기', '서명 · 법적 고지문 제거', '사본은 지우지 않고 대표 문서 + 사본 링크로'], 's18')}`, 'data-v="2"');
      s += tbl(950, 450, 836, ['원문', '정규화', '근거'], [
        ['3/6 오후', '<span class="mono">2026-03-06</span>', '문서 작성일 기준 해석'],
        ['P/T V-42', '<span class="mono">PT-V42</span>', '용어 사전 altLabel'],
        ['PM', '예방정비', '설비 맥락에서만'],
        ['500 mTorr', '<span class="mono">0.5 Torr</span>', '기준 단위 + 원래 값 보존']], { a: 'data-v="3"', cls: 'mid', widths: ['24%', '30%', '46%'] });
      s += card(134, 790, 1652, 162, 'orange', `<div class="row" style="align-items:flex-start;gap:40px">
        <div style="flex:1.2"><h5>파싱에서 지킬 것</h5><p class="s19 c-fg">표 구조 · 페이지/문단 위치 · 첨부 — 근거 위치를 가리키려면 위치 정보가 살아 있어야 한다</p></div>
        <div style="flex:1"><h5>함께 고민할 점</h5><p class="s19 c-fg">용어 사전은 누가 소유하고, 누가 고치나?</p></div></div>`, 'data-v="4"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "인용 본문·서명 제거, 정규화, 파싱 위치 보존.",
      script: [
        "실제 메일은 이렇게 생겼습니다. 새 내용은 첫 두 줄이고 나머지는 이전 메일 인용, 서명, 고지문입니다.",
        "(→) 인용 본문을 그대로 두면 같은 사실이 회신 수만큼 추출됩니다. 인용을 걷어내고 스레드 단위로 다시 묶고, 사본은 지우지 않고 대표 문서와 사본 링크로 남깁니다.",
        "(→) 형식도 맞춥니다. '3/6 오후'는 문서 작성일 기준으로 날짜를 정하고, P/T V-42는 용어 사전으로 PT-V42로, PM은 설비 맥락에서만 예방정비로, 단위는 기준 단위로 바꾸되 원래 값을 보존합니다.",
        "(→) 파싱에서는 표 구조와 페이지, 문단 위치를 반드시 살려야 합니다. 나중에 근거 위치를 가리켜야 하니까요.",
      ],
      discuss: "용어 사전은 누가 소유하고 누가 고치나?",
      concept: "SKOS: prefLabel(표준어) · altLabel(동의어) · hiddenLabel(오타·변형) · broader/narrower. 용어 사전 YAML 구조의 참고.",
      src: "Docling · Unstructured · Apache Tika",
    },
  });
})();
