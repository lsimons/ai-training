// Spike helper v2: the learner's Claude Code is a *background session*
// (`claude --bg`) that the browser terminal attaches to (`claude attach <id>`).
// The coach reads the session's transcript JSONL instead of scraping pixels.
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

// --- security: token + origin allowlist + consent in this terminal ----------
const TOKEN = process.env.SPIKE_TOKEN || crypto.randomBytes(16).toString('hex');
const ALLOWED_ORIGINS = new Set(['https://lsimons.github.io', ...(process.env.SPIKE_ORIGINS || 'http://localhost:4321,http://localhost:4322,http://localhost:4401').split(',')]);
const SITE = process.env.SITE_URL || 'http://localhost:4322/ai-training';
const consented = new Set(); // origins the human approved in this process
let consentQueue = Promise.resolve();
function askConsent(origin) {
  if (process.env.SPIKE_AUTO_ALLOW === '1') return Promise.resolve(true); // tests only
  consentQueue = consentQueue.then(() => new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const t = setTimeout(() => { rl.close(); console.log(' (timed out, denied)'); resolve(false); }, 30000);
    rl.question(`\n>>> Page at ${origin} wants to attach to your Claude Code session. Allow? [y/N] `, (a) => {
      clearTimeout(t); rl.close(); resolve(/^y(es)?$/i.test(a.trim()));
    });
  }));
  return consentQueue;
}

const PORT = Number(process.env.PORT || 4400);
const IDLE_MS = Number(process.env.COACH_IDLE_MS || 20000);
const SHELL = process.env.SHELL || '/bin/zsh';
const CWD = process.env.SPIKE_CWD || process.cwd();
const NAME = process.env.SPIKE_NAME || 'AI training: spike/terminal'; // one session per lesson, found by name
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function cleanEnv() {
  const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };
  for (const k of Object.keys(env)) if (k.startsWith('CLAUDE')) delete env[k];
  return env;
}
const claude = (args, opts = {}) => execFileSync('claude', args, { env: cleanEnv(), cwd: CWD, encoding: 'utf8', ...opts });

// --- background session management -------------------------------------------
function findSession() {
  const list = JSON.parse(claude(['agents', '--json', '--cwd', CWD]));
  return list.find((s) => s.kind === 'background' && s.name === NAME);
}
function ensureSession() {
  let s = findSession();
  if (!s) {
    const out = claude(['--bg', '--name', NAME]);
    log('started', out.split('\n')[0].trim());
    for (let i = 0; i < 20 && !s; i++) { execFileSync('sleep', ['0.5']); s = findSession(); }
  }
  if (!s) throw new Error('could not start/find a background claude session');
  log(`background session "${s.name}" ${s.id} (${s.sessionId}) in ${s.cwd}`);
  return s;
}
// Transcript lives at ~/.claude/projects/<cwd with / -> ->/<sessionId>.jsonl
function transcriptPath(s) {
  const slug = s.cwd.replace(/[\/.]/g, '-');
  return path.join(os.homedir(), '.claude', 'projects', slug, s.sessionId + '.jsonl');
}
function readConversation(s, maxTurns = 12) {
  const p = transcriptPath(s);
  if (!fs.existsSync(p)) return [];
  const turns = [];
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    if (!line) continue;
    let l; try { l = JSON.parse(line); } catch { continue; }
    if (l.type !== 'user' && l.type !== 'assistant') continue;
    const c = l.message?.content;
    const parts = typeof c === 'string' ? [{ type: 'text', text: c }] : c || [];
    for (const b of parts) {
      if (b.type === 'text' && b.text.trim()) turns.push({ role: l.type, text: b.text.trim() });
      else if (b.type === 'tool_use') turns.push({ role: 'assistant', text: `[uses tool ${b.name}: ${JSON.stringify(b.input).slice(0, 200)}]` });
      else if (b.type === 'tool_result') turns.push({ role: 'tool', text: `[tool result: ${String(typeof b.content === 'string' ? b.content : JSON.stringify(b.content)).slice(0, 200)}]` });
    }
  }
  return turns.slice(-maxTurns);
}

