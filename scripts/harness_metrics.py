#!/usr/bin/env python3
"""Numbers from Claude Code session transcripts, for `/harness-review` (#355).

Usage: scripts/harness_metrics.py [--since YYYY-MM-DD] [--json PATH]
                                  [--config PATH] [LABEL=]DIR ...

Each DIR is a Claude Code project directory, such as
`~/.claude/projects/<this repo>/`: one `<session>.jsonl` per main session,
and the session's subagents in `<session>/subagents/agent-*.jsonl` with a
`.meta.json` next to each that names the agent type. `LABEL=` names the
source in the tables (for example `laptop-a=~/sync/laptop-a`), and never
a machine's hostname. `--config` reads more sources from a file with one
`[LABEL=]DIR` per line, `#` for comments; the skill's config is
`~/.config/ai-training/transcript-dirs`.

The script prints Markdown tables and, with `--json`, writes the same
numbers as JSON, so every review computes them the same way:

- tokens by session, day (UTC), model and role (`main`, or the agent type);
- tool calls and the most frequent Bash commands;
- `sleep` calls and their total;
- human messages, interruptions, and the waits before each human message;
- chimes (`afplay` calls);
- the largest tool results and the most-read files.

A transcript records one assistant message as several lines, one per
content block, each with the same usage, so usage counts once per message
id. A human message is a user record whose `origin.kind` is `human`, or,
in transcripts that have no `origin`, a text message that isn't meta, a
command, a notification or an interruption.
"""

import argparse
import collections
import json
import re
import statistics
import sys
from collections.abc import Iterable, Iterator, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import cast

TOKEN_KINDS = ("input", "output", "cache_write", "cache_read")
USAGE_FIELDS = {
    "input": "input_tokens",
    "output": "output_tokens",
    "cache_write": "cache_creation_input_tokens",
    "cache_read": "cache_read_input_tokens",
}
# Commands whose second word says what they do (`git push`, `mise run`).
TWO_WORD_COMMANDS = frozenset(
    {"git", "gh", "mise", "bun", "bunx", "npx", "uv", "python", "python3", "claude-history"}
)
SLEEP = re.compile(r"(?:^|[\s;&|(])sleep\s+(\d+(?:\.\d+)?)([smh]?)(?=$|[\s;&|)])")
SLEEP_UNITS = {"": 1.0, "s": 1.0, "m": 60.0, "h": 3600.0}
ENV_ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
TOP = 15


def as_dict(value: object) -> dict[str, object]:
    """A JSON object, or an empty dict for anything else."""
    return cast("dict[str, object]", value) if isinstance(value, dict) else {}


def as_list(value: object) -> list[object]:
    """A JSON array, or an empty list for anything else."""
    return cast("list[object]", value) if isinstance(value, list) else []


def as_str(value: object) -> str:
    return value if isinstance(value, str) else ""


def as_int(value: object) -> int:
    return value if isinstance(value, int) and not isinstance(value, bool) else 0


@dataclass(frozen=True)
class Transcript:
    """One JSONL file: a main session or one of its subagents."""

    source: str
    session: str
    role: str
    path: Path

    @property
    def subagent(self) -> bool:
        return self.role != "main"


def read_config(text: str) -> list[tuple[str, Path]]:
    """The `[LABEL=]DIR` lines of a transcript config, `~` expanded."""
    sources: list[tuple[str, Path]] = []
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if line:
            sources.append(parse_source(line, len(sources) + 1))
    return sources


def parse_source(spec: str, index: int) -> tuple[str, Path]:
    """`label=dir` or `dir`, which gets the label `source-<index>`."""
    label, sep, path = spec.partition("=")
    if not sep or "/" in label or not label:
        return f"source-{index}", Path(spec).expanduser()
    return label, Path(path).expanduser()


