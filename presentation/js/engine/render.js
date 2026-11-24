/* Deck registry + snapshot renderer. Every step is computed from (slide, step) only — nothing accumulates. */
(function () {
  const DECK = window.DECK = { slides: [], register(def) { this.slides.push(def); } };
  const inRange = (spec, s) => {
    const [a, b] = String(spec).split('-');
    const lo = +a, hi = b === undefined ? Infinity : +b;
    return s >= lo && s <= hi;
  };
  const lowOf = spec => +String(spec).split('-')[0];

  const R = window.Render = {
    build(stage) {
      DECK.slides.sort((x, y) => x.id.localeCompare(y.id));
      const total = DECK.slides.length;
      DECK.slides.forEach((d, i) => {
        const sec = document.createElement('section');
        sec.className = 'slide';
        sec.dataset.id = d.id;
        sec.innerHTML = `
          <div class="topbar"><span class="ctx">${d.ctx || ''}</span><span class="badge-sim">${d.badge || '설계 예상값'}</span></div>
          <h1 class="title">${d.title}</h1>
          <p class="takeaway"><span class="k">Key takeaway</span><span>${d.takeaway || ''}</span></p>
          <div class="body">${d.html()}</div>
          <div class="footer">
            <span class="pg">${String(i + 1).padStart(2, '0')} / ${total}</span><span class="sec">${d.section || ''}</span>
            <span class="src">${d.src || ''}</span>
            <span class="step"><span class="stepnum"></span><span class="dots"></span></span>
          </div>`;
        stage.appendChild(sec);
        d.el = sec;
        d.vEls = [...sec.querySelectorAll('[data-v]')];
        d.cEls = [...sec.querySelectorAll('[data-c]')];
        d.trEls = [...sec.querySelectorAll('[data-tr]')];
        d.tEls = [...sec.querySelectorAll('[data-t]')];
      });
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
