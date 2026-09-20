---
title: "Spike: live terminal with a coach"
---

This page is a throwaway experiment. It embeds your **real local shell** via a
helper process running on your machine (`bun run start` in
`spikes/2026-09-20-browser-terminal-coach/`). Type `claude` in the terminal
below to start Claude Code. A second Claude watches the screen and drops tips
on top.

<div class="not-content" id="spike-term-root">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css" />
  <style>
    #spike-term-root { position: relative; }
    #spike-term-toolbar { display: flex; gap: .5rem; margin: .5rem 0; flex-wrap: wrap; align-items: center; }
    #spike-term-toolbar button { padding: .3rem .7rem; cursor: pointer; }
    #spike-term-status { font-size: .85em; opacity: .7; margin-left: auto; }
    #spike-term { height: 520px; border-radius: 6px; overflow: hidden; background: #000; }
    #spike-coach {
      position: absolute; right: 1rem; bottom: 4rem; max-width: 22rem;
      background: #fff8e1; color: #222; border: 2px solid #f0b429; border-radius: 12px;
      padding: .8rem 1rem; box-shadow: 0 6px 24px rgba(0,0,0,.35); font-size: .95em;
      opacity: 0; transform: translateY(12px); transition: all .3s ease; pointer-events: none;
    }
    #spike-coach.show { opacity: 1; transform: none; pointer-events: auto; }
    #spike-coach::after { content: ""; position: absolute; left: -14px; bottom: 12px; border: 7px solid transparent; border-right-color: #f0b429; }
    #spike-coach .who { font-weight: 700; font-size: .8em; text-transform: uppercase; letter-spacing: .05em; color: #a06a00; }
    #spike-coach button { margin-top: .5rem; font-size: .85em; }
    #spike-pointer { position: absolute; font-size: 2.2rem; pointer-events: none; opacity: 0; transition: opacity .3s; animation: bob 1s infinite alternate; }
    #spike-pointer.show { opacity: 1; }
    @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-8px); } }
  </style>
  <div id="spike-term-toolbar">
    <button id="btn-type">Type for me</button>
    <button id="btn-coach">Ask the coach</button>
    <button id="btn-screen">Dump screen</button>
    <span id="spike-term-status">connecting…</span>
  </div>
  <div id="spike-term"></div>
  <div id="spike-pointer">👉</div>
  <div id="spike-coach"><div class="who">Coach</div><div class="tip"></div><button class="use" hidden>Use this prompt</button></div>
  <pre id="spike-screen-dump" hidden style="max-height: 200px; overflow: auto; font-size: .7em;"></pre>
  <script type="module">
    import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm';
    import { FitAddon } from 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/+esm';
    const HELPER = 'ws://127.0.0.1:4400/term';
    const status = document.getElementById('spike-term-status');
    const term = new Terminal({ fontSize: 13, cursorBlink: true, allowProposedApi: true, theme: { background: '#000' } });
    const fit = new FitAddon(); term.loadAddon(fit);
    term.open(document.getElementById('spike-term')); fit.fit();
    const ws = new WebSocket(HELPER + '?cols=' + term.cols + '&rows=' + term.rows);
    const send = (m) => ws.readyState === 1 && ws.send(JSON.stringify(m));
    ws.onopen = () => { status.textContent = 'connected to local shell'; term.focus(); };
    ws.onclose = () => (status.textContent = 'disconnected (is the helper running on :4400?)');
    ws.onerror = () => (status.textContent = 'cannot reach helper on :4400');
    term.onData((d) => send({ type: 'in', data: d }));
    new ResizeObserver(() => { fit.fit(); send({ type: 'resize', cols: term.cols, rows: term.rows }); }).observe(document.getElementById('spike-term'));
    const coach = document.getElementById('spike-coach'), tipEl = coach.querySelector('.tip'), useBtn = coach.querySelector('.use');
    const pointer = document.getElementById('spike-pointer');
    let suggested = null, hideTimer;
    function showCoach(html, prompt) {
      tipEl.innerHTML = html; suggested = prompt; useBtn.hidden = !prompt; coach.classList.add('show');
      clearTimeout(hideTimer); hideTimer = setTimeout(() => coach.classList.remove('show'), 25000);
      // Point at the terminal's cursor row, roughly: bottom-left of the terminal box.
      const box = document.getElementById('spike-term').getBoundingClientRect(), root = document.getElementById('spike-term-root').getBoundingClientRect();
      pointer.style.left = (box.left - root.left + 8) + 'px';
      pointer.style.top = (box.bottom - root.top - 48) + 'px';
      pointer.classList.add('show'); setTimeout(() => pointer.classList.remove('show'), 4000);
    }
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === 'out') term.write(m.data);
      else if (m.type === 'coach-start') status.textContent = 'coach is looking (' + m.reason + ')…';
      else if (m.type === 'coach') { status.textContent = 'coach tip in ' + Math.round(m.ms/1000) + 's, $' + (m.cost ?? 0).toFixed(3); showCoach(m.tip, m.suggestedPrompt); window.__lastCoach = m; }
      else if (m.type === 'coach-error') { status.textContent = 'coach error: ' + m.error; }
      else if (m.type === 'screen') { const p = document.getElementById('spike-screen-dump'); p.hidden = false; p.textContent = m.text; window.__lastScreen = m.text; }
      else if (m.type === 'exit') status.textContent = 'shell exited (' + m.exitCode + ')';
    };
    document.getElementById('btn-coach').onclick = () => send({ type: 'coach' });
    document.getElementById('btn-screen').onclick = () => send({ type: 'screen' });
    document.getElementById('btn-type').onclick = () => send({ type: 'type-for-me', text: suggested || 'Explain in two sentences what this directory is for. Do not change any files.' });
    useBtn.onclick = () => { send({ type: 'type-for-me', text: suggested }); coach.classList.remove('show'); };
    window.__spike = { term, send };
  </script>
</div>