def discover(label: str, root: Path) -> list[Transcript]:
    """Every main session and subagent transcript under a project directory."""
    found: list[Transcript] = []
    for main in sorted(root.glob("*.jsonl")):
        found.append(Transcript(label, main.stem, "main", main))
    for sub in sorted(root.glob("*/subagents/agent-*.jsonl")):
        meta_path = sub.with_suffix(".meta.json")
        role = "subagent"
        if meta_path.exists():
            try:
                meta = as_dict(json.loads(meta_path.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                meta = {}
            role = as_str(meta.get("agentType")) or role
        found.append(Transcript(label, sub.parent.parent.name, role, sub))
    return found


def records(path: Path) -> Iterator[dict[str, object]]:
    """The JSON objects of a JSONL file, skipping lines that don't parse."""
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            try:
                yield as_dict(json.loads(line))
            except json.JSONDecodeError:
                continue


def bash_key(command: str) -> str:
    """The first command of a Bash call, as one or two words (`git push`)."""
    first = re.split(r"&&|\|\||;|\||\n", command.strip(), maxsplit=1)[0]
    words = [w for w in first.split() if not ENV_ASSIGNMENT.match(w)]
    if not words:
        return "(empty)"
    head = words[0].rsplit("/", 1)[-1]
    if head in TWO_WORD_COMMANDS and len(words) > 1 and not words[1].startswith("-"):
        return f"{head} {words[1]}"
    return head


def sleep_seconds(command: str) -> list[float]:
    """The durations of the `sleep` calls in a Bash command."""
    return [float(n) * SLEEP_UNITS[unit] for n, unit in SLEEP.findall(command)]


def message_text(content: object) -> str:
    """The text of a user message's content, a string or a list of blocks."""
    if isinstance(content, str):
        return content
    parts = [as_dict(block) for block in as_list(content)]
    return "\n".join(as_str(p.get("text")) for p in parts if p.get("type") == "text")


def is_tool_result(content: object) -> bool:
    return any(as_dict(block).get("type") == "tool_result" for block in as_list(content))


def is_human(record: dict[str, object]) -> bool:
    """Whether a user record is a message the maintainer typed."""
    message = as_dict(record.get("message"))
    content = message.get("content")
    if is_tool_result(content) or record.get("isSidechain") is True:
        return False
    origin = as_dict(record.get("origin"))
    if origin:
        return origin.get("kind") == "human"
    if record.get("isMeta") is True:
        return False
    text = message_text(content).lstrip()
    return bool(text) and not text.startswith(("<", "[", "This session is being continued"))


def is_interruption(record: dict[str, object]) -> bool:
    text = message_text(as_dict(record.get("message")).get("content"))
    return text.startswith("[Request interrupted by user")


def parse_time(stamp: str) -> datetime | None:
    try:
        return datetime.fromisoformat(stamp)
    except ValueError:
        return None


def result_chars(content: object) -> int:
    """The size of a tool result, whose content is a string or text blocks."""
    if isinstance(content, str):
        return len(content)
    return sum(len(as_str(as_dict(b).get("text"))) for b in as_list(content))


def tool_label(name: str, tool_input: dict[str, object]) -> str:
    """A short label for a tool call in the largest-results table."""
    if name in {"Read", "Edit", "Write"}:
        return as_str(tool_input.get("file_path"))
    if name == "Bash":
        command = as_str(tool_input.get("command")).splitlines()
        return command[0][:80] if command else ""
    if name in {"Grep", "Glob"}:
        return as_str(tool_input.get("pattern"))[:80]
    return as_str(tool_input.get("description"))[:80]


def tokens() -> dict[str, int]:
    return dict.fromkeys(TOKEN_KINDS, 0)


def add_tokens(into: dict[str, int], usage: dict[str, int]) -> None:
    for kind in TOKEN_KINDS:
        into[kind] += usage[kind]


def total(counts: dict[str, int]) -> int:
    return sum(counts[k] for k in TOKEN_KINDS)


@dataclass
class Session:
    source: str
    session: str
    title: str = ""
    start: str = ""
    end: str = ""
    models: set[str] = field(default_factory=set[str])
    main_tokens: dict[str, int] = field(default_factory=tokens)
    sub_tokens: dict[str, int] = field(default_factory=tokens)
    subagents: int = 0
    human: int = 0
    interruptions: int = 0
    chimes: int = 0


@dataclass
class Tally:
    """Every count the report prints, filled one transcript at a time."""

    since: str = ""
    sessions: dict[tuple[str, str], Session] = field(default_factory=dict[tuple[str, str], Session])
    by_day: dict[str, dict[str, int]] = field(default_factory=dict[str, dict[str, int]])
    by_model: dict[str, dict[str, int]] = field(default_factory=dict[str, dict[str, int]])
    by_role: dict[str, dict[str, int]] = field(default_factory=dict[str, dict[str, int]])
    tools: collections.Counter[str] = field(default_factory=collections.Counter[str])
    bash: collections.Counter[str] = field(default_factory=collections.Counter[str])
    reads: collections.Counter[str] = field(default_factory=collections.Counter[str])
    sleeps: list[float] = field(default_factory=list[float])
    waits: list[float] = field(default_factory=list[float])
    results: list[dict[str, object]] = field(default_factory=list[dict[str, object]])

    def session(self, transcript: Transcript) -> Session:
        key = (transcript.source, transcript.session)
        if key not in self.sessions:
            self.sessions[key] = Session(transcript.source, transcript.session)
        return self.sessions[key]

    def add(self, transcript: Transcript) -> None:
        self.add_records(transcript, records(transcript.path))

    def add_records(self, transcript: Transcript, lines: Iterable[dict[str, object]]) -> None:
        session = self.session(transcript)
        role = self.by_role.setdefault(transcript.role, {"transcripts": 0, "turns": 0, **tokens()})
        seen_messages: set[str] = set()
        calls: dict[str, tuple[str, str]] = {}
        last_assistant: datetime | None = None
        counted_start = False
        for record in lines:
            kind = record.get("type")
            if kind == "ai-title" and not transcript.subagent:
                session.title = as_str(record.get("aiTitle"))
                continue
            stamp = as_str(record.get("timestamp"))
            if not stamp or stamp < self.since:
                continue
            day = stamp[:10]
            day_row = self.by_day.setdefault(day, {"human": 0, "subagents": 0, **tokens()})
            if not counted_start:
                counted_start = True
                role["transcripts"] += 1
                if transcript.subagent:
                    session.subagents += 1
                    day_row["subagents"] += 1
            session.start = min(session.start or stamp, stamp)
            session.end = max(session.end, stamp)
            if kind == "assistant":
                last_assistant = parse_time(stamp) or last_assistant
                self.add_assistant(transcript, session, role, day_row, record, seen_messages, calls)
            elif kind == "user":
                self.add_user(transcript, session, day_row, record, calls, stamp, last_assistant)

    def add_assistant(
        self,
        transcript: Transcript,
        session: Session,
        role: dict[str, int],
        day_row: dict[str, int],
        record: dict[str, object],
        seen: set[str],
        calls: dict[str, tuple[str, str]],
    ) -> None:
        message = as_dict(record.get("message"))
        model = as_str(message.get("model")) or "unknown"
        message_id = as_str(message.get("id")) or as_str(record.get("uuid"))
        if message_id not in seen:
            seen.add(message_id)
            raw = as_dict(message.get("usage"))
            usage = {k: as_int(raw.get(f)) for k, f in USAGE_FIELDS.items()}
            if model != "<synthetic>":
                session.models.add(model)
                model_row = self.by_model.setdefault(model, {"turns": 0, **tokens()})
                model_row["turns"] += 1
                add_tokens(model_row, usage)
            role["turns"] += 1
            add_tokens(role, usage)
            add_tokens(day_row, usage)
            add_tokens(session.sub_tokens if transcript.subagent else session.main_tokens, usage)
        for block in (as_dict(b) for b in as_list(message.get("content"))):
            if block.get("type") != "tool_use":
                continue
            call_id = as_str(block.get("id"))
            if call_id in calls:
                continue
            name = as_str(block.get("name"))
            tool_input = as_dict(block.get("input"))
            calls[call_id] = (name, tool_label(name, tool_input))
            self.tools[name] += 1
            if name == "Bash":
                command = as_str(tool_input.get("command"))
                self.bash[bash_key(command)] += 1
                self.sleeps.extend(sleep_seconds(command))
                if "afplay" in command:
                    session.chimes += 1
            elif name == "Read":
                self.reads[as_str(tool_input.get("file_path"))] += 1

    def add_user(
        self,
        transcript: Transcript,
        session: Session,
        day_row: dict[str, int],
        record: dict[str, object],
        calls: dict[str, tuple[str, str]],
        stamp: str,
        last_assistant: datetime | None,
    ) -> None:
        content = as_dict(record.get("message")).get("content")
        for block in (as_dict(b) for b in as_list(content)):
            if block.get("type") == "tool_result":
                name, label = calls.get(as_str(block.get("tool_use_id")), ("unknown", ""))
                chars = result_chars(block.get("content"))
                self.results.append(
                    {"chars": chars, "tool": name, "label": label, "session": transcript.session}
                )
        if transcript.subagent:
            return
        if is_interruption(record):
            session.interruptions += 1
        elif is_human(record):
            session.human += 1
            day_row["human"] += 1
            now = parse_time(stamp)
            if now is not None and last_assistant is not None and now >= last_assistant:
                self.waits.append((now - last_assistant).total_seconds())


def report(tally: Tally, sources: Sequence[tuple[str, Path]]) -> dict[str, object]:
    """The numbers as one JSON-ready dict."""
    sessions = sorted(
        tally.sessions.values(),
        key=lambda s: total(s.main_tokens) + total(s.sub_tokens),
        reverse=True,
    )
    grand = tokens()
    for s in sessions:
        add_tokens(grand, s.main_tokens)
        add_tokens(grand, s.sub_tokens)
    largest = sorted(tally.results, key=lambda r: as_int(r["chars"]), reverse=True)[:TOP]
    return {
        "generated": datetime.now(UTC).isoformat(timespec="seconds"),
        "since": tally.since or None,
        "sources": [{"label": label, "path": str(path)} for label, path in sources],
        "totals": {**grand, "total": total(grand)},
        "sessions": [
            {
                "source": s.source,
                "session": s.session[:8],
                "title": s.title,
                "start": s.start,
                "end": s.end,
                "models": sorted(s.models),
                "main_tokens": total(s.main_tokens),
                "sub_tokens": total(s.sub_tokens),
                "output": s.main_tokens["output"] + s.sub_tokens["output"],
                "subagents": s.subagents,
                "human": s.human,
                "interruptions": s.interruptions,
                "chimes": s.chimes,
            }
            for s in sessions
            if s.start
        ],
        "by_day": {d: {**row, "total": total(row)} for d, row in sorted(tally.by_day.items())},
        "by_model": {m: {**row, "total": total(row)} for m, row in sorted(tally.by_model.items())},
        "by_role": {r: {**row, "total": total(row)} for r, row in sorted(tally.by_role.items())},
        "tools": dict(tally.tools.most_common()),
        "bash_top": dict(tally.bash.most_common(TOP)),
        "sleep": {
            "calls": len(tally.sleeps),
            "total_hours": round(sum(tally.sleeps) / 3600, 2),
            "max_seconds": max(tally.sleeps, default=0),
        },
        "human": {
            "messages": sum(s.human for s in sessions),
            "interruptions": sum(s.interruptions for s in sessions),
            "waits": len(tally.waits),
            "wait_median_minutes": round(statistics.median(tally.waits) / 60, 1)
            if tally.waits
            else 0,
            "wait_total_hours": round(sum(tally.waits) / 3600, 2),
        },
        "chimes": sum(s.chimes for s in sessions),
        "largest_results": largest,
        "most_read": dict(tally.reads.most_common(TOP)),
    }


def millions(n: int) -> str:
    return f"{n / 1_000_000:.1f}M"


def table(headers: Sequence[str], rows: Iterable[Sequence[object]]) -> list[str]:
    lines = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    lines += ["| " + " | ".join(str(c) for c in row) + " |" for row in rows]
    return [*lines, ""]


def markdown(data: dict[str, object]) -> str:
    """The report as Markdown tables."""
    totals = cast("dict[str, int]", data["totals"])
    sleep = cast("dict[str, float]", data["sleep"])
    human = cast("dict[str, float]", data["human"])
    out = [
        "## Totals",
        "",
        f"tokens {millions(totals['total'])} (output {millions(totals['output'])}, "
        f"cache read {millions(totals['cache_read'])}); "
        f"sleep {sleep['calls']} calls, {sleep['total_hours']} h; "
        f"human messages {human['messages']}, interruptions {human['interruptions']}, "
        f"median wait {human['wait_median_minutes']} min; chimes {data['chimes']}",
        "",
        "## Sessions",
        "",
    ]
    sessions = cast("list[dict[str, object]]", data["sessions"])
    out += table(
        ["source", "session", "start", "models", "main", "sub", "subagents", "human", "title"],
        (
            [
                s["source"],
                s["session"],
                as_str(s["start"])[:16],
                ", ".join(cast("list[str]", s["models"])),
                millions(as_int(s["main_tokens"])),
                millions(as_int(s["sub_tokens"])),
                s["subagents"],
                s["human"],
                as_str(s["title"])[:50],
            ]
            for s in sessions
        ),
    )
    for heading, key, first in (
        ("By day (UTC)", "by_day", "day"),
        ("By model", "by_model", "model"),
        ("By role", "by_role", "role"),
    ):
        rows = cast("dict[str, dict[str, int]]", data[key])
        out += [f"## {heading}", ""]
        out += table(
            [first, "output", "cache read", "total"],
            (
                [name, millions(r["output"]), millions(r["cache_read"]), millions(r["total"])]
                for name, r in rows.items()
            ),
        )
    for heading, key, first in (
        ("Tool calls", "tools", "tool"),
        ("Top Bash commands", "bash_top", "command"),
        ("Most-read files", "most_read", "file"),
    ):
        counts = cast("dict[str, int]", data[key])
        out += [f"## {heading}", ""]
        out += table([first, "calls"], ([f"`{k}`", v] for k, v in counts.items()))
    out += ["## Largest tool results", ""]
    largest = cast("list[dict[str, object]]", data["largest_results"])
    out += table(
        ["chars", "tool", "session", "label"],
        ([r["chars"], r["tool"], as_str(r["session"])[:8], f"`{r['label']}`"] for r in largest),
    )
    return "\n".join(out)


def collect(sources: Sequence[tuple[str, Path]], since: str = "") -> dict[str, object]:
    """Read every transcript under the sources and return the report."""
    tally = Tally(since=since)
    for label, root in sources:
        for transcript in discover(label, root):
            tally.add(transcript)
    return report(tally, sources)


def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description="Numbers from Claude Code session transcripts.")
    parser.add_argument("dirs", nargs="*", help="[LABEL=]DIR, a Claude Code project directory")
    parser.add_argument("--since", default="", help="only records from this UTC date on")
    parser.add_argument("--json", type=Path, help="also write the numbers as JSON here")
    parser.add_argument("--config", type=Path, help="a file with one [LABEL=]DIR per line")
    args = parser.parse_args(argv)
    sources = [parse_source(spec, i + 1) for i, spec in enumerate(cast("list[str]", args.dirs))]
    config = cast("Path | None", args.config)
    if config is not None:
        if not config.exists():
            print(f"harness_metrics: no config at {config}", file=sys.stderr)
            return 2
        sources += read_config(config.read_text(encoding="utf-8"))
    if not sources:
        print("harness_metrics: name a transcript directory or --config", file=sys.stderr)
        return 2
    missing = [str(path) for _, path in sources if not path.is_dir()]
    if missing:
        print(f"harness_metrics: not a directory: {', '.join(missing)}", file=sys.stderr)
        return 2
    since = cast("str", args.since)
    if since and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", since):
        print(f"harness_metrics: --since needs YYYY-MM-DD, got {since!r}", file=sys.stderr)
        return 2
    data = collect(sources, since)
    json_path = cast("Path | None", args.json)
    if json_path is not None:
        json_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(markdown(data))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
