/* 덱 목차(슬라이드 순서)와 공통 설정. 편집 안내: presentation/AGENTS.md
   - 순서를 바꾸려면 ORDER 안에서 id 위치만 옮깁니다. 쪽 번호는 자동으로 다시 매겨집니다.
   - 슬라이드를 추가하려면 js/slides/<id>.js 파일을 만들고(_TEMPLATE.js 복사) ORDER에 id를 넣습니다.
   - 슬라이드를 빼려면 ORDER에서 id를 지웁니다(파일은 지워도 되고 남겨도 됩니다).
   - id는 영문 · 숫자 · 밑줄만 씁니다(예: P11, P11a, DEMO_EXTRA). 파일 이름 = id. */
window.DECK_CONFIG = {
  /* 모든 슬라이드 위쪽 왼쪽에 나오는 문구. 슬라이드의 ctxSub가 있으면 뒤에 ' · ctxSub'가 붙습니다. */
  ctx: '발표 2 / 4 · <b>우리 도메인 온톨로지 구축</b>',
  /* 위쪽 오른쪽 배지의 기본값(슬라이드에 badge가 없을 때) */
  badge: '설계 예상값',
  ORDER: [
    'P01', 'P02', 'P02a', 'P02b', 'P02c', 'P03', 'P04', 'P05', 'P06', 'P07',
    'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14', 'P14a', 'P15', 'P16',
    'P16a', 'P17', 'P17a', 'P18', 'P19', 'P19a', 'P20', 'P21', 'P22', 'P22a',
    'P23', 'P23a', 'P23b', 'P24', 'P24a', 'P25', 'P26', 'P27', 'P28', 'P29',
    'P30', 'P31',
  ],
};

/* ORDER의 슬라이드 파일을 순서대로 불러옵니다(서버 없이 file://로 열어도 동작). 고칠 필요 없음. */
(function () {
  const base = (document.currentScript && document.currentScript.src || '').replace(/deck\.js(\?.*)?$/, '');
  window.DECK_CONFIG.ORDER.filter((id, i, a) => a.indexOf(id) === i).forEach(id => {
    document.write(`<script src="${base}slides/${id}.js" onerror="window.DECK_LOAD_ERRORS=(window.DECK_LOAD_ERRORS||[]).concat('${id}')"><\/script>`);
  });
})();
