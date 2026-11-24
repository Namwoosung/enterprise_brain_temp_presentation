/* Extra helpers for the v3 (30-slide) deck. Loaded after helpers.js. */
(function () {
  const H = window.H;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  H.esc = esc;
  /* bullet list */
  H.ul = (items, cls = 's18') => `<ul class="ul ${cls}">${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
  /* plain code block (text is escaped) */
  H.code = (txt, cls = '') => `<pre class="code ${cls}">${esc(txt)}</pre>`;
  /* table whose cells and rows can carry attributes.
     rows: [{a:'row attrs', c:[cell | [html, 'cell attrs']]}] or plain arrays
     head: [cell | [html, 'attrs']] */
  H.tbl = (x, y, w, head, rows, o = {}) => {
    const cell = (c, tag, i) => {
      const [h, a] = Array.isArray(c) ? c : [c, ''];
      const k = tag === 'td' && i === 0 && !o.noK ? ' class="k"' : '';
      return `<${tag}${k} ${a || ''}>${h}</${tag}>`;
    };
    const cg = o.widths ? `<colgroup>${o.widths.map(v => `<col style="width:${v}">`).join('')}</colgroup>` : '';
    const th = head ? `<tr ${o.headA || ''}>${head.map((c, i) => cell(c, 'th', i)).join('')}</tr>` : '';
    const tr = rows.map(r => {
      const a = Array.isArray(r) ? '' : (r.a || ''); const cs = Array.isArray(r) ? r : r.c;
      return `<tr ${a}>${cs.map((c, i) => cell(c, 'td', i)).join('')}</tr>`;
    }).join('');
    return H.div(x, y, w, null, '', `<table class="tb ${o.cls || ''}">${cg}${th}${tr}</table>`, o.a || '');
  };
  /* boxed label (absolute) */
  H.cb = (x, y, w, h, html, cls = '', a = '') => H.div(x, y, w, h, `cb ${cls}`, html, a);
  /* step header inside a card */
  H.hd = (no, name, color) => `<div class="hd"><span class="no c-${color}">${no}</span><span class="nm">${name}</span></div>`;
  H.q = (txt, cls = '') => `<div class="quote ${cls}">${txt}</div>`;
  H.box = () => '<span class="cbx"></span>';
})();
