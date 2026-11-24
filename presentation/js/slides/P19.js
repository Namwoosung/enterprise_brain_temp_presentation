/* P19 · 추출 ④ 정형은 규칙으로, 문서는 LLM으로 뽑고 둘 다 후보로 둡니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P19', steps: 4, section: '4 · 추출', ctxSub: '03 추출', badge: '데모 실제 결과',
    title: '추출 ④ 정형은 규칙으로, 문서는 LLM으로 뽑고 둘 다 후보로 둡니다',
    takeaway: '만드는 방법은 달라도 결과는 같은 모양(후보 + 근거 + 판정 전)으로 모읍니다',
    src: '자체 설계 · 매핑 규칙 예: R2RML 계열',
    html() {
      let s = card(134, 240, 1090, 196, 'purple', `<h5>정형 · 프로그램</h5><div class="row" style="margin-top:16px;gap:14px">${chip('CMMS-WO@v1 행 3', 'src lg')}<span class="s26 sub">→</span><div class="card" style="padding:10px 14px"><div class="s20 b c-purple">매핑 규칙</div><div class="s16 sub">결정적 · 같은 입력 = 같은 결과</div></div><span class="s26 sub">→</span>${chip('R04–R06', 'cand lg')}</div>
        <p class="s17" style="margin-top:12px">정답이 정해져 있으니 LLM이 필요 없다 · 싸고 재현 가능</p>`, 'data-v="1"');
      s += card(134, 460, 1090, 220, 'blue', `<h5>비정형 · LLM</h5><div class="row" style="margin-top:16px;gap:14px">${chip('DOC-M201', 'src')}${chip('MAIL-T311', 'src')}<span class="s26 sub">→</span><div class="card" style="padding:10px 14px"><div class="s20 b c-blue">LLM 추출</div><div class="s16 sub">스키마 + 용어 사전 + 반례</div></div><span class="s26 sub">→</span>${['mail F01–F03', 'stt F01–F06'].map(c => chip(c, 'cand lg')).join('')}</div>
        <p class="s17" style="margin-top:12px">같은 입력도 결과가 흔들릴 수 있다 → 모델 ID · 프롬프트 버전 · 실행 ID를 후보마다 기록</p>`, 'data-v="2"');
      s += card(1260, 240, 526, 440, 'gray', `<h5>후보 저장소 · 아직 사실이 아님</h5>
        <table class="tb tight" style="margin-top:6px"><tr><th>후보</th><th>만든 곳</th><th>근거</th></tr>
        <tr><td class="k mono">R04</td><td>cmms-mapper@0.3</td><td class="mono s15">CMMS-WO 행 3</td></tr>
        <tr><td class="k mono">mail F01</td><td>extract-fab-v1</td><td class="mono s15">MAIL-T311#c02</td></tr>
        <tr><td class="k mono">stt F02</td><td>extract-fab-v1</td><td class="mono s15">DOC-M201#c03</td></tr>
        <tr><td class="k mono">stt F05</td><td>extract-fab-v1</td><td class="mono s15">DOC-M201#c05</td></tr>
        <tr><td class="k mono">stt F06</td><td>extract-fab-v1</td><td class="mono s15">DOC-M201#c06</td></tr></table>
        <p class="s17" style="margin-top:8px">18개 모두 <b class="c-orange">pending</b> → 검증 단계로 · LLM은 gpt-4.1</p>`, 'data-v="3"', 'panel');
      s += svg(path('M1226,338 C1240,338 1240,420 1256,420', 'purple', { draw: true, a: 'data-v="3"' }) + path('M1226,570 C1240,570 1240,500 1256,500', 'blue', { draw: true, a: 'data-v="3"' }));
      const W = [['정형 행', '프로그램', '정답이 정해져 있음'], ['템플릿 문서 · 표', '프로그램 + LLM', '양식 부분은 규칙'], ['자유 서술', 'LLM → 후보', '확정 권한 없음'], ['온톨로지 확장', 'LLM 제안 → 사람', '의미는 조직의 합의'], ['암묵지', '사람', '질문 큐 ({{P27}}장)']];
      W.forEach((w, i) => { s += card(134 + i * 334, 712, 318, 240, 'gray', `<h5>${w[0]}</h5><div class="s22 b" style="margin-top:6px">${w[1]}</div><p style="margin-top:6px">${w[2]}</p>`, 'data-v="4"'); });
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "정형=결정적 매핑, 비정형=LLM 후보, 결과는 같은 후보 저장소로.",
      script: [
        "데모의 CMMS export는 매핑 규칙으로 바로 후보가 됩니다. WO-1042 한 행에서 대상 설비, 사용 부품, 작업 상태 세 개가 나옵니다. 정답이 정해져 있으니 LLM이 필요 없고, 싸고 재현 가능합니다.",
        "(→) 회의록과 메일은 LLM이 스키마와 용어 사전, 반례를 받아서 후보를 뽑습니다. 데모에서는 gpt-4.1이 메일에서 3개, 회의록에서 6개를 뽑았습니다. 같은 입력도 결과가 흔들릴 수 있어서 모델 ID, 프롬프트 버전, 호출 기록을 후보마다 남깁니다.",
        "(→) 두 경로 모두 바로 그래프로 가지 않고 후보로 모입니다. 18개 전부 pending 상태로 검증 단계에 넘어갑니다.",
        "(→) 정리하면 정형 행은 프로그램, 템플릿 문서는 프로그램과 LLM, 자유 서술은 LLM 후보, 온톨로지 확장은 LLM 제안과 사람 결정, 암묵지는 사람입니다.",
      ],
      discuss: "",
      concept: "추출과 ER을 분리: 후보의 resolved_id를 비워 두고 정제 단계에서 채우면 각각 따로 검증·교체할 수 있다.",
      src: "자체 설계 · 데모 실제 결과",
    },
  });
})();
