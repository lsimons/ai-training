---
title: "Spike: live terminal with a coach"
tableOfContents: false
---

This page is a throwaway experiment. It attaches to a **background Claude Code
session** on your machine through a local helper (`node server-attach.mjs` in
`spikes/2026-09-20-browser-terminal-coach/`). The helper prints a URL with a
token and asks for permission in its own terminal the first time a page connects.
A second Claude reads the session transcript and offers tips in the panel below
the terminal.

<div class="not-content" id="spike-term-root">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css" />
  <style>
    /* Widen this page only: hide the right rail's reserved space. */
    :root:has(#spike-term-root) { --sl-content-width: 96rem; }
    :root:has(#spike-term-root) .right-sidebar-container { display: none; }
    #spike-term-toolbar { display: flex; gap: .5rem; margin: .5rem 0; flex-wrap: wrap; align-items: center; }
    #spike-term-toolbar button, #spike-term-toolbar select { padding: .35rem .8rem; cursor: pointer; font: inherit; font-size: .9em; }
    #spike-term-status { font-size: .85em; opacity: .75; margin-left: auto; }
    #spike-term-session { font-size: .85em; opacity: .75; }
    #spike-layout { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 1rem; align-items: start; }
    @media (max-width: 72rem) { #spike-layout { grid-template-columns: 1fr; } }
    #spike-term { height: 70vh; min-height: 480px; border-radius: 8px; padding: 8px 0 0 8px; box-sizing: border-box; }
    #spike-term .xterm { height: 100%; }
    /* macOS overlay scrollbars float over the last text column; Claude Code manages its own scroll region anyway. */
    #spike-term .xterm-viewport { scrollbar-width: none; }
    #spike-term .xterm-viewport::-webkit-scrollbar { display: none; }
    #spike-term-wrap { position: relative; }
    #spike-consent {
      position: absolute; inset: 0; display: none; align-items: center; justify-content: center; border-radius: 8px;
      background: rgba(0,0,0,.72); color: #fff; text-align: center; padding: 2rem; font-size: 1.1em; line-height: 1.5;
    }
    #spike-consent.show { display: flex; }
    #spike-consent kbd { background: #fff; color: #000; padding: .1em .5em; border-radius: 4px; font-weight: 700; }
    #spike-term.light { background: #ffffff; border: 1px solid #ddd; }
    #spike-term.dark { background: #1e1e1e; }
    #spike-coach {
      position: sticky; top: 5rem; padding: .8rem 1rem; border-radius: 8px; max-height: 70vh; overflow: auto;
      background: var(--sl-color-gray-6); border-left: 4px solid var(--sl-color-accent); font-size: .95em;
    }
    #spike-coach .empty { opacity: .6; font-style: italic; }
    #spike-coach .entry { padding-bottom: .6rem; margin-bottom: .6rem; border-bottom: 1px solid var(--sl-color-gray-5); }
    #spike-coach .entry:last-child { border-bottom: 0; }
    #spike-coach .entry.old { opacity: .55; }
    #spike-coach .who { font-weight: 700; font-size: .8em; text-transform: uppercase; letter-spacing: .05em; color: var(--sl-color-accent); }
    #spike-coach .tip { margin: .3rem 0; }
    #spike-coach .prompt { font-family: var(--__sl-font-mono); font-size: .9em; opacity: .85; margin: .3rem 0; }
    #spike-coach button { margin-right: .5rem; font: inherit; font-size: .85em; padding: .3rem .7rem; cursor: pointer; }
    #spike-token { display: none; gap: .5rem; align-items: center; margin: .5rem 0; }
    #spike-token.show { display: flex; }
    #spike-token input { font: inherit; padding: .3rem; width: 24rem; }
    #spike-screen-dump { max-height: 240px; overflow: auto; font-size: .75em; margin-top: .75rem; }
  </style>
  <div id="spike-token"><label>Token from the helper's terminal: <input id="spike-token-input" placeholder="paste token" /></label><button id="btn-token">Connect</button></div>
  <div id="spike-term-toolbar">
    <button id="btn-type">Type for me</button>
    <button id="btn-coach">Ask the coach</button>
    <button id="btn-conv">Show conversation</button>
    <button id="btn-screen">Dump screen</button>
    <select id="sel-theme" title="Terminal colours"><option value="auto">Auto</option><option value="light">Light</option><option value="dark">Dark</option></select>
    <span id="spike-term-session"></span>
    <span id="spike-term-status">connecting…</span>
  </div>
  <div id="spike-layout">
    <div id="spike-term-wrap">
      <div id="spike-term"></div>
      <div id="spike-consent"><div>🔐 <b>Waiting for your permission.</b><br />Switch to the terminal where the helper is running and answer <kbd>y</kbd> to let this page attach to your Claude Code session.<br /><small>It denies automatically after 30 seconds.</small></div></div>
    </div>
    <aside id="spike-coach"><div class="who">Coach</div><div id="spike-coach-entries"><div class="empty">Waiting: ask, or pause for 20 seconds after a reply.</div></div></aside>
  </div>
  <pre id="spike-screen-dump" hidden></pre>
  <script type="module">
    import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm';
    import { FitAddon } from 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/+esm';
    const $ = (id) => document.getElementById(id);
    const status = $('spike-term-status');
    // --- token: from ?token= / #token=, else sessionStorage, else ask -------
    const params = new URLSearchParams(location.search + '&' + location.hash.slice(1));
    let token = params.get('token') || sessionStorage.getItem('spike-token');
    if (params.get('token')) { sessionStorage.setItem('spike-token', token); history.replaceState(null, '', location.pathname); }
    // --- themes ---------------------------------------------------------------
    const THEMES = {
      light: { background: '#ffffff', foreground: '#1a1a1a', cursor: '#d35400', cursorAccent: '#fff', selectionBackground: '#cde3ff',
        black: '#000000', red: '#c0392b', green: '#1e7e34', yellow: '#9a6700', blue: '#0b5ed7', magenta: '#8e44ad', cyan: '#0e7490', white: '#555555',
        brightBlack: '#666666', brightRed: '#e74c3c', brightGreen: '#27ae60', brightYellow: '#b7791f', brightBlue: '#2980b9', brightMagenta: '#9b59b6', brightCyan: '#0891b2', brightWhite: '#1a1a1a' },
      dark: { background: '#1e1e1e', foreground: '#e6e6e6', cursor: '#ffcc00', selectionBackground: '#3a5a8a' },
    };
    const term = new Terminal({ fontSize: 15, lineHeight: 1.15, cursorBlink: true, allowProposedApi: true, minimumContrastRatio: 4.5, scrollback: 2000 });
    const fit = new FitAddon(); term.loadAddon(fit);
    term.open($('spike-term'));
    const siteTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    function applyTheme(choice) {
      const t = choice === 'auto' ? siteTheme() : choice;
      term.options.theme = THEMES[t]; $('spike-term').className = t; localStorage.setItem('spike-term-theme', choice); $('sel-theme').value = choice;
    }
    applyTheme(localStorage.getItem('spike-term-theme') || 'auto');
    $('sel-theme').onchange = (e) => applyTheme(e.target.value);
    new MutationObserver(() => $('sel-theme').value === 'auto' && applyTheme('auto')).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    fit.fit();
    // --- connection -----------------------------------------------------------
    let ws, suggested = null;
    const send = (m) => ws && ws.readyState === 1 && ws.send(JSON.stringify(m));
    function connect() {
      if (!token) { $('spike-token').classList.add('show'); status.textContent = 'needs token'; return; }
      status.textContent = 'connecting…';
      ws = new WebSocket('ws://127.0.0.1:4400/term?cols=' + term.cols + '&rows=' + term.rows + '&token=' + encodeURIComponent(token));
      ws.onopen = () => { status.textContent = 'waiting for permission in the helper terminal…'; $('spike-consent').classList.add('show'); };
      ws.onclose = (e) => { $('spike-consent').classList.remove('show'); status.textContent = 'disconnected: ' + (e.reason || 'is the helper running on :4400?'); if (e.code === 4001) { sessionStorage.removeItem('spike-token'); token = null; $('spike-token').classList.add('show'); } };
      ws.onerror = () => (status.textContent = 'cannot reach helper on :4400');
      ws.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.type === 'out') term.write(m.data);
        else if (m.type === 'ready') { status.textContent = 'attached'; $('spike-token').classList.remove('show'); $('spike-consent').classList.remove('show'); term.focus(); }
        else if (m.type === 'session') { $('spike-term-session').textContent = '“' + m.name + '” (' + m.id + ') · ' + m.cwd.replace(/^\/Users\/[^/]+/, '~'); window.__session = m; }
        else if (m.type === 'coach-start') status.textContent = 'coach is reading (' + m.reason + ')…';
        else if (m.type === 'coach') { status.textContent = 'coach: ' + Math.round(m.ms / 1000) + 's, $' + (m.cost ?? 0).toFixed(3) + ', ' + m.turns + ' turns'; showCoach(m); window.__lastCoach = m; }
        else if (m.type === 'coach-error') status.textContent = 'coach error: ' + m.error;
        else if (m.type === 'screen') dump(m.text, 'lastScreen');
        else if (m.type === 'conversation') dump(m.turns.map((t) => t.role + ': ' + t.text).join('\n\n'), 'lastConv', m.turns);
        else if (m.type === 'exit') status.textContent = 'shell exited (' + m.exitCode + ')';
      };
    }
    function dump(text, key, val) { const p = $('spike-screen-dump'); p.hidden = false; p.textContent = text; window['__' + key] = val ?? text; }
    term.onData((d) => send({ type: 'in', data: d }));
    new ResizeObserver(() => { fit.fit(); send({ type: 'resize', cols: term.cols, rows: term.rows }); }).observe($('spike-term-wrap'));
    $('btn-token').onclick = () => { token = $('spike-token-input').value.trim(); sessionStorage.setItem('spike-token', token); connect(); };
    connect();
    // --- coach panel (docked, never covers the terminal) ----------------------
    // Typing never presses Enter: the learner reads the prompt and sends it.
    const typeFor = (text) => { send({ type: 'type-for-me', text, submit: false }); term.focus(); };
    const entries = $('spike-coach-entries');
    function showCoach(m) {
      entries.querySelector('.empty')?.remove();
      for (const e of entries.children) e.classList.add('old');
      suggested = m.suggestedPrompt || null;
      const e = document.createElement('div'); e.className = 'entry';
      const tip = document.createElement('div'); tip.className = 'tip'; tip.textContent = m.tip; e.append(tip);
      if (suggested) {
        const p = document.createElement('div'); p.className = 'prompt'; p.textContent = '❯ ' + suggested; e.append(p);
        const b = document.createElement('button'); b.textContent = 'Type this prompt for me'; b.onclick = () => typeFor(suggested); e.append(b);
      }
      entries.prepend(e);
    }
    $('btn-type').onclick = () => typeFor(suggested || 'Explain in two sentences what this directory is for. Do not change any files.');
    $('btn-coach').onclick = () => send({ type: 'coach' });
    $('btn-conv').onclick = () => send({ type: 'conversation' });
    $('btn-screen').onclick = () => send({ type: 'screen' });
    window.__spike = { term, send };
  </script>
</div>
