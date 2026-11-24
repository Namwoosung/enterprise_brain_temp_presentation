/* P18 · 추출 ② "추정"을 "확정"으로 바꾸지 않습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P18', steps: 5, section: '4 · 추출', ctxSub: '03 추출', badge: '데모 회의록 STT',
    title: '추출 ② "추정"을 "확정"으로 바꾸지 않습니다',
    takeaway: '확실성 · 시점 · 근거 위치를 후보의 필드로 남겨야 조회 결과가 원문보다 단정적이지 않습니다',
    src: '사실성(factuality) · 헤지(hedging) 연구 주제 · 예시는 자체 설계',
    html() {
      let s = card(134, 240, 1652, 108, 'green', `<h5>원문 · DOC-M201@v1 [00:00:33] · 정제 후</h5><div class="s24">"원인은 PT-V42 열화로 ${mk('추정', 'red', 'data-c="on@1-5"')}하고 있습니다 교체하고 나서 ${mk('다시 확인', 'red', 'data-c="on@1-5"')}하겠습니다"</div>`, 'data-v="1"');
      s += card(134, 376, 600, 262, 'red', `<h5>잘못된 추출</h5><div class="mono s20" style="margin-top:8px">(EQ-017)-[<b class="c-red">CAUSED_BY</b>]-&gt;(PT-V42 열화)</div><div class="mono s20" style="margin-top:4px">certainty: <b class="c-red">"확정"</b></div>
        <p class="s18 c-fg" style="margin-top:14px">"추정"이 사라짐 → 나중에 조회하면 <b>확정된 원인</b>으로 답한다</p>`, 'data-v="2"', 'fill-red');
      s += card(770, 376, 1016, 262, 'mint', `<h5>후보로 남길 모양</h5><pre class="code s16" style="margin-top:4px">{ <span class="k">"relation"</span>: <span class="m">"SUSPECTED_CAUSE"</span>, <span class="k">"status"</span>: <span class="p">"candidate"</span>,
  <span class="k">"subject"</span>: <span class="s">"FAB-A/EQ-017"</span>, <span class="k">"object"</span>: <span class="s">"PT-V42 열화"</span>,
  <span class="k">"certainty"</span>: <span class="m">"suspected"</span>, <span class="k">"polarity"</span>: <span class="s">"positive"</span>,
  <span class="k">"asserted_at"</span>: <span class="s">"2026-03-04"</span>, <span class="k">"asserted_by"</span>: <span class="s">"주간 설비회의"</span>,
  <span class="k">"evidence"</span>: { <span class="k">"chunk"</span>: <span class="s">"DOC-M201#c03"</span>, <span class="k">"ts"</span>: <span class="s">"00:00:33"</span>,
                <span class="k">"quote"</span>: <span class="s">"원인은 PT-V42 열화로 추정하고 있습니다"</span> } }</pre>`, 'data-v="3"', 'fill-mint');
      const E = [['부정', '"원인은 PT-V42가 아니었다"', '원인 관계 생성'], ['예정 · 시제', '"교체 예정"', '교체 완료 이벤트'], ['조건문', '"압력이 떨어지면 밸브 점검"', '사실로 추출'], ['질문문', '"PT-V42 문제인가요?"', '단언으로 추출']];
      E.forEach((e, i) => { s += card(134 + i * 418, 668, 398, 140, 'orange', `<h5>${e[0]}</h5><div class="s18 c-fg">${e[1]}</div><div class="s16 c-red" style="margin-top:4px">→ ${e[2]}</div>`, 'data-v="4"'); });
      s += card(134, 834, 1652, 118, 'mint', `<div class="row" style="flex-wrap:wrap;gap:8px">${chip('certainty · polarity · status 필드', 'okl sans')}${chip('관계 분리: SUSPECTED / CONFIRMED', 'okl sans')}${chip('확정은 공식 근거(고장 코드 등)가 있을 때만', 'okl sans')}</div>
        <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px">${chip('검증 규칙: 인용문에 "추정 · 예정 · 아니 · 만약 · ?" + confirmed → 보류', 'hold sans')}${chip('프롬프트에 반례 예시', 'okl sans')}</div>`, 'data-v="5"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "확실성·부정·시제·조건을 필드로 보존한다.",
      script: [
        "데모 회의록 STT의 한 줄입니다. '원인은 PT-V42 열화로 추정하고 있습니다, 교체하고 나서 다시 확인하겠습니다.'",
        "(→) 그런데 LLM이 흔히 이렇게 뽑습니다. CAUSED_BY, 확정. '추정'이 사라졌고, 나중에 누가 물으면 확정된 원인으로 답하게 됩니다.",
        "(→) 후보는 이런 모양으로 남겨야 합니다. 관계는 SUSPECTED_CAUSE, 확실성은 suspected, 언제 누가 말했는지, 원문 어디인지. 데모에서 gpt-4.1은 이 문장을 실제로 SUSPECTED_CAUSE, suspected로 뽑았고, 고위험이라 사람 확인으로 보류됩니다.",
        "(→) 비슷한 오류가 더 있습니다. 부정문을 원인으로, 예정을 완료로, 조건문을 사실로, 질문문을 단언으로 뽑는 경우입니다. 데모에서도 '금요일 오후에 교체 예정'을 LLM이 확정으로 표시했고, 검증의 '예정' 표현 검사가 잡았습니다.",
        "(→) 대응은 스키마에 확실성 필드를 두고, 관계 자체를 추정과 확정으로 나누고, 확정은 공식 근거가 있을 때만 쓰게 하고, 인용문에 '추정·예정·아니·만약·물음표'가 있는데 확정이면 보류하는 검증 규칙을 두는 것입니다.",
      ],
      discuss: "추정 관계도 그래프에 올릴까, 후보 저장소에만 둘까?",
      concept: "사실성(factuality)·양태(modality)·헤지(hedging): 언어학·NLP에서 오래된 주제(FactBank 등).",
      src: "자체 설계 · 데모 회의록 STT",
    },
  });
})();
