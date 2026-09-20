# 2026-09-20 Spike: Browser terminal running Claude Code, with a coaching Claude

A lesson page in the Starlight site embeds a real terminal that connects to the
learner's local shell, runs `claude`, and a second Claude watches the screen and
offers prompting tips as HTML overlays. It can also type on the learner's behalf.

## Hypothesis

A local helper process (Node + node-pty + WebSocket) plus xterm.js in the
Starlight page is enough to (a) run interactive Claude Code inside a lesson
page, (b) let the page read the terminal screen reliably enough that a second
`claude -p` call can produce a useful coaching tip, and (c) let the page inject
keystrokes so the lesson can "type" a prompt for the learner.

## Problem statement

Lessons about using Claude Code are much better if the learner practices in the
real tool while the lesson watches, comments, and demonstrates. We want to know
whether a browser-embedded terminal bridged to the local machine is feasible
without building something heavy, and what the sharp edges are.

## Validation plan

1. `bun run start` in the spike dir starts the helper; `mise run docs-dev`
   serves the site; open `/ai-training/spike/terminal/` and see a live zsh.
2. Type `claude`, see the Claude Code TUI render correctly in xterm.js and
   accept keyboard input.
3. Press "Type for me" in the page; a prompt gets typed into Claude Code.
4. Press "Ask the coach" (and/or wait for the idle trigger); a tip derived from
   the actual screen content appears as an overlay.
5. Automate 1-4 with Playwright (`bun run check`) and save a screenshot.

## References

- `docs/spec/S03-lesson-authoring.md` (widgets live in `not-content` containers)
- `docs/astro.config.mjs` (base path `/ai-training`)
- Sibling spike `spikes/2026-09-20-release-1-slice/` for the spike layout

## Implementation

Three pieces, all throwaway:

- [`server.mjs`](./server.mjs): local helper on `127.0.0.1:4400`. Per WebSocket
  connection it spawns the user's login shell in a PTY (`node-pty`), streams
  bytes both ways, and feeds the same bytes into a **server-side headless
  xterm** (`@xterm/headless`) so it always has a rendered screen to scrape.
  Messages: `in` (keystrokes), `resize`, `type-for-me` (inject text + Enter),
  `coach` (run the coach now), `screen` (return plain-text screen). The coach
  is `claude -p --output-format json` (Haiku 4.5) with a system prompt that
  asks for one tip and an optional verbatim `suggestedPrompt`. It also fires
  automatically after 20s of no keystrokes if the screen changed.
- [`../../docs/src/content/docs/spike/terminal.md`](../../docs/src/content/docs/spike/terminal.md):
  a Starlight page at `/ai-training/spike/terminal/`. xterm.js + fit addon
  from a CDN inside a `not-content` div, a toolbar (Type for me / Ask the coach
  / Dump screen), a speech-bubble overlay for the tip with a "Use this prompt"
  button that types the suggestion, and a bobbing 👉 pointer at the terminal
  input line.
- [`check.mjs`](./check.mjs): Playwright driver that opens the page, waits for
  the shell, runs `claude` in `/tmp/spike-learner`, accepts the trust dialog,
  clicks "Type for me", waits for the answer, clicks "Ask the coach", and
  saves [`claude-running.png`](./claude-running.png) and
  [`coach-tip.png`](./coach-tip.png).

The helper strips every `CLAUDE*` env var from the PTY and coach environment
so `claude` can be launched even when the helper itself was started from
inside a Claude Code session.

### How to run

```sh
cd spikes/2026-09-20-browser-terminal-coach
bun install
chmod +x node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper  # bun drops the exec bit
node server.mjs &                       # helper on :4400
(cd ../../docs && bun run dev)          # Astro 7 dev server; note the port it prints (4401 here)
open http://localhost:4401/ai-training/spike/terminal/
SPIKE_URL=http://localhost:4401/ai-training/spike/terminal/ node check.mjs   # automated run
```

`claude` must be installed and logged in. Stop with `kill %1` and
`bunx astro dev stop` in `docs/`.

## Validation result

All five steps passed in the automated run (`node check.mjs`):

1. Live zsh appeared in the page within ~2s of load.
2. `claude` started in `/tmp/spike-learner`; the TUI (banner, input box,
   status bar, auto-mode line) rendered correctly in xterm.js and the
   server-side headless xterm scrape matched what the browser showed.
