/* Widget: next-token sampling with temperature over a tiny fixed distribution. */
(function () {
  const el = document.getElementById('sampler'); if (!el) return;
  const logits = { ' mat': 2.0, ' sofa': 1.2, ' roof': 0.6, ' moon': -0.5, ' spreadsheet': -1.5 };
  const temp = el.querySelector('input[type=range]'); const out = el.querySelector('.bars'); const gen = el.querySelector('.gen'); const btn = el.querySelector('button');
  function probs(T) {
    const t = Math.max(Number(T), 0.05);
    const ex = Object.fromEntries(Object.entries(logits).map(([k, v]) => [k, Math.exp(v / t)]));
    const z = Object.values(ex).reduce((a, b) => a + b, 0);
    return Object.fromEntries(Object.entries(ex).map(([k, v]) => [k, v / z]));
  }
  function draw() {
    const p = probs(temp.value); el.querySelector('.tval').textContent = Number(temp.value).toFixed(2);
    out.innerHTML = Object.entries(p).map(([k, v]) => `<div class="bar"><span class="tok">${k}</span><span class="fill" style="width:${(v * 100).toFixed(1)}%"></span><span class="pct">${(v * 100).toFixed(1)}%</span></div>`).join('');
  }
  btn.onclick = () => {
    const p = probs(temp.value); let r = Math.random(); let pick = ' mat';
    for (const [k, v] of Object.entries(p)) { r -= v; if (r <= 0) { pick = k; break; } }
    gen.textContent = 'The cat sat on the' + pick + '.';
  };
  temp.oninput = draw; draw();
})();
