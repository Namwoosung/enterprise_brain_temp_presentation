/* P11 · 오늘 데모: 반도체 회의록 · 메일을 그래프에 넣어 봅니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P11', steps: 4, section: '2 · 파이프라인', ctxSub: '데모 범위', badge: '데모 실제 결과',
    title: '오늘 데모: 반도체 회의록 · 메일을 그래프에 넣어 봅니다',
    takeaway: '기준 상태를 먼저 고정하고, 새 자료 3건이 그래프를 얼마나 바꿔야 맞는지 끝까지 따라갑니다',
    src: '데모 저장소 demo/ · 가상 팹(FAB-A · FAB-B) · CMMS export · 메일 · 회의록 STT는 더미 · LLM gpt-4.1 녹화본',
    html() {
      let s = H.G.panel(134, 236, { h: 560, nodeA: 'data-v="1" data-nf', oldEdgeA: 'data-v="1" data-nf', slot: 'data-v="3-3"', newNode: 'data-v="4"', newEdges: 'data-v="4"' });
      s += t(134, 812, 796, `<span class="mono s24">노드 <b data-t="1:4|4:5">4</b> · 관계 <b data-t="1:2|4:4">2</b></span> <span class="s17 sub" data-t="1:EQ-017 주변 · 기준 상태 run 0|4:반영 후 · 전체 그래프 41 · 91 → 73 · 155">EQ-017 주변 · 기준 상태 run 0</span>`, 'center');
      const src = [['CMMS-WO@v1', 'CMMS 증분 export · WO-1042 · 중복 행 · EQ-071', 'purple'], ['DOC-M201@v1', '주간 설비회의 STT · "추정" · "지난번처럼"', 'blue'],
        ['MAIL-T311@v1', '메일 스레드 · 교체 완료 회신 (3/6)', 'blue'], ['기준 KG · run 0', '마스터 + CMMS 이력 · 알람 로그 · SOP · DOC-P088']];
      src.forEach((x, i) => { s += card(970 + (i % 2) * 416, 236 + Math.floor(i / 2) * 132, 400, 118, 'green', `<div class="mono s20 b">${x[0]}</div><div class="s16 sub">${x[1]}</div>`, 'data-v="2"'); });
      s += card(970, 510, 816, 190, 'blue', `<h5>처리 흐름</h5>
        <div class="row" style="flex-wrap:wrap;margin-top:6px">${['cmms 9', 'mail 3', 'stt 6'].map(c => chip(c, 'cand')).join('')}<span class="s22 sub">→</span>${chip('승인 7', 'ok sans')}${chip('기각 1', 'rej sans')}${chip('보류 10', 'hold sans')}</div>
        <p class="s18 c-fg" style="margin-top:10px">후보 18 → 승인 7 · 기각 1 · 보류 10 <span class="sub">· 그 밖에 온톨로지 후보 2 · 질문 1</span></p>`, 'data-v="3"');
      s += card(970, 724, 816, 228, 'mint', `<h5>데모 결과 · 반영 전후 차이 (EQ-017 주변)</h5><div class="s56 b c-mint mono" style="line-height:1.1">노드 +1 · 관계 +2</div>
        <p class="s18 c-fg" style="margin-top:8px">반영되지 않은 후보도 "왜 안 들어갔는지" 기록으로 남는다</p>`, 'data-v="4"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "기준 상태 → 새 자료 4건 → 후보와 판정 → 기대 diff.",
      script: [
        "데모의 기준 상태입니다. 가상 팹 두 곳의 설비 마스터와 CMMS 이력, 알람 로그, SOP, 회의자료로 만든 그래프이고 전체는 노드 41개, 관계 91개입니다. 그중 EQ-017 주변만 보면, FAB-A와 FAB-B에 같은 코드의 EQ-017이 있고, 부품 유형 PT-V42, 기존 작업 WO-1041이 있습니다. 노드 4개, 관계 2개입니다.",
        "(→) 여기에 새 자료 3건이 들어옵니다. CMMS 증분 export, '추정'과 '지난번처럼'이 있는 주간 설비회의 STT, 교체 완료를 알리는 회신 메일입니다. 적용 조건이 적힌 회의자료 DOC-P088은 이미 기준 그래프에 들어 있습니다.",
        "(→) 세 자료에서 후보 18개가 나왔습니다. CMMS는 규칙으로 9개, 메일과 회의록은 LLM으로 9개입니다. 검증을 거쳐 승인 7개, 기각 1개, 보류 10개가 됐고, 온톨로지에 없는 개념 2개와 질문 1개가 따로 남았습니다. LLM 결과는 실제 gpt-4.1 호출을 녹화한 것을 재생합니다.",
        "(→) 결과는 EQ-017 주변에서 노드 하나, 관계 두 개 증가입니다. CMMS의 WO-1042가 들어오고 설비와 부품에 연결됩니다. 메일의 '3/6 교체 완료'는 CMMS 완료 시각 3/7과 달라 덮어쓰지 않고 보류로 남습니다. 반영되지 않은 후보는 왜 안 들어갔는지가 검토 항목으로 남습니다.",
      ],
      discuss: "",
      concept: "",
      src: "데모 저장소 demo/ · 가상 데이터 · LLM gpt-4.1 녹화본",
    },
  });
})();
