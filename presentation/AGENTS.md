# 발표자료 편집 안내 (사람 · AI 에이전트 공용)

빌드 없는 HTML 덱입니다. 1920×1080 화면에 요소를 **절대 좌표(px)** 로 놓습니다.
**한 장 = 한 파일**이고, 그 장의 발표자 노트도 같은 파일에 있습니다.

## 파일 지도
| 무엇을 | 어디서 |
|---|---|
| 슬라이드 순서 · 넣기 · 빼기 | `js/deck.js`의 `ORDER` |
| 한 장의 제목 · 본문 · 스텝 · 노트 | `js/slides/<id>.js` (예: `js/slides/P07.js`) |
| 새 장 틀 | `js/slides/_TEMPLATE.js` (직접 복사하지 말고 `tools/new_slide.py` 사용) |
| 모든 장의 위쪽 왼쪽 문구 · 기본 배지 | `js/deck.js`의 `ctx`, `badge` |
| 그리기 함수(card, node, path, tbl …) | `js/engine/helpers.js`, `js/engine/helpers-v3.js` |
| 색 · 글자 크기 | `css/` (보통 고칠 필요 없음) |
| 렌더링 · 키보드 · 노트 창 | `js/engine/render.js`, `js/engine/nav.js`, `notes.html` (보통 고칠 필요 없음) |

## 고친 뒤 반드시
```
python tools/check_deck.py
```
- `OK`가 나와야 끝입니다. `ERROR`가 있으면 고치고 다시 실행합니다. `WARN`은 의도한 것이면 둡니다.
- Node.js가 있으면 JS 문법까지 검사합니다. 없으면 괄호 · 따옴표 짝만 봅니다.
- 브라우저로 `index.html`을 열 수 있다면 고친 장을 직접 봅니다(`index.html#P07-1`처럼 장 · 스텝으로 이동).
  문제가 있는 장은 오른쪽 위에 **빨간 ⚠ 배지**가 뜹니다(마우스를 올리면 이유). 콘솔(F12)에도 `[deck]`으로 나옵니다.
- 검사 스크립트는 글자가 카드 밖으로 넘치는지는 모릅니다. 글을 늘렸다면 화면으로 확인하거나 원래 길이와 비슷하게 맞춥니다.

## 슬라이드 파일 구조
```js
(function () {
  const { div, card, t, chip, ... } = H;        // 그리기 함수. 그대로 둡니다
  DECK.register({
    id: 'P07',            // 파일 이름과 같아야 함
    steps: 4,             // → 키를 몇 번 눌러야 다 보이는지
    section: '1 · 왜 어려운가', ctxSub: 'D 사람', badge: '교육용 가상 사례',
    title: '한 문장 제목',
    takeaway: '핵심 한 줄',
    src: '아래쪽 출처',
    html() { let s = ''; s += card(...); return s; },   // 본문
    notes: {                                            // 발표자 노트 (notes.html에 표시)
      convey: '이 장에서 전달할 것',
      script: ['스텝 1 대본', '(→) 스텝 2 대본', '(→) 스텝 3 대본', '(→) 스텝 4 대본'],
      discuss: '', concept: '', src: '',
    },
  });
})();
```

## 스텝(→ 키로 하나씩 보이기) 규칙
| 표시 | 뜻 |
|---|---|
| `data-v="2"` | 스텝 2부터 끝까지 보임 |
| `data-v="2-3"` | 스텝 2~3에서만 보임 |
| `data-v="1" data-nf` | 보이되, 다음 스텝에서 흐려지지 않음 |
| `data-c="on@2-4"` | 스텝 2~4에서 CSS 클래스 `on`을 붙임(강조 · 취소선 등). 여러 개는 `;`로 |
| `data-t="1:처음 글|3:바뀐 글"` | 스텝 3부터 글자를 바꿈 |
| `data-tr="2:100,-50"` | 스텝 2부터 (x+100, y-50) 이동. `2:100,-50,0.8`이면 크기도 0.8배 |

**지켜야 할 것 세 가지**
1. `steps` = 이 장에서 쓰는 가장 큰 스텝 번호.
2. `notes.script`에서 `'(→)'`로 시작하는 문단 수 = `steps - 1`. 스텝 1 문단은 `(→)` 없이 시작합니다. 한 스텝에 문단이 여러 개면 둘째 문단부터는 `(→)`를 붙이지 않습니다.
3. 마지막 스텝에서는 모든 요소가 또렷하게 보입니다(흐림 없음).

그리기 함수 안에서는 마지막 인자 쪽 문자열로 속성을 넣습니다: `card(x, y, w, h, 'mint', '내용', 'data-v="2"')`.
`data-v="${i + 1}"`처럼 **코드로 계산한 스텝 번호**도 있습니다(P06, P08, P09, P10, P13, P20, P24, P28). 이런 곳은 그 식이 쓰는 배열이나 숫자를 직접 고쳐야 합니다.

