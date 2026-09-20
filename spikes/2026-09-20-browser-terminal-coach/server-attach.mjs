// Spike helper v2: the learner's coding agent runs as a *background session*
// that the browser terminal attaches to. The coach reads the session's
// structured transcript instead of scraping pixels.
// Agents: claude (default) via `claude --bg` / `claude attach`,
//         opencode via `opencode serve` / `opencode attach` (SPIKE_AGENT=opencode).
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';
import xterm from '@xterm/headless';
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import readline from 'node:readline';

const PORT = Number(process.env.PORT || 4400);
const IDLE_MS = Number(process.env.COACH_IDLE_MS || 20000);
const SHELL = process.env.SHELL || '/bin/zsh';
const CWD = process.env.SPIKE_CWD || process.cwd();
const AGENT = process.env.SPIKE_AGENT || 'claude';
const NAME = process.env.SPIKE_NAME || 'AI training: spike/terminal'; // one session per lesson, found by name
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanEnv() {
  const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };
  for (const k of Object.keys(env)) if (k.startsWith('CLAUDE')) delete env[k];
  return env;
}

// --- security: token + origin allowlist + consent in this terminal ----------
const TOKEN = process.env.SPIKE_TOKEN || crypto.randomBytes(16).toString('hex');
const ALLOWED_ORIGINS = new Set(['https://lsimons.github.io', ...(process.env.SPIKE_ORIGINS || 'http://localhost:4321,http://localhost:4322,http://localhost:4401').split(',')]);
const SITE = process.env.SITE_URL || 'http://localhost:4322/ai-training';
const consented = new Set();
let consentQueue = Promise.resolve();
function askConsent(origin) {
  if (process.env.SPIKE_AUTO_ALLOW === '1') return Promise.resolve(true); // tests only
  consentQueue = consentQueue.then(() => new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const t = setTimeout(() => { rl.close(); console.log(' (timed out, denied)'); resolve(false); }, 30000);
    rl.question(`\n>>> Page at ${origin} wants to attach to your ${AGENT} session. Allow? [y/N] `, (a) => {
      clearTimeout(t); rl.close(); resolve(/^y(es)?$/i.test(a.trim()));
    });
  }));
  return consentQueue;
}

// --- agent adapters ------------------------------------------------------------
// Each adapter: ensureSession() -> {id, name, cwd}, attachCommand(), readConversation(max), status(), shutdown()

