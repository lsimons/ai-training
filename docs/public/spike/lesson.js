/* Spike: interactions + progress record. One file, no framework. */
(function () {
  const KEY = 'ai-training-progress-v1';
  const today = () => new Date().toISOString().slice(0, 10);

  const store = {
    load() {
      try { return JSON.parse(localStorage.getItem(KEY)) || { version: 1, lessons: {}, checkpoints: {} }; }
      catch { return { version: 1, lessons: {}, checkpoints: {} }; }
    },
    save(r) { localStorage.setItem(KEY, JSON.stringify(r)); document.dispatchEvent(new CustomEvent('progress-changed')); },
    lesson(id, state) { const r = this.load(); r.lessons[id] = { state, at: today() }; this.save(r); },
    checkpoint(id, ok) {
      const r = this.load();
      const c = r.checkpoints[id] || { state: 'attempted', attempts: 0 };
      c.attempts += 1;
      if (ok) c.state = 'passed';
      r.checkpoints[id] = c; this.save(r);
    },
    skip(id) { const r = this.load(); r.checkpoints[id] = { ...(r.checkpoints[id] || { attempts: 0 }), state: 'skipped' }; this.save(r); },
  };
  window.aiTrainingProgress = store;

  const lessonEl = document.querySelector('[data-lesson]');
  const lessonId = lessonEl && lessonEl.dataset.lesson;
  const cpId = (el) => `${lessonId}#${el.closest('[data-checkpoint]').dataset.checkpoint}`;

  function feedback(el, ok, text) {
    const f = el.querySelector('.cp-feedback');
    f.textContent = text || (ok ? 'Correct.' : 'Not quite. Try again.');
    f.className = 'cp-feedback ' + (ok ? 'ok' : 'nope');
    el.classList.toggle('passed', ok);
  }

  function refreshState(el) {
    const r = store.load(); const c = r.checkpoints[cpId(el)];
    const s = el.querySelector('.cp-state');
    if (s) s.textContent = c ? `${c.state} (${c.attempts} attempt${c.attempts === 1 ? '' : 's'})` : 'not attempted';
    el.classList.toggle('passed', !!c && c.state === 'passed');
  }

  /* choice: radio inputs; data-correct on the right label; data-why on wrong ones */
  document.querySelectorAll('[data-checkpoint][data-kind=choice]').forEach((el) => {
    el.querySelector('.cp-check').addEventListener('click', () => {
      const picked = el.querySelector('input:checked');
      if (!picked) return feedback(el, false, 'Pick an answer first.');
      const ok = picked.closest('label').hasAttribute('data-correct');
      store.checkpoint(cpId(el), ok);
      feedback(el, ok, ok ? 'Correct.' : picked.closest('label').dataset.why || 'Not quite.');
      refreshState(el);
    });
  });

  /* predict: textarea; data-answer on the container, compared after whitespace normalisation */
  document.querySelectorAll('[data-checkpoint][data-kind=predict]').forEach((el) => {
    const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    el.querySelector('.cp-check').addEventListener('click', () => {
      const ok = norm(el.querySelector('textarea').value) === norm(el.dataset.answer);
      store.checkpoint(cpId(el), ok);
      feedback(el, ok, ok ? 'Correct. That is exactly what it prints.' : 'Not quite. Compare with the code once more.');
      refreshState(el);
      if (ok) el.querySelector('.cp-reveal').hidden = false;
    });
  });

  /* order: list items with data-pos giving the correct 1-based position; up/down buttons */
  document.querySelectorAll('[data-checkpoint][data-kind=order]').forEach((el) => {
    const list = el.querySelector('ol');
    const items = [...list.children];
    // shuffle deterministically-ish so it's not already in order
    items.sort(() => Math.random() - 0.5); items.forEach((li) => list.appendChild(li));
    list.querySelectorAll('li').forEach((li) => {
      const up = document.createElement('button'); up.textContent = '↑'; up.type = 'button'; up.setAttribute('aria-label', 'move up');
      const dn = document.createElement('button'); dn.textContent = '↓'; dn.type = 'button'; dn.setAttribute('aria-label', 'move down');
      up.onclick = () => li.previousElementSibling && list.insertBefore(li, li.previousElementSibling);
      dn.onclick = () => li.nextElementSibling && list.insertBefore(li.nextElementSibling, li);
      const ctl = document.createElement('span'); ctl.className = 'order-ctl'; ctl.append(up, dn); li.appendChild(ctl);
    });
    el.querySelector('.cp-check').addEventListener('click', () => {
      const ok = [...list.children].every((li, i) => Number(li.dataset.pos) === i + 1);
      store.checkpoint(cpId(el), ok);
      feedback(el, ok, ok ? 'Correct order.' : 'Not the right order yet. Think about what the loop needs before each step.');
      refreshState(el);
    });
  });

  /* skip + hint, common */
  document.querySelectorAll('[data-checkpoint]').forEach((el) => {
    const skip = el.querySelector('.cp-skip');
    if (skip) skip.addEventListener('click', () => { store.skip(cpId(el)); feedback(el, false, 'Skipped. You can come back later.'); refreshState(el); });
    const hint = el.querySelector('.cp-hint-btn');
    if (hint) hint.addEventListener('click', () => { el.querySelector('.cp-hint').hidden = false; });
    refreshState(el);
  });

  /* lesson state: read on open, finished via the recap button */
  if (lessonId) {
    const r = store.load();
    if (!r.lessons[lessonId]) store.lesson(lessonId, 'read');
    const fin = document.querySelector('[data-finish]');
    if (fin) fin.addEventListener('click', () => { store.lesson(lessonId, 'finished'); fin.textContent = 'Finished ✓'; });
  }

  /* course page: one node, shows state */
  document.querySelectorAll('[data-course-node]').forEach((el) => {
    const draw = () => {
      const r = store.load(); const l = r.lessons[el.dataset.courseNode];
      const cps = Object.entries(r.checkpoints).filter(([k]) => k.startsWith(el.dataset.courseNode + '#'));
      const total = Number(el.dataset.checkpoints || 0);
      const passed = cps.filter(([, v]) => v.state === 'passed').length;
      el.dataset.state = l ? l.state : 'untouched';
      el.querySelector('.node-state').textContent = l ? l.state : 'untouched';
      const ring = el.querySelector('.ring');
      if (ring) ring.style.setProperty('--pct', total ? Math.round((passed / total) * 100) : 0);
      const cnt = el.querySelector('.node-count'); if (cnt) cnt.textContent = `${passed}/${total} checkpoints passed`;
    };
    draw(); document.addEventListener('progress-changed', draw);
  });

  /* progress page */
  const dump = document.querySelector('[data-progress-dump]');
  if (dump) {
    const draw = () => { dump.textContent = JSON.stringify(store.load(), null, 2); };
    draw(); document.addEventListener('progress-changed', draw);
    document.querySelector('[data-export]').onclick = () => {
      const blob = new Blob([JSON.stringify(store.load(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ai-training-progress-${today()}.json`; a.click();
    };
    document.querySelector('[data-reset]').onclick = () => { if (confirm('Reset all progress?')) { localStorage.removeItem(KEY); document.dispatchEvent(new CustomEvent('progress-changed')); } };
    document.querySelector('[data-import]').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = JSON.parse(await f.text());
      if (r.version !== 1) return alert(`Cannot import version ${r.version}; this site stores version 1.`);
      if (confirm('Replace your progress with the imported file?')) store.save(r);
    };
  }
})();
