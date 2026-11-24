/* Deck registry + snapshot renderer. Every step is computed from (slide, step) only — nothing accumulates.
   Slide order comes from DECK_CONFIG.ORDER (js/deck.js). Problems found while building (missing slide,
   step numbers beyond `steps`, notes not matching steps) are shown as a red badge on the slide and
   collected in window.DECK_PROBLEMS. */
(function () {
  const DECK = window.DECK = {
    slides: [],
    register(def) {
      if (this.slides.some(s => s.id === def.id)) (window.DECK_PROBLEMS = window.DECK_PROBLEMS || []).push(`${def.id}: id가 두 번 등록됨`);
      this.slides.push(def);
    },
    /* slides in ORDER; a missing or broken file becomes a visible placeholder slide */
    ordered() {
      const cfg = window.DECK_CONFIG || {};
      const all = cfg.ORDER || this.slides.map(s => s.id).sort();
      const order = all.filter((id, i) => {
        if (all.indexOf(id) === i) return true;
        (window.DECK_PROBLEMS = window.DECK_PROBLEMS || []).push(`${id}: ORDER에 두 번 있음(두 번째는 건너뜀)`);
        return false;
      });
      return order.map(id =>this.slides.find(s => s.id === id) || {
        id, steps: 1, missing: true, title: `⚠ ${id} 슬라이드를 불러오지 못했습니다`,
        takeaway: `js/slides/${id}.js 파일이 없거나 문법 오류가 있습니다. 브라우저 콘솔(F12)을 확인하세요.`,
        html: () => '',
      });
    },
  };
  const inRange = (spec, s) => {
    const [a, b] = String(spec).split('-');
    const lo = +a, hi = b === undefined ? Infinity : +b;
    return s >= lo && s <= hi;
  };
  const lowOf = spec => +String(spec).split('-')[0];
  const nums = spec => String(spec).split('-').map(Number).filter(Number.isFinite);

  /* largest step number the slide's markup refers to */
  function maxStepUsed(sec) {
    let m = 1;
    sec.querySelectorAll('[data-v]').forEach(el => nums(el.dataset.v).forEach(n => { m = Math.max(m, n); }));
    sec.querySelectorAll('[data-c]').forEach(el => el.dataset.c.split(';').forEach(r => { const g = r.split('@')[1]; if (g) nums(g).forEach(n => { m = Math.max(m, n); }); }));
    sec.querySelectorAll('[data-t]').forEach(el => el.dataset.t.split('|').forEach(r => { m = Math.max(m, +r.slice(0, r.indexOf(':')) || 1); }));
    sec.querySelectorAll('[data-tr]').forEach(el => el.dataset.tr.split(';').forEach(r => { m = Math.max(m, +r.split(':')[0] || 1); }));
    return m;
  }

  function problemsOf(d, sec) {
    const p = [];
    if (d.missing) p.push('파일 없음 또는 문법 오류');
    if (!(d.steps >= 1)) p.push('steps가 없음');
    const used = maxStepUsed(sec);
    if (used > d.steps) p.push(`화면이 스텝 ${used}까지 쓰는데 steps가 ${d.steps}`);
    if (d.notes && Array.isArray(d.notes.script)) {
      const arrows = d.notes.script.filter(x => String(x).startsWith('(→)')).length;
      if (arrows !== d.steps - 1) p.push(`노트의 '(→)' 문단 ${arrows}개 ≠ steps-1 (${d.steps - 1})`);
    } else if (!d.missing) p.push('notes.script가 없음');
    return p;
  }

  const R = window.Render = {
    build(stage) {
      const cfg = window.DECK_CONFIG || {};
      DECK.slides = DECK.ordered();
      const all = window.DECK_PROBLEMS = window.DECK_PROBLEMS || [];
      (window.DECK_LOAD_ERRORS || []).forEach(id => all.push(`${id}: js/slides/${id}.js 파일을 찾을 수 없음`));
      const total = DECK.slides.length;
      DECK.slides.forEach((d, i) => {
        const sec = document.createElement('section');
        sec.className = 'slide';
        sec.dataset.id = d.id;
        const ctx = d.ctx || ((cfg.ctx || '') + (d.ctxSub ? ' · ' + d.ctxSub : ''));
        let body = '';
        try { body = d.html(); } catch (e) { body = ''; d.renderError = String(e); }
        sec.innerHTML = `
          <div class="topbar"><span class="ctx">${ctx}</span><span><span class="badge-err"></span><span class="badge-sim">${d.badge || cfg.badge || '설계 예상값'}</span></span></div>
          <h1 class="title">${d.title}</h1>
          <p class="takeaway"><span class="k">Key takeaway</span><span>${d.takeaway || ''}</span></p>
          <div class="body">${body}</div>
          <div class="footer">
            <span class="pg">${String(i + 1).padStart(2, '0')} / ${total}</span><span class="sec">${d.section || ''}</span>
            <span class="src">${d.src || ''}</span>
            <span class="step"><span class="stepnum"></span><span class="dots"></span></span>
          </div>`;
        stage.appendChild(sec);
        const probs = problemsOf(d, sec);
        if (d.renderError) probs.push('html() 실행 오류: ' + d.renderError);
        if (probs.length) {
          const b = sec.querySelector('.badge-err');
          b.textContent = '⚠ ' + probs.length;
          b.title = probs.join('\n');
          probs.forEach(x => all.push(`${d.id}: ${x}`));
        }
        d.el = sec;
        d.vEls = [...sec.querySelectorAll('[data-v]')];
        d.cEls = [...sec.querySelectorAll('[data-c]')];
        d.trEls = [...sec.querySelectorAll('[data-tr]')];
        d.tEls = [...sec.querySelectorAll('[data-t]')];
      });
      if (all.length) console.warn('[deck] 확인할 문제:\n' + all.join('\n'));
    },
    apply(idx, step) {
      DECK.slides.forEach((d, i) => d.el.classList.toggle('active', i === idx));
      const d = DECK.slides[idx], n = d.steps, s = step + 1, last = s === n;
      const focus = d.focus !== false && !last;
      d.vEls.forEach(el => {
        const spec = el.dataset.v, vis = inRange(spec, s);
        el.classList.toggle('off', !vis);
        const nf = el.hasAttribute('data-nf') || !focus;
        el.classList.toggle('is-new', vis && lowOf(spec) === s);
        el.classList.toggle('is-past', vis && !nf && lowOf(spec) < s);
      });
      d.cEls.forEach(el => el.dataset.c.split(';').forEach(rule => {
        if (!rule.trim()) return;
        const [cls, range] = rule.split('@');
        el.classList.toggle(cls.trim(), inRange(range, s));
      }));
      d.trEls.forEach(el => {
        let t = '';
        el.dataset.tr.split(';').forEach(rule => {
          const [k, v] = rule.split(':');
          if (s >= +k) { const [dx, dy, sc] = v.split(',').map(Number); t = `translate(${dx}px,${dy}px)` + (sc ? ` scale(${sc})` : ''); }
        });
        el.style.transform = t;
      });
      d.tEls.forEach(el => {
        let t = null;
        el.dataset.t.split('|').forEach(rule => {
          const i = rule.indexOf(':'); const k = +rule.slice(0, i);
          if (s >= k) t = rule.slice(i + 1);
        });
        if (t !== null) el.innerHTML = t;
      });
      d.el.querySelector('.stepnum').textContent = `${s} / ${n}`;
      d.el.querySelector('.dots').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('');
    }
  };
})();