## 작업별 방법

### 1. 글자만 바꾸기 (제목 · 본문 · 노트)
1. `js/slides/<id>.js`에서 바꿀 글을 찾아 고칩니다. 제목은 `title`, 핵심 한 줄은 `takeaway`, 노트는 `notes`.
2. 문자열을 감싼 따옴표(`'`, `` ` ``, `"`)와 같은 따옴표가 글 안에 들어가면 깨집니다. `'`로 감싼 글 안의 `'`는 `\'`로 씁니다.
3. HTML 태그(`<b class="c-mint">…</b>`, `<br>`)는 지우지 말고 안의 글만 바꿉니다.
4. 다른 장을 가리키는 "08장", "→ 27장" 같은 번호는 자동으로 바뀌지 않습니다. 장 순서를 바꿨다면 `grep -n "장" js/slides/*.js`로 찾아 직접 고칩니다.

### 2. 장 순서 바꾸기
`js/deck.js`의 `ORDER`에서 id 위치만 옮깁니다. 쪽 번호(`05 / 31`)는 자동입니다. id(파일 이름)는 바꾸지 않아도 됩니다.

### 3. 장 넣기
```
python tools/new_slide.py P11a --after P11              # 빈 틀(_TEMPLATE)로 시작
python tools/new_slide.py P11a --after P11 --copy P11   # 비슷한 장을 복사해서 시작
```
그 다음 `js/slides/P11a.js`의 `title`, `html()`, `notes`를 채웁니다. id는 영문 · 숫자 · 밑줄만 씁니다.

### 4. 장 빼기
`js/deck.js`의 `ORDER`에서 id를 지웁니다. 파일은 남겨도 화면에 나오지 않습니다(검사에서 WARN으로 알려 줌).

### 5. 스텝 넣기 · 합치기 (번호 다시 매기기는 도구로)
```
python tools/step.py insert P07 3 --dry-run   # 무엇이 바뀌는지 먼저 보기
python tools/step.py insert P07 3             # 빈 스텝 3을 만들고, 기존 3.. 은 4.. 로
python tools/step.py merge  P07 3             # 스텝 3을 스텝 2에 합침, 기존 4.. 은 3.. 으로
```
- `insert` 뒤에는 새 스텝에 보일 요소에 `data-v="3"`을 붙이고, 노트의 `[새 스텝 대본을 여기에 씁니다]`를 고칩니다.
- `merge`는 요소를 지우지 않습니다. 스텝 3에 나오던 것이 스텝 2에 함께 나옵니다. 요소 자체를 없애려면 그 줄을 지웁니다.
- 도구가 "코드로 계산하는 스텝 번호"를 알려 주면 그 부분은 직접 고칩니다.

### 6. 요소 옮기기 · 크기 바꾸기
`card(x, y, w, h, …)`의 숫자가 왼쪽 위 좌표와 너비 · 높이입니다. 본문 영역은 대략 x 134~1786, y 230~960입니다.
선(`path('M x,y C …')`)은 카드와 따로 좌표를 가지므로 카드를 옮기면 선도 같이 옮겨야 합니다.

## 자주 쓰는 그리기 함수와 클래스
- `card(x, y, w, h, tone, html, attrs, extraClass)` — tone: `mint blue green purple orange red gray`. extraClass: `panel`, `dashed`, `faded`, `fill-mint` 등
- `t(x, y, w, html, cls, attrs)` 글 한 덩어리 · `node(cx, cy, w, h, label, sub, kind, attrs)` 그래프 노드 · `pill(cx, cy, text, kind, attrs)` 관계 이름
- `chip(text, kind)` · `tag(text, color)` · `mk(text, color, attrs)` 형광펜 · `ul([...], cls)` 목록 · `q(text)` 인용 · `code(text)` 코드 블록
- `tbl(x, y, w, head, rows, {widths, a})` 표 · `svg(path(...) + path(...))` 선 · `path(d, color, {dash, dot, w, draw, a})`
- 글자 크기 `s14 … s40`, 색 `c-mint c-blue c-green c-purple c-orange c-red c-sub c-fg`, 굵게 `b`, 가운데 `center`, 고정폭 `mono`

## 하지 말 것
- `js/engine/`과 `css/`는 구조 변경이 필요할 때만 고칩니다. 한 장의 모양 문제는 그 장 파일에서 해결합니다.
- 파일 이름과 `id`를 따로 바꾸지 않습니다(둘이 같아야 함). 이름을 바꾸려면 파일 이름, `id`, `ORDER`를 함께 바꿉니다.
- 데모(`../demo`)의 숫자를 덱에 옮겨 적었다면, 데모 데이터가 바뀐 뒤 덱 숫자도 맞는지 확인합니다. 덱 11~24장은 설비 정비 시나리오이고, 데모는 반도체 · AI 뉴스 도메인입니다(서로 다름).
