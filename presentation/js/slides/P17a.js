/* P17a · 추출 ② 정의 파일 한 장: 블록마다 쓰이는 곳이 있습니다
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P17a', steps: 5, section: '4 · 추출', ctxSub: '03 추출', badge: '설계 예시',
    title: '추출 ② 정의 파일 한 장: 블록마다 쓰이는 곳이 있습니다',
    takeaway: '처음부터 크게 만들지 않습니다. 업무 질문(CQ)에 답하는 데 필요한 만큼만 쓰고, 밖의 것은 후보로 모읍니다',
    src: '자체 설계 예시 · 같은 방식의 표준 도구: LinkML(YAML → JSON Schema · Pydantic · SHACL · SQL)',
    html() {
      /* 왼쪽: 일반적인 정의 파일. 블록마다 data-c="on@N"으로 해당 스텝에 강조 */
      const blk = (step, lines) => `<span class="yb" data-c="on@${step}-${step}">${lines}</span>`;
      const C = s => `<span class="c">${s}</span>`;
      const yaml =
        `version: 1.2.0            ${C('# Git 태그와 같이 관리')}
` +
        blk(1, `${C('# ① 무엇이 있나 (노드)')}
classes:
  Equipment:
    key: [fab, code]        ${C('# 같은 대상 판단 기준')}
    required: [serial]
    enums: {state: [run, idle, down]}
    synonyms: [설비, 호기, 장비]
`) +
        blk(2, `${C('# ② 어떻게 연결되나 (관계)')}
relations:
  ON_EQUIPMENT:
    from: MaintenanceWork
    to: Equipment
    cardinality: many_to_one
    official: CMMS          ${C('# 다르면 이쪽이 기준')}
`) +
        blk(3, `${C('# ③ LLM에게 줄 예시')}
examples: ["17호기 P/T 교체 완료"]
${C('# ④ 사람에게 보낼 기준')}
review:
  high_risk: [SUSPECTED_CAUSE]
  hedge_words: [추정, 예정]
`) +
        blk(4, `${C('# ⑤ 정의 밖에서 온 것')}
unknown: candidate_queue
`);
      let s = `<style>.yb{display:block;border-radius:6px;transition:background .3s} .yb.on{background:rgba(94,234,212,.14);box-shadow:-6px 0 0 rgba(94,234,212,.9)}</style>`;
      s += card(134, 236, 820, 590, 'purple', `<h5>ontology/kg-schema.yaml</h5><pre class="code" style="margin-top:4px;font-size:15.5px;line-height:1.36">${yaml}</pre>`, 'data-v="1" data-nf');

      /* 오른쪽: 블록 → 만들어지는 것 */
      const R = [
        [1, '① 클래스', ['LLM 출력 JSON 스키마의 타입 · enum', '적재 전 필수값 · 형식 검사', 'DB 유니크 제약 (key)', '용어 사전의 첫 항목 (synonyms)']],
        [2, '② 관계', ['허용 관계 · 방향 검사', '개수 검사 (작업 하나 = 설비 하나)', '원천 시스템 대조 기준 (official)']],
        [3, '③ 예시 · ④ 검토 기준', ['프롬프트의 예시 (few-shot)', '사람에게 보낼지 정하는 규칙 ({{P22}}장)']],
        [4, '⑤ 정의 밖', ['버리지 않고 확장 후보 큐로', '자주 나오면 정의를 고치는 PR → 버전 올림']]];
      const H_ = [168, 140, 118, 118];
      let y = 236;
      R.forEach(([st, name, items], i) => {
        s += card(990, y, 796, H_[i], 'mint', `<div class="s22 b c-mint">${name} →</div>${ul(items, 's18')}`, `data-v="${st}"`);
        y += H_[i] + 12;
      });

      /* 결론: 얼마나 크게? */
      s += card(134, 846, 1652, 106, 'orange', `<div class="s24 b" style="margin-top:2px">얼마나 크게 만드나: 업무 질문에 답하는 데 필요한 클래스 · 관계만</div>
        <p class="s19 c-fg" style="margin-top:6px">시작은 질문 몇 개에 필요한 만큼 · 데이터가 들어오면서 후보 큐를 보고 넓힘 · 한 번에 전 도메인을 덮으려 하지 않음</p>`, 'data-v="5"', 'fill-orange');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "정의 파일의 블록이 각각 무엇을 만들어 내는지 보여 주고, 처음부터 크게 만들 필요가 없다는 점을 말한다.",
      script: [
        "앞 장에서 정의를 YAML 한 곳에 둔다고 했는데, 실제로 어떤 모양인지 보겠습니다. 첫 블록은 클래스, 즉 어떤 것들이 있는지입니다. 같은 대상인지 판단하는 키, 꼭 있어야 하는 값, 허용 값, 동의어를 적습니다. 여기서 LLM 출력 형식의 타입, 적재 전 검사, DB 유니크 제약, 용어 사전의 첫 항목이 만들어집니다.",
        "(→) 두 번째는 관계입니다. 어디서 어디로 가는지, 몇 개까지인지, 그리고 값이 다를 때 어느 시스템을 기준으로 삼을지. 이걸로 방향 검사, 개수 검사, 원천 대조를 합니다.",
        "(→) 세 번째와 네 번째는 LLM에게 줄 예시와 사람에게 보낼 기준입니다. 예시는 프로그램이 프롬프트에 넣고, 위험 관계 목록과 '추정' 같은 표현 목록은 뒤에서 볼 검토 기준에 쓰입니다.",
        "(→) 마지막은 정의 밖에서 온 것입니다. 버리지 않고 확장 후보 큐로 보냅니다. 같은 후보가 자주 나오면 정의를 고치는 PR을 만들고 버전을 올립니다.",
        "(→) 그럼 처음에 얼마나 크게 만들어야 하느냐. 업무 질문 몇 개에 답하는 데 필요한 만큼이면 충분합니다. 도메인 전체를 처음부터 덮으려고 하면 끝나지 않습니다. 데이터를 넣어 보면서 후보 큐를 보고 넓혀 갑니다.",
      ],
      discuss: "처음 버전에 넣을 업무 질문 다섯 개를 고른다면?",
      concept: "Competency Question(Grüninger & Fox 1995) 기반 범위 설정은 Ontology Development 101(Noy & McGuinness), NeOn 방법론에서도 첫 단계. LinkML은 YAML 스키마에서 JSON Schema · Pydantic · SHACL · SQL DDL을 생성하는 공개 도구로, 이 장의 '한 곳에서 생성' 방식과 같은 생각이다.",
      src: "Noy & McGuinness, Ontology Development 101 (2001) · Suárez-Figueroa et al., NeOn Methodology (2012) · LinkML 문서(linkml.io)",
    },
  });
})();
