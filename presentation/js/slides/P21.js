/* P21 · 검증 ② 원문과 공식 시스템에 맞는지 봅니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P21', steps: 4, section: '4 · 검증', ctxSub: '04 검증', badge: '데모 · 가상 사례',
    title: '검증 ② 원문과 공식 시스템에 맞는지 봅니다',
    takeaway: '형식이 맞아도 원문이 그 말을 하지 않으면 떨어지고, 공식 기록과 다르면 보류합니다',
    src: 'Marchesin et al., VLDB 2026 (LLM 정확도 추정 편차) · 사례는 자체 설계',
    html() {
      const band = (y, no, title, left, right, stamp, a) =>
        card(134, y, 1166, 196, 'gray', `<div class="row"><span class="num gray">${no}</span><h4 style="margin:0">${title}</h4><span style="margin-left:auto" class="stamp ${stamp[0]}">${stamp[1]}</span></div>
          <div class="row" style="align-items:flex-start;gap:20px;margin-top:12px"><div style="flex:1">${left}</div><div class="s26 sub" style="padding-top:18px">↔</div><div style="flex:1">${right}</div></div>`, a, 'panel');
      let s = '';
      s += band(240, '1', '인용문이 원문에 있나 · 문자열 대조',
        `<h5>후보 mail F01</h5><div class="s18">"3/6 오후에 P/T V-42 교체 완료"</div>`,
        `<h5>원문 MAIL-T311@v1 #1</h5><div class="s18">"3/6 오후에 ${mk('P/T V-42 교체 완료', 'mint', 'data-c="on@1-4"')}했습니다"</div>`, ['ok', '통과'], 'data-v="1"');
      s += band(456, '2', '원문이 후보를 뒷받침하나 · 함의 판정',
        `<h5>후보 (흔한 오류 예)</h5><div class="s18 mono">CONFIRMED_CAUSE (PT-V42 열화)</div>`,
        `<h5>원문 DOC-M201@v1 [00:00:33]</h5><div class="s18">"…PT-V42 열화로 ${mk('추정', 'red', 'data-c="on@2-4"')}하고 있습니다"</div>`, ['rej', '반려 → SUSPECTED로'], 'data-v="2"');
      s += band(672, '3', '공식 시스템과 맞나 · 기준 시스템 대조',
        `<h5>메일 · mail F01</h5><div class="s18">교체 완료 <b>3/6</b></div>`,
        `<h5>CMMS · completed_at</h5><div class="s18 mono">2026-03-${mk('07', 'red', 'data-c="on@3-4"')} 10:20</div>`, ['hold', '보류 · 불일치 기록'], 'data-v="3"');
      s += t(134, 878, 1166, '속성마다 기준 시스템을 정해 둔다 (완료 시각 = CMMS) · 자동으로 덮어쓰지 않고 불일치를 남긴다 → DB 입력 누락이 발견되기도 함', 's17 sub', 'data-v="3"');
      s += card(1336, 240, 450, 712, 'blue', `<h5>LLM을 검증자로 쓸 때</h5>
        <div class="s20 b c-mint" style="margin-top:8px">쓸모</div>${ul(['대량 1차 필터', '원문 ↔ 후보 함의 판정', '반려 사유 설명'], 's18')}
        <div class="s20 b c-red" style="margin-top:12px">한계</div>${ul(['같은 모델은 같은 오류를 공유하기 쉬움', '프롬프트 · 순서에 민감', 'LLM만으로 KG 정확도를 추정하면 실제와 최대 45% 차이 보고 (VLDB 2026)'], 's18')}
        <div class="card fill-mint tone-mint" style="margin-top:14px;padding:10px 12px"><div class="s18 b">LLM 통과 = 사람이 덜 봐도 되는 후보<br><span class="c-mint">확정이 아님</span></div></div>
        <p class="s17" style="margin-top:12px"><b class="c-orange">함께 고민할 점</b> · 문서와 DB가 다르면 항상 DB가 맞나?</p>`, 'data-v="4"');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "인용문 존재 → 함의 → 기준 시스템 대조. LLM 검증자의 쓸모와 한계.",
      script: [
        "첫 번째, 후보가 인용한 문장이 원문에 실제로 있는지 문자열로 대조합니다. 데모 메일의 '3/6 오후에 P/T V-42 교체 완료'는 통과입니다.",
        "(→) 두 번째, 원문이 그 후보를 실제로 뒷받침하는지 봅니다. 원문은 '추정'인데 후보는 확정 원인이면 함의가 성립하지 않으니 반려하고 SUSPECTED로 돌립니다.",
        "(→) 세 번째, 공식 시스템과 비교합니다. 데모에서 메일은 3월 6일 완료라고 하는데 CMMS 완료 시각은 3월 7일 10시 20분입니다. 속성마다 기준 시스템을 정해 두되, 자동으로 덮어쓰지 않고 불일치를 남겨 보류합니다. 이 과정에서 DB 입력 누락이 발견되기도 합니다.",
        "(→) LLM을 검증자로 쓰는 건 1차 필터로 유용합니다. 하지만 같은 모델은 같은 오류를 공유하기 쉽고, LLM 판정만으로 KG 정확도를 추정하면 실제와 최대 45%까지 차이 났다는 보고도 있습니다. LLM 통과는 사람이 덜 봐도 되는 후보라는 뜻이지 확정이 아닙니다.",
      ],
      discuss: "문서와 DB가 다르면 항상 DB가 맞나?",
      concept: "함의(entailment) 판정: NLI 모델이나 LLM으로 '원문 문장이 후보 트리플을 함의하는가'를 본다.",
      src: "Marchesin et al., VLDB 2026",
    },
  });
})();
