/* Markup helpers. Coordinates are in the 1920x1080 stage space. `a` = extra attribute string (e.g. 'data-v="2"'). */
(function () {
  const sz = (x, y, w, h) => `left:${x}px;top:${y}px;` + (w != null ? `width:${w}px;` : '') + (h != null ? `height:${h}px;` : '');
  const H = {
    div(x, y, w, h, cls, inner, a = '', style = '') {
      return `<div class="abs ${cls || ''}" style="${sz(x, y, w, h)}${style}" ${a}>${inner || ''}</div>`;
    },
    /* card with optional h4 title */
    card(x, y, w, h, tone, inner, a = '', extra = '') {
      return H.div(x, y, w, h, `card ${tone ? 'tone-' + tone : ''} ${extra}`, inner, a);
    },
    t(x, y, w, inner, cls = 't', a = '') { return H.div(x, y, w, null, cls, inner, a); },
    chip(text, kind = '', a = '') { return `<span class="chip ${kind}" ${a}>${text}</span>`; },
    mk(text, color = '', a = '') { return `<span class="mk ${color}" ${a}>${text}</span>`; },
    tag(text, color = 'mint') { return `<span class="tag ${color}">${text}</span>`; },
    node(cx, cy, w, h, label, sub, kind = '', a = '', labelCls = '') {
      return `<div class="abs node ${kind}" style="${sz(cx - w / 2, cy - h / 2, w, h)}" ${a}><div class="l ${labelCls}">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
    },
    pill(cx, cy, text, kind = '', a = '') {
      return `<div class="abs pill ${kind}" style="left:${cx}px;top:${cy}px" ${a}>${text}</div>`;
    },
    /* svg overlay; put all paths of a slide in one or a few of these */
    svg(inner, a = '') { return `<svg class="ov" viewBox="0 0 1920 1080" ${a}>${inner}</svg>`; },
    /* line: c = color key, o = {w, dash, dot, arrow(false), draw, a} */
    path(d, c = 'sub', o = {}) {
      const cls = ['ln', 'c-' + c, o.dash ? 'dash' : '', o.dot ? 'dot' : '', o.draw ? 'draw' : '', o.cls || ''].join(' ');
      const mk = o.arrow === false ? '' : `marker-end="url(#ar-${c})"`;
      return `<path d="${d}" class="${cls}" stroke-width="${o.w || 2.5}" ${o.draw ? 'pathLength="1"' : ''} ${mk} ${o.a || ''}/>`;
    },
    table(x, y, w, head, rows, a = '', cls = '', widths) {
      const cg = widths ? `<colgroup>${widths.map(v => `<col style="width:${v}">`).join('')}</colgroup>` : '';
      const th = head ? `<tr>${head.map(c => `<th>${c}</th>`).join('')}</tr>` : '';
      const tr = rows.map(r => {
        const attrs = r.a || ''; const cells = r.c || r;
        return `<tr ${attrs}>${cells.map((c, i) => `<td${i === 0 && !r.noK ? ' class="k"' : ''}>${c}</td>`).join('')}</tr>`;
      }).join('');
      return H.div(x, y, w, null, '', `<table class="tb ${cls}">${cg}${th}${tr}</table>`, a);
    },
    /* deterministic pseudo-random for background clouds */
    rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); },
  };

  /* Shared focus graph (A-8 common coordinates, panel-local). */

  H.G = {

    W: 796, H: 590,

    pos: { WO1041: [200, 240], WO1042: [200, 420], FABA: [600, 150], FABB: [600, 300], PT: [600, 450] },

    /* returns html for one panel at (ox,oy). opts: {newNode, newEdges, slot, hl, notes, scale} */

    panel(ox, oy, o = {}) {

      const P = H.G.pos, A = (k, dx = 0, dy = 0) => [ox + P[k][0] + dx, oy + P[k][1] + dy];

      const ph = o.h || 560;

      let s = H.div(ox, oy, 796, ph, 'card panel', '', o.panelA || o.nodeA || '', 'padding:0');

      const e = [];

      e.push(H.path(`M${ox + 305},${oy + 225} L${ox + 476},${oy + 166}`, 'gray', { a: o.oldEdgeA || '', cls: o.hlCls || '' }));

      e.push(H.path(`M${ox + 305},${oy + 255} C${ox + 392},${oy + 255} ${ox + 392},${oy + 432} ${ox + 476},${oy + 432}`, 'gray', { a: o.oldEdgeA || '', cls: o.hlCls || '' }));

      if (o.newEdges) {

        e.push(H.path(`M${ox + 95},${oy + 420} C${ox + 30},${oy + 420} ${ox + 30},${oy + 134} ${ox + 180},${oy + 132} L${ox + 472},${oy + 126}`, 'mint', { w: 5, draw: true, a: o.newEdges }));

        e.push(H.path(`M${ox + 305},${oy + 428} L${ox + 472},${oy + 465}`, 'mint', { w: 5, draw: true, a: o.newEdges }));

      }

      s += H.svg(e.join(''));

      s += H.pill(ox + 390, oy + 196, 'ON_EQUIPMENT', '', o.oldEdgeA || '');

      s += H.pill(ox + 392, oy + 343, 'USED_PART_TYPE', '', o.oldEdgeA || '');

      if (o.newEdges) {

        s += H.pill(ox + 330, oy + 118, 'ON_EQUIPMENT', 'new', o.newEdges);

        s += H.pill(ox + 388, oy + 444, 'USED_PART_TYPE', 'new', o.newEdges);

      }

      const nA = o.nodeA || '', hlA = (o.hlA || '') + ' ' + nA;

      s += H.node(...A('FABA'), 240, 90, 'FAB-A / EQ-017', 'Equipment · SN-A017', '', hlA);

      s += H.node(...A('FABB'), 240, 90, 'FAB-B / EQ-017', 'Equipment · SN-B017', '', nA);

      s += H.node(...A('PT'), 240, 90, 'PT-V42', 'PartType · 부품 유형', '', hlA);

      s += H.node(...A('WO1041'), 210, 90, '<span class="mono">WO-1041</span>', 'MaintenanceWork', '', nA);

      if (o.slot) s += H.node(...A('WO1042'), 210, 90, '빈 자리', '', 'ghost', o.slot);

      if (o.newNode) s += H.node(...A('WO1042'), 210, 90, '<span class="mono">WO-1042</span>', 'completed · 신규', 'new', o.newNode);

      return s;

    }

  };

  window.H = H;
})();