3. "Type for me" injected `Explain in two sentences what this directory is for...`; Claude Code listed the directory and answered in ~9s.
4. "Ask the coach" returned in 4-13s at $0.02-0.04 per call. The tips were
   grounded in the actual screen. First run (accidentally still on the trust
   dialog): *"You're in Claude Code's security prompt, select 'Yes, I trust this
   folder' to continue..."*. Second run (after an answer): *"Claude can build
   and code, not just explain, try asking it to create files..."* with a
   `suggestedPrompt` the learner could accept with one click.
5. Screenshots saved. The tip bubble was below the fold in the first
   `coach-tip.png`; `check.mjs` now takes a full-page screenshot.

One bug found and fixed along the way: pressing Enter on the trust dialog
selects the default "No, exit", so the injected prompt landed in zsh
(`command not found: Explain`). The driver now presses ↓ first. The coach
diagnosed this exact state correctly, which is a nice accidental demo.

## Round 2: attach to a background session

After Leo tried round 1, the spike moved to `claude --bg` + `claude attach`:

- [`server-attach.mjs`](./server-attach.mjs) replaces `server.mjs`. On start it
  finds or starts a background Claude Code session named
  `AI training: spike/terminal` in the working directory (`claude --bg --name`,
  looked up via `claude agents --json --cwd`). Each browser connection gets a
  zsh PTY that auto-runs `claude attach <id>`, so the learner lands inside the
  running session and re-attaches to the same conversation after a reload.
- The coach no longer scrapes the screen. It reads the session transcript at
  `~/.claude/projects/<cwd-slug>/<sessionId>.jsonl` (user/assistant text,
  tool_use, tool_result) plus the live `status` from `claude agents --json`.
  Input quality is far better: no ANSI, collapsed tool calls visible, and it
  knows if Claude is mid-turn. The format is undocumented and may change.
- Security minimum bar implemented: per-process random token in the URL the
  helper prints (`?token=`, stripped from the address bar, kept in
  sessionStorage), `Origin` allowlist (`https://lsimons.github.io` + localhost
  dev ports), a `[y/N]` consent prompt in the helper's own terminal per origin
  (30s timeout, deny by default; `SPIKE_AUTO_ALLOW=1` bypasses it for tests
  only), and one browser session at a time. Verified: bad token closes with
  4001, foreign origin with 4003, allowed origin gets `ready`.
- UI: light/dark/auto terminal theme following Starlight's `data-theme`,
  15px font, 70vh terminal, right rail hidden via `tableOfContents: false` +
  a `:root:has(#spike-term-root)` rule, sidebar entry under "Spikes", docked
  coach panel below the terminal (no floating bubble, no pointer), and
  "Type for me" / "Type this prompt for me" never send Enter.
- "Type for me" still goes through the PTY. There is no CLI verb to send a
  prompt to a background session from outside; `attach` is the only input.
- [`check-attach.mjs`](./check-attach.mjs) and [`check-ui.mjs`](./check-ui.mjs)
  drive both rounds; screenshots `attach-coach.png`, `ui-light-coach.png`,
  `ui-dark.png`.

Run round 2 (from the repo root so the session lands there):

```sh
node spikes/2026-09-20-browser-terminal-coach/server-attach.mjs   # foreground: it will ask [y/N]
(cd docs && bun run dev)                                           # then open the URL the helper printed
claude stop <id>                                                   # the session outlives the page
```

Round 3 (variance control + layout): sessions now start with
`--safe-mode --permission-mode manual --model claude-fable-5-1 --effort low --strict-mcp-config --no-chrome` (override with `SPIKE_CLAUDE_FLAGS`). Safe mode
disables CLAUDE.md, skills, plugins, hooks, MCP and agents, and Claude Code says
so in a banner the learner sees. Manual mode means every tool call asks, which
is what a first-time learner should experience and what the coach can comment
on. The coach panel moved to a sticky column right of the terminal, keeps a
history with older tips dimmed, and the terminal narrows to ~82 columns at
1440px, which Claude Code handles fine. Other flags reviewed and not used:
`--restricted` (removes Bash entirely, too much for a Claude Code lesson),
`--bare` (also skips auth keychain reads), `--disable-slash-commands`
(learners should meet `/help`), `--append-system-prompt` (tempting for lesson
framing; left for a later spike), `--max-budget-usd` (worth adding for
learners on their own keys).