const claudeAgent = {
  flags: (process.env.SPIKE_CLAUDE_FLAGS ||
    '--safe-mode --permission-mode manual --model claude-fable-5-1 --effort low --strict-mcp-config --no-chrome').split(/\s+/).filter(Boolean),
  cli(args) { return execFileSync('claude', args, { env: cleanEnv(), cwd: CWD, encoding: 'utf8' }); },
  find() { return JSON.parse(this.cli(['agents', '--json', '--cwd', CWD])).find((s) => s.kind === 'background' && s.name === NAME); },
  async ensureSession() {
    let s = this.find();
    if (!s) {
      // Controlled start: fixed model/effort, manual permissions, every customisation off.
      const out = this.cli(['--bg', '--name', NAME, ...this.flags]);
      log('started', out.split('\n')[0].trim(), '| flags:', this.flags.join(' '));
      for (let i = 0; i < 20 && !s; i++) { await sleep(500); s = this.find(); }
    }
    if (!s) throw new Error('could not start/find a background claude session');
    this.session = s;
    return { id: s.id, name: s.name, cwd: s.cwd, sessionId: s.sessionId };
  },
  attachCommand() { return `claude attach ${this.session.id}`; },
  transcriptPath() { return path.join(os.homedir(), '.claude', 'projects', this.session.cwd.replace(/[\/.]/g, '-'), this.session.sessionId + '.jsonl'); },
  readConversation(maxTurns = 12) {
    const p = this.transcriptPath();
    if (!fs.existsSync(p)) return [];
    const turns = [];
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      if (!line) continue;
      let l; try { l = JSON.parse(line); } catch { continue; }
      if (l.type !== 'user' && l.type !== 'assistant') continue;
      const c = l.message?.content;
      for (const b of typeof c === 'string' ? [{ type: 'text', text: c }] : c || []) {
        if (b.type === 'text' && b.text.trim()) turns.push({ role: l.type, text: b.text.trim() });
        else if (b.type === 'tool_use') turns.push({ role: 'assistant', text: `[uses tool ${b.name}: ${JSON.stringify(b.input).slice(0, 200)}]` });
        else if (b.type === 'tool_result') turns.push({ role: 'tool', text: `[tool result: ${String(typeof b.content === 'string' ? b.content : JSON.stringify(b.content)).slice(0, 200)}]` });
      }
    }
    return turns.slice(-maxTurns);
  },
  status() { try { return this.find()?.status ?? 'gone'; } catch { return 'unknown'; } },
  coachAsk(system, user) {
    return new Promise((resolve, reject) => {
      const child = spawn('claude', ['-p', '--output-format', 'json', '--system-prompt', system, '--model', 'claude-haiku-4-5-20251001', user],
        { env: cleanEnv(), cwd: os.tmpdir(), stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '', err = '';
      child.stdout.on('data', (d) => (out += d)); child.stderr.on('data', (d) => (err += d));
      child.on('close', () => { try { const e = JSON.parse(out); resolve({ text: String(e.result), cost: e.total_cost_usd, ms: e.duration_ms }); } catch (x) { reject(new Error(x.message + ' ' + err.slice(0, 200))); } });
    });
  },
  shutdown() {},
  stopHint() { return `claude stop ${this.session.id}`; },
};

const opencodeAgent = {
  port: Number(process.env.SPIKE_OPENCODE_PORT || 4497),
  base() { return `http://127.0.0.1:${this.port}`; },
  async api(p, init) { const r = await fetch(this.base() + p, { headers: { 'content-type': 'application/json' }, ...init }); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.json(); },
  async ensureServer() {
    try { await this.api('/session'); log(`reusing opencode server on ${this.base()}`); return; } catch {}
    // execFile-style spawn bypasses shell aliases/functions, so a plain `opencode` is fine here.
    this.server = spawn('opencode', ['serve', '--port', String(this.port)], { env: cleanEnv(), cwd: CWD, stdio: ['ignore', 'pipe', 'pipe'] });
    this.server.stderr.on('data', (d) => log('opencode:', String(d).trim()));
    this.server.on('exit', (c) => log('opencode serve exited', c));
    for (let i = 0; i < 40; i++) { await sleep(500); try { await this.api('/session'); log(`started opencode serve on ${this.base()}`); return; } catch {} }
    throw new Error('opencode serve did not come up');
  },
  async ensureSession() {
    await this.ensureServer();
    const real = fs.realpathSync(CWD);
    const all = await this.api('/session');
    let s = all.filter((x) => x.title === NAME && fs.realpathSync(x.directory) === real).sort((a, b) => b.time.updated - a.time.updated)[0];
    if (!s) { s = await this.api('/session', { method: 'POST', body: JSON.stringify({ title: NAME }) }); log('created opencode session', s.id); }
    this.session = s;
    return { id: s.id, name: s.title, cwd: s.directory, sessionId: s.id };
  },
  // `command` skips any shell alias/function called opencode (Leo's machine); harmless elsewhere.
  attachCommand() { return `command opencode attach ${this.base()} --dir ${JSON.stringify(CWD)} --session ${this.session.id}`; },
  readConversation(maxTurns = 12) { return this._conv?.slice(-maxTurns) ?? []; },
  async refresh() {
    const msgs = await this.api(`/session/${this.session.id}/message`);
    const turns = [];
    for (const m of msgs) for (const p of m.parts) {
      if (p.type === 'text' && p.text?.trim()) turns.push({ role: m.info.role, text: p.text.trim() });
      else if (p.type === 'tool') turns.push({ role: 'assistant', text: `[uses tool ${p.tool}: ${JSON.stringify(p.state?.input ?? {}).slice(0, 200)}]${p.state?.output ? ` -> ${String(p.state.output).slice(0, 200)}` : ''}` });
    }
    this._conv = turns;
    try { const st = await this.api('/session/status'); this._status = st[this.session.id]?.type ?? 'idle'; } catch { this._status = 'unknown'; }
  },
  status() { return this._status ?? 'unknown'; },
  // Coach = a second session on the same server: no tools, our system prompt,
  // the configured small model when there is one. Same login as the learner.
  async coachAsk(system, user) {
    if (!this.coachSession) {
      const all = await this.api('/session');
      this.coachSession = all.find((x) => x.title === NAME + ' (coach)') ||
        await this.api('/session', { method: 'POST', body: JSON.stringify({ title: NAME + ' (coach)' }) });
    }
    // Use the provider/model the learner's session last answered with: that is the
    // one the learner actually logged in to (/connect), so the coach shares it.
    // SPIKE_COACH_MODEL=provider/model overrides.
    let model = null;
    if (process.env.SPIKE_COACH_MODEL) { const m = process.env.SPIKE_COACH_MODEL.split('/'); model = { providerID: m[0], modelID: m.slice(1).join('/') }; }
    else {
      const last = (await this.api(`/session/${this.session.id}/message`)).filter((m) => m.info.role === 'assistant' && !m.info.error).at(-1);
      if (last?.info.providerID && last?.info.modelID) model = { providerID: last.info.providerID, modelID: last.info.modelID };
    }
    log('coach session', this.coachSession.id, 'model', model ? `${model.providerID}/${model.modelID}` : '(server default)');
    const t0 = Date.now();
    const body = { system, tools: { '*': false }, parts: [{ type: 'text', text: user }] };
    if (model) body.model = model;
    const r = await this.api(`/session/${this.coachSession.id}/message`, { method: 'POST', body: JSON.stringify(body) });
    if (r.info?.error) throw new Error(`${r.info.error.name}: ${r.info.error.data?.message ?? ''} (the coach uses the same provider/model as your last reply; if you have not sent a prompt yet, send one first or set SPIKE_COACH_MODEL)`);
    return { text: r.parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n'), cost: r.info.cost, ms: Date.now() - t0 };
  },
  shutdown() { if (this.server) { log('stopping opencode serve'); this.server.kill(); } },
  stopHint() { return this.server ? 'the opencode server stops with this helper' : `opencode server on ${this.base()} was already running; left alone`; },
};

const agent = AGENT === 'opencode' ? opencodeAgent : claudeAgent;

// --- one browser connection = one PTY attached to the session ----------------
class Session {
  constructor(ws, bg, cols, rows) {
    this.ws = ws; this.bg = bg;
    this.screen = new xterm.Terminal({ cols, rows, allowProposedApi: true, scrollback: 50 });
    this.pty = pty.spawn(SHELL, ['-l'], { name: 'xterm-256color', cols, rows, cwd: CWD, env: cleanEnv() });
    this.pty.onData((d) => { this.screen.write(d); this.send({ type: 'out', data: d }); });
    this.pty.onExit(({ exitCode }) => { this.send({ type: 'exit', exitCode }); ws.close(); });
    setTimeout(() => this.pty.write(agent.attachCommand() + '\r'), 600);
    this.lastKey = Date.now(); this.lastCoachedLen = 0; this.coaching = false; this.typing = null;
    this.idleTimer = setInterval(() => this.maybeIdleCoach(), 5000);
    this.send({ type: 'session', agent: AGENT, id: bg.id, name: bg.name, cwd: bg.cwd });
  }
  send(m) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  screenText() {
    const b = this.screen.buffer.active, lines = [];
    for (let i = 0; i < b.length; i++) lines.push(b.getLine(i)?.translateToString(true) ?? '');
    return lines.join('\n').trim();
  }
  // Perceived-as-typing: one character at a time, ~23ms with jitter, a beat
  // longer after spaces and punctuation. A real keystroke cancels it.
  typeFor(text, submit = true) {
    this.cancelTyping();
    const chars = [...text]; let i = 0;
    const step = () => {
      if (i >= chars.length) { this.typing = null; if (submit) this.pty.write('\r'); return; }
      const ch = chars[i++]; this.pty.write(ch);
      const pause = 15 + Math.random() * 16 + (ch === ' ' ? 20 : /[.,;:!?]/.test(ch) ? 60 : 0);
      this.typing = setTimeout(step, pause);
    };
    step();
  }
  cancelTyping() { if (this.typing) { clearTimeout(this.typing); this.typing = null; } }
  async conversation(max) { if (agent.refresh) await agent.refresh(); return agent.readConversation(max); }
  async maybeIdleCoach() {
    if (Date.now() - this.lastKey < IDLE_MS || this.coaching) return;
    const conv = await this.conversation();
    if (conv.length === this.lastCoachedLen) return;
    this.coach('idle', conv);
  }
  async coach(reason, conv) {
    if (this.coaching) return;
    this.coaching = true;
    conv = conv ?? await this.conversation();
    const status = agent.status();
    this.lastCoachedLen = conv.length;
    this.send({ type: 'coach-start', reason });
    const tool = AGENT === 'opencode' ? 'opencode' : 'Claude Code';
    const system = `You are a friendly coach sitting next to a learner using ${tool} (a terminal coding agent) for the first time.
You get the recent conversation between the learner (user) and the agent (assistant), plus the agent's current status.
Give ONE short, concrete tip (max 2 sentences) about how to phrase a better prompt or what to try next. Be specific to what they actually asked.
If the conversation is empty, suggest a good first prompt for this directory.
Respond with JSON only: {"tip": "...", "suggestedPrompt": "..." | null}. suggestedPrompt must be a prompt the learner could send verbatim, or null.`;
    const user = `Status: ${status}\nWorking directory: ${this.bg.cwd}\n\nConversation (${reason}):\n` +
      (conv.length ? conv.map((t) => `${t.role}: ${t.text}`).join('\n\n') : '(nothing yet)');
    try {
      const r = await agent.coachAsk(system, user);
      const m = r.text.match(/\{[\s\S]*\}/);
      const tip = m ? JSON.parse(m[0]) : { tip: r.text, suggestedPrompt: null };
      log('coach:', tip.tip);
      this.send({ type: 'coach', reason, ...tip, cost: r.cost, ms: r.ms, turns: conv.length, status });
    } catch (e) { log('coach failed:', e.message); this.send({ type: 'coach-error', error: e.message }); }
    finally { this.coaching = false; }
  }
  async onMessage(raw) {
    const m = JSON.parse(raw);
    switch (m.type) {
      case 'in':
        // Terminal replies to queries (cursor position, DA, focus events) arrive here too and start with ESC; only real keys cancel.
        if (!m.data.startsWith('\x1b')) { this.lastKey = Date.now(); this.cancelTyping(); }
        this.pty.write(m.data); break;
      case 'resize': this.pty.resize(m.cols, m.rows); this.screen.resize(m.cols, m.rows); break;
      case 'type-for-me': this.lastKey = Date.now(); this.typeFor(m.text, m.submit !== false); break;
      case 'coach': this.coach('requested'); break;
      case 'screen': this.send({ type: 'screen', text: this.screenText() }); break;
      case 'conversation': this.send({ type: 'conversation', turns: await this.conversation(50) }); break;
    }
  }
  close() { this.cancelTyping(); clearInterval(this.idleTimer); this.pty.kill(); this.screen.dispose(); }
}

const bg = await agent.ensureSession();
log(`${AGENT} session "${bg.name}" ${bg.id} in ${bg.cwd}`);
const httpServer = http.createServer((req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ agent: AGENT, id: bg.id, cwd: bg.cwd })); });
const wss = new WebSocketServer({ server: httpServer, path: '/term' });
let active = null; // one browser session at a time
wss.on('connection', async (ws, req) => {
  const u = new URL(req.url, 'http://x');
  const origin = req.headers.origin || '(none)';
  if (u.searchParams.get('token') !== TOKEN) { log('rejected: bad token from', origin); return ws.close(4001, 'bad token'); }
  if (!ALLOWED_ORIGINS.has(origin)) { log('rejected: origin not allowed:', origin); return ws.close(4003, 'origin not allowed: ' + origin); }
  if (!consented.has(origin)) {
    if (!(await askConsent(origin))) { log('denied by user:', origin); return ws.close(4003, 'denied in helper terminal'); }
    consented.add(origin); log('allowed:', origin);
  }
  if (ws.readyState !== 1) return;
  if (active) { log('replacing previous browser session'); active.ws.close(4009, 'replaced by a new tab'); }
  const s = new Session(ws, bg, Number(u.searchParams.get('cols') || 100), Number(u.searchParams.get('rows') || 30));
  active = s; s.send({ type: 'ready' });
  log('browser attached, pty', s.pty.pid);
  ws.on('message', (d) => { s.onMessage(d.toString()).catch((e) => log('bad msg', e.message)); });
  ws.on('close', () => { log('browser detached'); s.close(); if (active === s) active = null; });
});
httpServer.listen(PORT, '127.0.0.1', () => {
  log(`helper listening on 127.0.0.1:${PORT} · ${AGENT} session ${bg.id} (${agent.stopHint()})`);
  console.log(`\nOpen this URL (the token is single-process; restart the helper to rotate it):\n\n  ${SITE}/spike/terminal/?token=${TOKEN}\n`);
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { agent.shutdown(); process.exit(0); });