// --- one browser connection = one PTY attached to the session ----------------
class Session {
  constructor(ws, bg, cols, rows) {
    this.ws = ws; this.bg = bg;
    this.screen = new xterm.Terminal({ cols, rows, allowProposedApi: true, scrollback: 50 });
    this.pty = pty.spawn(SHELL, ['-l'], { name: 'xterm-256color', cols, rows, cwd: CWD, env: cleanEnv() });
    this.pty.onData((d) => { this.screen.write(d); this.send({ type: 'out', data: d }); });
    this.pty.onExit(({ exitCode }) => { this.send({ type: 'exit', exitCode }); ws.close(); });
    // Auto-attach: the learner lands directly in the running Claude Code.
    setTimeout(() => this.pty.write(`claude attach ${bg.id}\r`), 600);
    this.lastKey = Date.now(); this.lastCoachedLen = 0; this.coaching = false;
    this.idleTimer = setInterval(() => this.maybeIdleCoach(), 5000);
    this.send({ type: 'session', id: bg.id, name: bg.name, sessionId: bg.sessionId, cwd: bg.cwd, transcript: transcriptPath(bg) });
  }
  send(m) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  screenText() {
    const b = this.screen.buffer.active, lines = [];
    for (let i = 0; i < b.length; i++) lines.push(b.getLine(i)?.translateToString(true) ?? '');
    return lines.join('\n').trim();
  }
  typeFor(text, submit = true) { this.pty.write(text); if (submit) setTimeout(() => this.pty.write('\r'), 300); }
  maybeIdleCoach() {
    if (Date.now() - this.lastKey < IDLE_MS) return;
    const conv = readConversation(this.bg);
    if (conv.length === this.lastCoachedLen) return;
    this.coach('idle');
  }
  coach(reason) {
    if (this.coaching) return;
    const conv = readConversation(this.bg);
    // Status from the CLI, so the coach knows whether Claude is mid-turn.
    let status = 'unknown'; try { status = findSession()?.status ?? 'gone'; } catch {}
    this.coaching = true; this.lastCoachedLen = conv.length;
    this.send({ type: 'coach-start', reason });
    const system = `You are a friendly coach sitting next to a learner using Claude Code for the first time.
You get the recent conversation between the learner (user) and Claude Code (assistant), plus Claude's current status.
Give ONE short, concrete tip (max 2 sentences) about how to phrase a better prompt or what to try next. Be specific to what they actually asked.
If the conversation is empty, suggest a good first prompt for this directory.
Respond with JSON only: {"tip": "...", "suggestedPrompt": "..." | null}. suggestedPrompt must be a prompt the learner could send verbatim, or null.`;
    const user = `Status: ${status}\nWorking directory: ${this.bg.cwd}\n\nConversation (${reason}):\n` +
      (conv.length ? conv.map((t) => `${t.role}: ${t.text}`).join('\n\n') : '(nothing yet)');
    const child = spawn('claude', ['-p', '--output-format', 'json', '--system-prompt', system, '--model', 'claude-haiku-4-5-20251001', user],
      { env: cleanEnv(), cwd: os.tmpdir(), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d)); child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => {
      this.coaching = false;
      try {
        const env = JSON.parse(out), m = String(env.result).match(/\{[\s\S]*\}/);
        const tip = m ? JSON.parse(m[0]) : { tip: env.result, suggestedPrompt: null };
        log('coach:', tip.tip);
        this.send({ type: 'coach', reason, ...tip, cost: env.total_cost_usd, ms: env.duration_ms, turns: conv.length, status });
      } catch (e) { log('coach failed', code, err.slice(0, 200)); this.send({ type: 'coach-error', error: e.message }); }
    });
  }
  onMessage(raw) {
    const m = JSON.parse(raw);
    switch (m.type) {
      case 'in': this.lastKey = Date.now(); this.pty.write(m.data); break;
      case 'resize': this.pty.resize(m.cols, m.rows); this.screen.resize(m.cols, m.rows); break;
      case 'type-for-me': this.lastKey = Date.now(); this.typeFor(m.text, m.submit !== false); break;
      case 'coach': this.coach('requested'); break;
      case 'screen': this.send({ type: 'screen', text: this.screenText() }); break;
      case 'conversation': this.send({ type: 'conversation', turns: readConversation(this.bg, 50) }); break;
    }
  }
  close() { clearInterval(this.idleTimer); this.pty.kill(); this.screen.dispose(); }
}

const bg = ensureSession();
const httpServer = http.createServer((req, res) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ id: bg.id, cwd: bg.cwd })); });
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
  ws.on('message', (d) => { try { s.onMessage(d.toString()); } catch (e) { log('bad msg', e.message); } });
  ws.on('close', () => { log('browser detached'); s.close(); if (active === s) active = null; });
});
httpServer.listen(PORT, '127.0.0.1', () => {
  log(`helper listening on 127.0.0.1:${PORT} · claude session ${bg.id} (stays alive after you close the page: claude stop ${bg.id})`);
  console.log(`\nOpen this URL (the token is single-process; restart the helper to rotate it):\n\n  ${SITE}/spike/terminal/?token=${TOKEN}\n`);
});