Round 4 (opencode): the helper now has two agent adapters. `SPIKE_AGENT=opencode`
starts `opencode serve --port 4497` (or reuses one), creates/finds a session
titled `AI training: spike/terminal` in the working directory via the server's
HTTP API, and the browser terminal runs
`command opencode attach http://127.0.0.1:4497 --dir <cwd> --session <id>`.
The coach reads `GET /session/{id}/message` (roles + text/tool parts) and
`GET /session/status`, a documented API rather than Claude's on-disk JSONL.
The server also exposes `prompt_async`, so opencode could receive prompts
without keystrokes; not used because the learner should press Enter. Login is
the learner's business (`/connect`, provider auth); the helper does not touch
it. `command opencode` is used in the PTY to bypass shell aliases/functions.
Verified with `ui-opencode.png`: TUI attached, typed prompt visible in the
API, coach tip produced. `?port=` in the page URL overrides the helper port.

Round 5 (coach follows the agent): each adapter now has `coachAsk(system, user)`. Claude keeps `claude -p` (Haiku). opencode uses a **second session on
the same server**, titled `AI training: spike/terminal (coach)`, called via the
synchronous `POST /session/{id}/message` with `system`, `tools: {"*": false}`
and the configured `small_model`. Same login as the learner, so a provider
that is not connected fails visibly: the error now shows in the coach panel
with a hint to run `/connect`. Verified in claude mode (tip in 8s, $0.014) and
in opencode mode (coach session created, 403 from the unauthenticated provider
rendered in the panel; `ui-opencode-coach.png`).

Gotcha found: blank lines inside the widget's `<div>` end the Markdown HTML
block and the rest of the script renders as a code figure. Keep widget blocks
free of blank lines.

## Lessons learned

**Hypothesis confirmed.** A ~150-line helper plus a CDN xterm.js is enough for
a real, interactive Claude Code inside a lesson page, with screen scraping,
prompt injection, and an LLM coach. Specific takeaways:

- **Scrape on the server, not in the browser.** Feeding the PTY stream into
  `@xterm/headless` gives a stable rendered screen for free; regex-stripping
  raw ANSI would not survive Claude Code's constant redraws. The coach only
  ever needs `translateToString()` of the visible buffer.
- **A cheap model is a fine coach.** Haiku 4.5 via `claude -p` gave relevant,
  state-aware tips from a screen dump alone. Cost is a few cents per tip, but
  latency of 4-13s means the coach should be idle-triggered or on-demand, not
  per keystroke. The idle trigger (20s, only if the screen changed) felt right.
- **Prompt injection is trivial but needs pacing.** Writing text then `\r`
  300ms later works; a single burst can be treated as a paste. Anything that
  types for the learner must check the screen state first (see the trust
  dialog bug), which argues for a small state classifier before injecting.
- **Nested Claude Code is fine once `CLAUDE*` env vars are removed.** Both the
  learner's `claude` in the PTY and the coach's `claude -p` ran from a helper
  started inside a Claude Code session.
- **Distribution is the real problem, not tech.** The page only works with a
  helper on `127.0.0.1:4400`. For lsimons.github.io this means a `npx`/`bunx`
  one-liner the learner runs first, an origin allowlist on the WebSocket
  (currently none: any page on any origin can drive the learner's shell), and
  a token in the URL. This must be hardened before anything beyond a spike.
- **Astro 7 dev is a background daemon.** `bun run dev --port X` ignored the
  port and reused the running daemon on 4401; use `bunx astro dev status`.
- **bun install drops the exec bit on node-pty's `spawn-helper`**
  (`posix_spawnp failed`). One `chmod +x` fixes it; a real setup needs a
  postinstall or a different package manager.
- **Overlays are easy, precise pointing is not.** xterm.js exposes the cursor
  position (`term.buffer.active.cursorY`) so a pointer at the input line is
  doable; pointing at arbitrary TUI elements would need pattern matching on
  the scraped screen, which is the same information the coach already has.

**Attach beats scrape.** Round 2 showed the background session is the right unit: it survives page reloads, has a stable id and name, its transcript is structured, and both the learner's terminal and the coach are just clients of it. The risk is coupling to internal file formats; a supported transcript or events API would remove it.

**Two agents, one shape.** Both Claude Code and opencode fit the same adapter contract (ensure session, attach command, read conversation, status). opencode's HTTP server is the nicer integration surface; Claude Code's equivalent would be a supported transcript/events API.

Not tested: multiple concurrent sessions, Windows, terminal resize under
Claude Code, and whether the coach can *see* tool-call detail that is collapsed
in the TUI (it cannot; `ctrl+o` expansion would need to be driven too).
