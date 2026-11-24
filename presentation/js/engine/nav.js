/* Keyboard-only navigation, stage scaling, deep links (#P07-3), notes sync. */
(function () {
  const stage = document.getElementById('stage');
  Render.build(stage);
  const slides = DECK.slides;
  let cur = 0, step = 0, lastAt = 0, lastRepeat = 0;
  let chan = null;
  try { chan = new BroadcastChannel('eb-deck'); } catch (e) { chan = null; }

  function show() {
    // If the previous transition is still running, snap it to its final state first (A-2).
    if (performance.now() - lastAt < 600) {
      stage.classList.add('instant');
      void stage.offsetWidth;
      stage.classList.remove('instant');
    }
    Render.apply(cur, step);
    lastAt = performance.now();
    const id = slides[cur].id;
    history.replaceState(null, '', `#${id}-${step + 1}`);
    try { localStorage.setItem('eb-deck-pos', JSON.stringify({ id, step: step + 1, t: Date.now() })); } catch (e) {}
    if (chan) try { chan.postMessage({ id, step: step + 1 }); } catch (e) {}
  }
  function next() {
    if (step < slides[cur].steps - 1) step++;
    else if (cur < slides.length - 1) { cur++; step = 0; }
    show();
  }
  function prev() {
    if (step > 0) step--;
    else if (cur > 0) { cur--; step = slides[cur].steps - 1; }
    show();
  }
  document.addEventListener('keydown', e => {
    const fwd = ['ArrowRight', 'ArrowDown', ' ', 'Spacebar'].includes(e.key);
    const back = ['ArrowLeft', 'ArrowUp'].includes(e.key);
    if (!fwd && !back) return;
    e.preventDefault();
    // Holding a key keeps moving; repeats are throttled so each step is still visible.
    if (e.repeat) {
      const now = performance.now();
      if (now - lastRepeat < 70) return;
      lastRepeat = now;
    }
    fwd ? next() : prev();
  });
  function fit() {
    const sc = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(-50%,-50%) scale(${sc})`;
  }
  addEventListener('resize', fit);
  const m = location.hash.match(/^#(P\d\d)-(\d+)$/);
  if (m) {
    const i = slides.findIndex(x => x.id === m[1]);
    if (i >= 0) { cur = i; step = Math.max(0, Math.min(+m[2], slides[i].steps) - 1); }
  }
  fit(); show();
  window.__deck = { go(id, s) { const i = slides.findIndex(x => x.id === id); if (i >= 0) { cur = i; step = s - 1; show(); } }, state: () => ({ id: slides[cur].id, step: step + 1 }) };
})();
