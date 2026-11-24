/* P19a · 추출 정리 · 할 일과 방법 선택
   편집 안내: presentation/AGENTS.md · 검사: python tools/check_deck.py */
(function () {
  const { div, card, t, chip, mk, tag, node, pill, svg, path, ul, cb, q, tbl, code, box, esc } = H;

  DECK.register({
    id: 'P19a', steps: 3, section: '4 · 추출', ctxSub: '03 추출', badge: '설계 가이드',
    title: "추출 정리 · 할 일과 방법 선택",
    takeaway: "정형은 규칙 매핑, 문서는 스키마를 고정한 LLM 추출이 기본입니다. 스키마 없는 추출은 새 개념을 찾는 용도로만 씁니다",
    src: "vLLM Structured Outputs 문서 · Neo4j GraphRAG Python(SimpleKGPipeline) · 자체 설계",
    html() {
      let s = '';
      /* 스텝 1: 이 단계에서 개발자가 할 일 */
      s += card(134, 236, 520, 590, 'purple', `<h5>추출 · 개발자가 할 일</h5><ol class="todo s20"><li><b>업무 질문(CQ)과 정의 파일</b><span>필요한 클래스 · 관계만 YAML로</span></li><li><b>정형 소스 매핑 규칙</b><span>열 → 노드 · 관계 · 속성, LLM 없이</span></li><li><b>문서용 프롬프트</b><span>관계 목록 · 사전 · 예시 · 반례 · '추정'은 suspected로</span></li><li><b>출력 형식 고정</b><span>JSON 스키마 · 근거 구절 · 조각 위치</span></li><li><b>기록 남기기</b><span>모델 · 프롬프트 버전 · 호출 기록 · 비용</span></li><li><b>정의 밖 결과 모으기</b><span>목록 밖 관계 · 모르는 용어 → 확장 후보 큐</span></li></ol>`, 'data-v="1" data-nf');
      /* 스텝 2: 흔히 쓰는 방법 비교 · 스텝 3: 우리 선택 강조 */
      const rows = [
        { a: 'data-c="pick@3"', c: [`규칙 · 템플릿 매핑 ${chip('우리 선택', 'ok sans')}`, `정확 · 싸고 재현됨`, `자유 서술은 못 함`, `DB · export · 양식 문서`] },
        { a: '', c: [`전통 NLP (개체명 인식 + 관계 분류 모델)`, `빠르고 저렴한 대량 처리`, `라벨 데이터 · 도메인마다 재학습`, `같은 유형 문서가 아주 많을 때`] },
        { a: 'data-c="pick@3"', c: [`LLM · 스키마 고정 추출 ${chip('우리 선택', 'ok sans')}`, `라벨 없이 시작 · 문맥 이해`, `비용 · 흔들림 · 그럴듯한 오류`, `메일 · 회의록 같은 자유 서술`] },
        { a: '', c: [`LLM · 자유 추출 (스키마 없음)`, `모르는 개념 발굴`, `같은 것이 여러 이름으로 쪼개짐`, `온톨로지 확장 후보 찾기`] },
      ];
      s += card(690, 236, 1096, 590, 'gray', `<h5>흔히 쓰는 방법</h5>`, 'data-v="2"', 'panel');
      s += tbl(706, 278, 1064, ["방법", "장점", "단점", "맞는 경우"], rows, { a: 'data-v="2"', cls: 'lg', widths: ['27%', '23%', '25%', '25%'] });
      /* 스텝 3: 우리 상황에서의 선택 */
      s += card(134, 846, 1652, 106, 'mint', `<div class="s22 b c-mint">우리 상황에서는</div><p class="s19 c-fg" style="margin-top:4px">CMMS · MES는 매핑 규칙, 메일 · 회의록은 스키마 고정 LLM 추출 → 결과는 전부 후보. 오픈웨이트 모델이면 관계 목록을 짧게 · 예시를 많이 · 구조화 출력 기능을 켬</p>`, 'data-v="3"', 'fill-mint');
      return s;
    },
    /* 발표자 노트. script는 문단 배열이고, '(→)'로 시작하는 문단 수 = steps - 1 */
    notes: {
      convey: "추출 단계에서 개발자가 할 일, 흔한 방법들의 장단점, 우리 상황의 선택을 한 장으로 정리한다.",
      script: [
        "추출에서 개발자가 할 일은 업무 질문과 정의 파일, 정형 소스의 매핑 규칙, 문서용 프롬프트, 출력 형식 고정, 그리고 모델과 프롬프트 버전 기록, 정의 밖 결과를 후보로 모으는 일입니다.",
        "(→) 방법은 넷입니다. 규칙 매핑은 정확하고 싸지만 자유 서술은 못 하고, 개체명 인식과 관계 분류 같은 전통 모델은 빠르지만 라벨이 필요하고, 스키마를 고정한 LLM 추출은 라벨 없이 시작할 수 있지만 흔들리고, 스키마 없는 LLM 추출은 새 개념 발굴에는 좋지만 이름이 쪼개집니다.",
        "(→) 우리는 정형은 규칙, 문서는 스키마를 고정한 LLM 추출이 맞습니다. 사내 오픈웨이트 모델을 쓴다면 관계 목록을 짧게 하고 예시를 늘리고, 서버의 구조화 출력 기능을 켜는 것이 효과가 큽니다.",
      ],
      discuss: "",
      concept: "구조화 출력(constrained decoding): vLLM은 JSON Schema · 정규식 · 선택지로 생성을 제한할 수 있다(xgrammar · outlines 등 백엔드). 형식은 보장하지만 내용이 맞는지는 검증 단계의 일.",
      src: "vLLM Structured Outputs 문서 · Neo4j GraphRAG Python(SimpleKGPipeline) · 자체 설계",
    },
  });
})();
