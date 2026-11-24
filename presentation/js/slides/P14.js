/* P14 · 수집 ② 원본은 바꾸지 않고, 받은 기록을 남깁니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P14', steps: 4, section: '4 · 수집', ctxSub: '01 수집', badge: '데모 회의록 STT',
    title: '수집 ② 원본은 바꾸지 않고, 받은 기록을 남깁니다',
    takeaway: '원본과 수집 기록이 있어야 틀린 사실을 원문과 대조하고, 그 원본만 다시 처리할 수 있습니다',
    src: 'W3C PROV-O (출처 표현) · medallion 레이어 구분 · 값은 예시',
    html() {
      let s = card(134, 240, 520, 342, 'green', `<h5>원본 · 수정 금지</h5><div class="mono s22 b">DOC-M201@v1</div>
        <div class="quote s18" style="margin-top:10px">[00:00:04] 화자1: 네 어 … 에이동 십칠 호기 압력 이상 건입니다<br>[00:00:33] 화자2: 원인은 피티 브이 사십이 열화로 추정하고 있습니다<br>[00:01:35] 화자1: 그 건은 지난번처럼 처리하기로 하죠</div>`, 'data-v="1"');
      s += card(690, 240, 560, 342, 'purple', `<h5>수집 기록 (메타데이터)</h5><div class="kv s16">
        <div><span class="k">source_system</span> <span class="v">groupware · STT</span></div>
        <div><span class="k">source_id</span> <span class="v">MTG-2026-0304-EQ</span></div>
        <div><span class="k">version · sha256</span> <span class="v">v1 · cde3…8c9f</span></div>
        <div><span class="k">created_at</span> <span class="v">2026-03-04</span></div>
        <div><span class="k">ingested_at</span> <span class="v">2026-03-05 02:00</span></div>
        <div><span class="k">attendees</span> <span class="v">4명 (설비기술 · 생산 · 공정)</span></div>
        <div><span class="k">series</span> <span class="v">주간 설비회의 #12</span></div>
        <div><span class="k">acl · stt</span> <span class="v">설비팀 · dummy-stt</span></div></div>`, 'data-v="2"');
      s += card(1286, 240, 500, 160, 'mint', `<h5>v2 도착 · 내용 해시가 다름</h5><div class="mono s20 b">DOC-M201@v2</div><p class="c-fg">새 버전으로 추가 · <b>v1은 그대로</b> 남김</p>`, 'data-v="3"');
      s += card(1286, 422, 500, 160, 'gray', `<h5>같은 파일 다시 수신 · 해시 같음</h5><div class="mono s20 b">DOC-M201@v1</div><p class="c-fg">건너뜀 · 결과 변화 없음 (멱등)</p>`, 'data-v="3"');
      const W = [['원본과 대조', '추출이 틀리면 원문 위치로 바로 가서 확인'], ['그 원본만 재처리', '규칙 · 프롬프트를 고친 뒤 영향받는 원본만 다시'], ['그래프 재구축', '그래프는 원본에서 다시 만들 수 있는 사본']];
      W.forEach((w, i) => { s += card(134 + i * 556, 614, 540, 176, 'mint', `<span class="num mint">${i + 1}</span><h4 style="margin-top:8px">${w[0]}</h4><p>${w[1]}</p>`, 'data-v="4"'); });
      s += card(134, 818, 1652, 134, 'gray', `<h5>레이어로 나누면 (medallion)</h5><div class="row" style="gap:14px;margin-top:8px">${chip('bronze · 원본 + 수집 기록', 'src lg sans')}<span class="s22 sub">→</span>${chip('silver · 정제 결과 · 후보', 'llm lg sans')}<span class="s22 sub">→</span>${chip('gold · 승인된 사실 · 그래프', 'okl lg sans')}</div>`, 'data-v="4"', 'panel');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "원본 불변 + 수집 메타 → 대조·재처리·재구축이 가능해진다.",
      script: [
        "데모의 주간 설비회의 STT 원본입니다. 받은 그대로 저장하고 수정하지 않습니다. '에이동 십칠 호기', '피티 브이 사십이'처럼 STT가 코드를 한글로 적은 것도 원본에서는 그대로 둡니다.",
        "(→) 같이 남기는 수집 기록입니다. 어느 시스템의 어떤 ID인지, 버전과 해시, 작성 시각과 수집 시각, 참석자, 회의 시리즈, 권한, 파서 버전까지. {{P07}}장에서 본 '지난번'을 풀 단서가 여기서 나옵니다.",
        "(→) v2가 오면 덮어쓰지 않고 새 버전으로 추가합니다. 같은 파일이 다시 오면 해시가 같으니 건너뜁니다.",
        "(→) 이렇게 하면 세 가지가 가능해집니다. 추출이 틀렸을 때 원문과 바로 대조하고, 규칙을 고친 뒤 그 원본만 다시 처리하고, 그래프 전체를 원본에서 다시 만들 수 있습니다. 레이크하우스에서 말하는 bronze, silver, gold 구분과 같은 생각입니다.",
      ],
      discuss: "",
      concept: "Provenance(W3C PROV-O): 사실이 어디서·언제·무엇에 의해 만들어졌나. 권한 전파: 원본 ACL을 사실로 넘기지 않으면 그래프가 권한 우회 통로가 된다. 다 복사하지 않는다: 되찾을 수 없는 것(개인 PC · 덮어쓰는 엑셀 · 지워지는 메일 · 로그)은 복사, 버전 · 고정 ID가 있는 원천(MES · CMMS · 문서 시스템)은 참조(시스템 · id · 버전 · 해시)만 남긴다.",
      src: "W3C PROV-O · medallion 구분",
    },
  });
})();
