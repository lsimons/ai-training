// Spike helper: bridges a local PTY to the browser over WebSocket, keeps a
// server-side headless xterm as the "scraped screen", and runs a coaching
// `claude -p` over that screen on demand or when the learner goes idle.
import { WebSocketServer } from 'ws';
import * as pty from 'node-pty';
import xterm from '@xterm/headless';
import { SerializeAddon } from '@xterm/addon-serialize';
import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = Number(process.env.PORT || 4400);
const IDLE_MS = Number(process.env.COACH_IDLE_MS || 20000);
const SHELL = process.env.SHELL || '/bin/zsh';

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// Allow running `claude` inside the pty even if this helper was started from a
// Claude Code session (nested-session guard reads these).
function ptyEnv() {
  const env = { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' };
  for (const k of Object.keys(env)) if (k.startsWith('CLAUDE')) delete env[k];
  return env;
}

class Session {
  constructor(ws, cols, rows) {
    this.ws = ws;
    this.screen = new xterm.Terminal({ cols, rows, allowProposedApi: true, scrollback: 200 });
    this.serializer = new SerializeAddon();
    this.screen.loadAddon(this.serializer);
    this.pty = pty.spawn(SHELL, ['-l'], { name: 'xterm-256color', cols, rows, cwd: process.env.SPIKE_CWD || process.cwd(), env: ptyEnv() });
    this.pty.onData((d) => {
      this.screen.write(d);
      this.send({ type: 'out', data: d });
    });
    this.pty.onExit(({ exitCode }) => { this.send({ type: 'exit', exitCode }); ws.close(); });
    this.lastKey = Date.now();
    this.lastCoached = '';
    this.coaching = false;
    this.idleTimer = setInterval(() => this.maybeIdleCoach(), 5000);
  }
  send(msg) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(msg)); }
  // Plain-text screen (ANSI stripped) is what the coach reads.
  screenText() {
    const buf = this.screen.buffer.active;
    const lines = [];
    for (let i = 0; i < buf.length; i++) lines.push(buf.getLine(i)?.translateToString(true) ?? '');
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  // "Typing on the learner's behalf": write text, then Enter after a beat so
  // Claude Code's input box sees a complete line rather than a paste burst.
  typeFor(text, submit = true) {
    this.pty.write(text);
    if (submit) setTimeout(() => this.pty.write('\r'), 300);
  }
  maybeIdleCoach() {
    if (Date.now() - this.lastKey < IDLE_MS) return;
    const s = this.screenText();
    if (s === this.lastCoached || !s) return;
    this.coach('idle');
  }
  coach(reason) {
    if (this.coaching) return;
    const screen = this.screenText();
    this.coaching = true;
    this.lastCoached = screen;
    this.send({ type: 'coach-start', reason });
    const system = `You are a friendly coach sitting next to a learner who is using Claude Code in a terminal for the first time.
You see a plain-text dump of their terminal screen. Give ONE short, concrete tip (max 2 sentences) about what they could do or ask next, or how to phrase a better prompt.
If the screen shows a plain shell prompt and Claude Code is not running, suggest typing \`claude\`.
Respond with JSON only: {"tip": "...", "suggestedPrompt": "..." | null}. suggestedPrompt is a prompt the learner could send to Claude Code verbatim, or null.`;
    const child = spawn('claude', ['-p', '--output-format', 'json', '--system-prompt', system, '--model', 'claude-haiku-4-5-20251001', `Terminal screen (${reason}):\n\n${screen}`],
      { env: ptyEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('close', (code) => {
      this.coaching = false;
      try {
        const env = JSON.parse(out);
        const m = String(env.result).match(/\{[\s\S]*\}/);
        const tip = m ? JSON.parse(m[0]) : { tip: env.result, suggestedPrompt: null };
        log('coach:', tip.tip);
        this.send({ type: 'coach', reason, ...tip, cost: env.total_cost_usd, ms: env.duration_ms });
      } catch (e) {
        log('coach failed', code, err.slice(0, 300), out.slice(0, 300));
        this.send({ type: 'coach-error', error: `${e.message} ${err.slice(0, 200)}` });
      }
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
    }
  }
  close() { clearInterval(this.idleTimer); this.pty.kill(); this.screen.dispose(); }
}

const httpServer = http.createServer((req, res) => {
  res.setHeader('content-type', 'text/plain');
  res.end('spike terminal helper: connect via ws://localhost:' + PORT + '/term?cols=..&rows=..\n');
});
const wss = new WebSocketServer({ server: httpServer, path: '/term' });
wss.on('connection', (ws, req) => {
  const u = new URL(req.url, 'http://x');
  const s = new Session(ws, Number(u.searchParams.get('cols') || 100), Number(u.searchParams.get('rows') || 30));
  log('session open', s.pty.pid);
  ws.on('message', (d) => { try { s.onMessage(d.toString()); } catch (e) { log('bad msg', e.message); } });
  ws.on('close', () => { log('session close'); s.close(); });
});
httpServer.listen(PORT, '127.0.0.1', () => log(`helper listening on http://127.0.0.1:${PORT}`));
