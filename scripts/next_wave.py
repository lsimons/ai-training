#!/usr/bin/env python3
"""The wave picker (`mise run next-wave`, docs/agents/meta-orchestration.md,
"The loop", step 1): which issues the next wave of builders should take on.

Usage: mise run next-wave -- [--size N] [--kind lessons|content]
       [--only N,N,...] [--unblockers-first] [--json]

`main` reads the lessons of this checkout from `bun scripts/lesson-plan.mjs`
in site/ (the picker's one boundary with the site, #492) and every open
issue from `gh issue list`, then prints the wave as markdown or, with
`--json`, as JSON. The functions between are pure, so tests/test_next_wave.py
can feed them planted lessons and issues. The output is byte-identical to
the JavaScript tool this replaces (#492).

Two kinds of wave. A `lessons` wave (the default) picks planned lessons. A
lesson is a candidate when its plan file names an `issue`, it has no page
yet, and that issue is ready and unassigned. It is blocked when it assumes
an objective that no live lesson serves. A plan file's `assumes` entries
only name the objective, and the builder fills in the `lesson` and
`section` that teach it when the page goes live. The build
(`mise run site-build`, through MarkdownContent.astro) rejects a page
whose `assumes` names a lesson without a page, so a wave that includes
such a lesson can't land. An `after` entry that is still planned does not
block. It is reported per lesson as ordering advice for the wave lead.
Each candidate carries `unblocks`, the number of blocked candidates whose
missing objectives it serves (direct only, no transitive closure). With
`--unblockers-first`, an area's candidates sort by that count descending
ahead of course position, so `concepts/agent-loop` comes before an
earlier lesson that unblocks nothing. The planned `after` rule still
comes first: a candidate whose own `after` is not live waits behind
the ones with none, whatever its count, since that `after` names the
lesson the plan wants written before it. Without the flag the count is
reported and the order stays earliest-in-course.

A `content` wave picks the ready, unassigned issues with the `content`
label that no plan file claims as its lesson issue, in ascending issue
number, with no dependency logic. An issue that also has the `code`
label is included and marked, so the lead can give it a code review too.
A nits issue (title starting `Nits` or `Cosmetic nits`) is left out, since
the dispatcher adds those to a wave as the nits row.

`only` narrows either kind to a set of issue numbers. Everything else is
reported as skipped with the reason `not in --only`, and every listed
number that did not make the wave is reported under `notPicked` with the
reason, so an unattended run never drops a number silently. `open_issues`
(every open issue number) tells `no such open issue` from
`not ready-for-agent`, and defaults to the ready issues when absent.
"""

import json
import math
import re
import subprocess
import sys
from collections.abc import Callable, Iterable, Sequence
from pathlib import Path
from typing import Literal, NoReturn, NotRequired, TypedDict, cast

REPO = "lsimons/ai-training"
SITE = Path(__file__).resolve().parent.parent / "site"

# The skipped reason `--only` gives. `format_wave` groups these on one line.
NOT_IN_ONLY = "not in --only"

# A nits issue by title, the marker the dispatcher and `/wave` use (the repo
# has no nits label). re.ASCII keeps `\b` and IGNORECASE to ASCII letters, as
# the JavaScript `/^(nits|cosmetic nits)\b/i` did. Use it with `match`.
NITS_TITLE = re.compile(r"(nits|cosmetic nits)\b", re.ASCII | re.IGNORECASE)

# The command-line values, matched whole with `fullmatch`.
POSITIVE_INTEGER = re.compile(r"[1-9][0-9]*", re.ASCII)
ISSUE_LIST = re.compile(r"[1-9][0-9]*(,[1-9][0-9]*)*", re.ASCII)

# A lone UTF-16 surrogate, which JSON.stringify writes as a `\uXXXX` escape.
LONE_SURROGATE = re.compile("[\ud800-\udfff]")

type Kind = Literal["lessons", "content"]


class PlannedLesson(TypedDict):
    """One lesson as `bun scripts/lesson-plan.mjs` prints it."""

    id: str
    area: str
    title: object
    issue: int | None
    position: int | None
    after: list[str]
    assumes: list[str]
    serves: list[str]
    live: bool


class ReadyIssue(TypedDict):
    number: int
    title: str
    assignees: list[str]
    labels: list[str]


class WaveEntry(TypedDict):
    issue: int
    id: str
    title: object
    area: str
    position: int | None
    afterPlanned: list[str]
    # The blocked candidates this lesson serves a missing objective of.
    unblocks: int


class Blocker(TypedDict):
    """An assumed objective and the planned lessons that serve it."""

    objective: str
    servedBy: list[str]


class BlockedEntry(TypedDict):
    issue: int
    id: str
    blockedBy: list[Blocker]


class SkippedEntry(TypedDict):
    issue: int
    # The lesson id. A content issue has none.
    id: NotRequired[str]
    reason: str


class WaitingArea(TypedDict):
    area: str
    lessons: list[WaveEntry]


class NotPickedEntry(TypedDict):
    """A number from `only` that is not in the wave, and why."""

    issue: int
    reason: str


class LessonsWave(TypedDict):
    kind: Literal["lessons"]
    size: int
    only: list[int] | None
    unblockersFirst: bool
    wave: list[WaveEntry]
    blocked: list[BlockedEntry]
    skipped: list[SkippedEntry]
    waiting: list[WaitingArea]
    notPicked: list[NotPickedEntry]


class ContentEntry(TypedDict):
    issue: int
    title: str
    labels: list[str]


class ContentWave(TypedDict):
    kind: Literal["content"]
    size: int
    only: list[int] | None
    wave: list[ContentEntry]
    skipped: list[SkippedEntry]
    waiting: list[ContentEntry]
    notPicked: list[NotPickedEntry]


type Wave = LessonsWave | ContentWave


class Args(TypedDict):
    size: int
    kind: Kind
    only: list[int] | None
    unblockersFirst: bool
    json: bool


def pick_wave(
    lessons: Sequence[PlannedLesson],
    ready_issues: Sequence[ReadyIssue],
    open_issues: Iterable[int] | None = None,
    size: int = 6,
    kind: str = "lessons",
    only: Iterable[int] | None = None,
    unblockers_first: bool = False,
) -> Wave:
    """Pick the next wave of the given `kind`."""
    if kind == "content":
        return pick_content_wave(lessons, ready_issues, open_issues, size, only)
    if kind != "lessons":
        raise ValueError(f"next-wave: unknown kind {json.dumps(kind, ensure_ascii=False)}")
    return pick_lessons_wave(lessons, ready_issues, open_issues, size, only, unblockers_first)


def pick_lessons_wave(
    lessons: Sequence[PlannedLesson],
    ready_issues: Sequence[ReadyIssue],
    open_issues: Iterable[int] | None = None,
    size: int = 6,
    only: Iterable[int] | None = None,
    unblockers_first: bool = False,
) -> LessonsWave:
    """Pick the next lessons wave.

    Within an area, candidates with no planned `after` come first, then
    course position (a lesson no course lists has position `None` and sorts
    last). With `unblockers_first`, the `unblocks` count (descending) sits
    between the two, so the planned `after` rule still comes first and
    course position breaks a tie on the count. The wave takes one lesson per
    area in turn, in area order, until `size` is reached or the areas run
    out, so every area gets progress. Every candidate ends up in exactly one
    of the four lists: `wave`, `blocked` (it assumes an objective no live
    lesson serves), `skipped` (the issue is not ready, is assigned, or is
    not in `only`) or `waiting` (fit for a wave, but this one is full),
    grouped by area.
    """
    live = {lesson["id"] for lesson in lessons if lesson["live"]}
    ready = {i["number"]: i for i in ready_issues}
    open_set = set(open_issues if open_issues is not None else ready)
    only_list = list(only) if only is not None else None
    only_set = set(only_list) if only_list is not None else None
    # Planned lesson issue to its lesson id, live pages included.
    planned_issues: dict[int, str] = {}

    # Objectives some live lesson serves, and objective to the planned lessons that serve it.
    served_live: set[str] = set()
    served_planned: dict[str, list[str]] = {}
    for lesson in lessons:
        for objective in lesson["serves"]:
            if lesson["live"]:
                served_live.add(objective)
            else:
                served_planned.setdefault(objective, []).append(lesson["id"])

    # Candidates per area, in area order.
    per_area: dict[str, list[WaveEntry]] = {}
    # Candidate lesson id to the objectives it serves, for the `unblocks` count.
    candidate_serves: dict[str, list[str]] = {}
    blocked: list[BlockedEntry] = []
    skipped: list[SkippedEntry] = []

    for lesson in lessons:
        candidates = per_area.setdefault(lesson["area"], [])
        number = lesson["issue"]
        lesson_id = lesson["id"]
        if number is None:
            continue
        planned_issues[number] = lesson_id
        if lesson["live"]:
            continue
        if only_set is not None and number not in only_set:
            skipped.append({"issue": number, "id": lesson_id, "reason": NOT_IN_ONLY})
            continue
        issue = ready.get(number)
        if issue is None:
            skipped.append(
                {"issue": number, "id": lesson_id, "reason": "issue is not ready-for-agent"}
            )
            continue
        if issue["assignees"]:
            reason = f"issue is assigned to {', '.join(issue['assignees'])}"
            skipped.append({"issue": number, "id": lesson_id, "reason": reason})
            continue
        blocked_by: list[Blocker] = [
            {"objective": o, "servedBy": list(served_planned.get(o, []))}
            for o in dict.fromkeys(lesson["assumes"])
            if o not in served_live
        ]
        if blocked_by:
            blocked.append({"issue": number, "id": lesson_id, "blockedBy": blocked_by})
            continue
        candidate_serves[lesson_id] = lesson["serves"]
        candidates.append(
            {
                "issue": number,
                "id": lesson_id,
                "title": lesson["title"] if lesson["title"] is not None else issue["title"],
                "area": lesson["area"],
                "position": lesson["position"],
                "afterPlanned": [x for x in lesson["after"] if x not in live],
                "unblocks": 0,
            }
        )

    # The blocked list is complete only after every area, so the count and the sort come here.
    def sort_key(c: WaveEntry) -> tuple[int, int, float]:
        has_after = 1 if c["afterPlanned"] else 0
        score = -c["unblocks"] if unblockers_first else 0
        rank = c["position"] if c["position"] is not None else math.inf
        return (has_after, score, rank)

    for candidates in per_area.values():
        for c in candidates:
            serves = set(candidate_serves[c["id"]])
            c["unblocks"] = sum(
                1 for b in blocked if any(x["objective"] in serves for x in b["blockedBy"])
            )
        candidates.sort(key=sort_key)

    wave: list[WaveEntry] = []
    taken = True
    while len(wave) < size and taken:
        taken = False
        for candidates in per_area.values():
            if len(wave) >= size:
                break
            if not candidates:
                continue
            wave.append(candidates.pop(0))
            taken = True
    waiting: list[WaitingArea] = [
        {"area": area, "lessons": candidates} for area, candidates in per_area.items() if candidates
    ]

    not_picked: list[NotPickedEntry] = []
    in_wave = {w["issue"] for w in wave}
    for n in only_list or []:
        if n in in_wave:
            continue
        lesson_id = planned_issues.get(n)
        b = next((x for x in blocked if x["issue"] == n), None)
        s = next((x for x in skipped if x["issue"] == n), None)
        if lesson_id is None:
            reason = (
                "not a planned lesson (use --kind content)"
                if n in open_set
                else "no such open issue"
            )
        elif lesson_id in live:
            reason = f"lesson {lesson_id} is live"
        elif b is not None:
            reason = f"blocked by {blocked_by_text(b)}"
        elif s is not None:
            reason = (
                "assigned" if s["reason"].startswith("issue is assigned") else "not ready-for-agent"
            )
        else:
            reason = "waiting (wave full)"
        not_picked.append({"issue": n, "reason": reason})
    return {
        "kind": "lessons",
        "size": size,
        "only": only_list,
        "unblockersFirst": unblockers_first,
        "wave": wave,
        "blocked": blocked,
        "skipped": skipped,
        "waiting": waiting,
        "notPicked": not_picked,
    }


def blocked_by_text(b: BlockedEntry) -> str:
    """The lessons that serve a blocked lesson's missing objectives.

    When no lesson serves them, the objectives themselves.
    """
    lessons = list(dict.fromkeys(lesson for x in b["blockedBy"] for lesson in x["servedBy"]))
    if lessons:
        return ", ".join(lessons)
    objectives = ", ".join(x["objective"] for x in b["blockedBy"])
    return f"objective {objectives} (no lesson serves it)"


def pick_content_wave(
    lessons: Sequence[PlannedLesson],
    ready_issues: Sequence[ReadyIssue],
    open_issues: Iterable[int] | None = None,
    size: int = 6,
    only: Iterable[int] | None = None,
) -> ContentWave:
    """Pick the next content wave.

    Ready, unassigned `content` issues that no plan file names as its
    `issue`, by ascending number. The first `size` are the wave and the rest
    wait. An assigned issue, or one outside `only`, is skipped with the reason.
    """
    ready = {i["number"]: i for i in ready_issues}
    open_set = set(open_issues if open_issues is not None else ready)
    only_list = list(only) if only is not None else None
    only_set = set(only_list) if only_list is not None else None
    planned = {lesson["issue"] for lesson in lessons if lesson["issue"] is not None}
    skipped: list[SkippedEntry] = []
    candidates: list[ContentEntry] = []
    for i in sorted(ready_issues, key=lambda x: x["number"]):
        labels = i["labels"]
        if "content" not in labels or i["number"] in planned or NITS_TITLE.match(i["title"]):
            continue
        if only_set is not None and i["number"] not in only_set:
            skipped.append({"issue": i["number"], "reason": NOT_IN_ONLY})
            continue
        if i["assignees"]:
            reason = f"issue is assigned to {', '.join(i['assignees'])}"
            skipped.append({"issue": i["number"], "reason": reason})
            continue
        candidates.append({"issue": i["number"], "title": i["title"], "labels": labels})
    wave = candidates[:size]
    waiting = candidates[size:]
    in_wave = {w["issue"] for w in wave}
    not_picked: list[NotPickedEntry] = []
    for n in only_list or []:
        if n in in_wave:
            continue
        issue = ready.get(n)
        if n not in open_set:
            reason = "no such open issue"
        elif issue is None:
            reason = "not ready-for-agent"
        elif n in planned:
            reason = "a planned lesson (use --kind lessons)"
        elif "content" not in issue["labels"]:
            reason = "not a content issue"
        elif NITS_TITLE.match(issue["title"]):
            reason = "a nits issue (the dispatcher adds it as the nits row)"
        elif issue["assignees"]:
            reason = "assigned"
        else:
            reason = "waiting (wave full)"
        not_picked.append({"issue": n, "reason": reason})
    return {
        "kind": "content",
        "size": size,
        "only": only_list,
        "wave": wave,
        "skipped": skipped,
        "waiting": waiting,
        "notPicked": not_picked,
    }


def code(s: str) -> str:
    return f"`{s}`"


def skipped_lines(skipped: Sequence[SkippedEntry]) -> list[str]:
    """The skipped list as markdown lines.

    The `not in --only` entries are one line of issue numbers, since a
    whitelist skips nearly everything.
    """
    lines: list[str] = []
    not_in_only = [s for s in skipped if s["reason"] == NOT_IN_ONLY]
    if not_in_only:
        lines.append(f"- {NOT_IN_ONLY}: {' '.join(f'#{s["issue"]}' for s in not_in_only)}")
    for s in skipped:
        if s["reason"] == NOT_IN_ONLY:
            continue
        lesson_id = s.get("id")
        suffix = f" {code(lesson_id)}" if lesson_id else ""
        lines.append(f"- #{s['issue']}{suffix}: {s['reason']}")
    return lines


def format_wave(result: Wave) -> str:
    """The result as markdown.

    A lessons wave is a table (with an `Unblocks` column under
    `unblockersFirst`), then the blocked, skipped and waiting lists. A
    content wave is a table of issue, title and labels, then the skipped and
    waiting lists. Lesson ids are in code spans, so cspell skips them.
    """
    if result["kind"] == "content":
        return format_content_wave(result)
    lines = [f"## Wave ({len(result['wave'])} of {result['size']})", ""]
    unblocks = result["unblockersFirst"]
    lines.append(
        f"| Issue | Lesson | Course position | Planned `after` |{' Unblocks |' if unblocks else ''}"
    )
    lines.append(
        f"| ----- | ------ | --------------- | --------------- |{' -------- |' if unblocks else ''}"
    )
    for w in result["wave"]:
        position = (
            f"{w['area']} (unlisted)" if w["position"] is None else f"{w['area']} {w['position']}"
        )
        after = ", ".join(code(x) for x in w["afterPlanned"]) or "-"
        count = f" {w['unblocks']} |" if unblocks else ""
        lines.append(f"| #{w['issue']} | {code(w['id'])} | {position} | {after} |{count}")
    lines += ["", f"## Blocked ({len(result['blocked'])})", ""]
    for b in result["blocked"]:
        why = [
            f"{code(x['objective'])} ("
            + (
                f"served by {', '.join(code(s) for s in x['servedBy'])}"
                if x["servedBy"]
                else "no lesson serves it"
            )
            + ")"
            for x in b["blockedBy"]
        ]
        lines.append(f"- #{b['issue']} {code(b['id'])}: assumes {'; '.join(why)}")
    lines += ["", f"## Skipped ({len(result['skipped'])})", "", *skipped_lines(result["skipped"])]
    count = sum(len(w["lessons"]) for w in result["waiting"])
    lines += ["", f"## Waiting for a later wave ({count})", ""]
    for w in result["waiting"]:
        lines.append(f"- {w['area']}: {' '.join(f'#{x["issue"]}' for x in w['lessons'])}")
    lines += not_picked_lines(result)
    return "\n".join(lines) + "\n"


def not_picked_lines(result: Wave) -> list[str]:
    """The `Not picked from --only` section, present whenever `only` was given."""
    if result["only"] is None:
        return []
    lines = ["", f"## Not picked from --only ({len(result['notPicked'])})", ""]
    for n in result["notPicked"]:
        lines.append(f"- #{n['issue']}: {n['reason']}")
    return lines


def format_content_wave(result: ContentWave) -> str:
    lines = [f"## Wave ({len(result['wave'])} of {result['size']}, content)", ""]
    lines += ["| Issue | Title | Labels |", "| ----- | ----- | ------ |"]
    for w in result["wave"]:
        labels = ", ".join(code(label) for label in w["labels"])
        title = w["title"].replace("|", "\\|")
        lines.append(f"| #{w['issue']} | {title} | {labels} |")
    lines += ["", f"## Skipped ({len(result['skipped'])})", "", *skipped_lines(result["skipped"])]
    lines += ["", f"## Waiting for a later wave ({len(result['waiting'])})", ""]
    for w in result["waiting"]:
        lines.append(f"- #{w['issue']} {w['title']}")
    lines += not_picked_lines(result)
    return "\n".join(lines) + "\n"


def _quote(raw: str) -> str:
    """`JSON.stringify` of a command-line string, as the JavaScript tool's errors wrote it."""
    return json.dumps(raw, ensure_ascii=False)


def parse_args(argv: Sequence[str]) -> Args | str:
    """The options from the command line, or an error message.

    `--size N` (default 6, a positive integer in plain digits), `--kind`
    (`lessons`, the default, or `content`), `--only N,N,...` (issue numbers,
    the whitelist), `--unblockers-first` (rank a lesson that unblocks other
    candidates ahead of the course order within its area) and `--json`. A
    flag that takes a value and comes last gets the empty string.
    """
    args: Args = {
        "size": 6,
        "kind": "lessons",
        "only": None,
        "unblockersFirst": False,
        "json": False,
    }
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--json":
            args["json"] = True
        elif arg == "--unblockers-first":
            args["unblockersFirst"] = True
        elif arg in ("--size", "--kind", "--only"):
            i += 1
            raw = argv[i] if i < len(argv) else ""
            if arg == "--size":
                if not POSITIVE_INTEGER.fullmatch(raw):
                    return f"next-wave: --size needs a positive integer, got {_quote(raw)}"
                args["size"] = int(raw)
            elif arg == "--kind":
                if raw not in ("lessons", "content"):
                    return f"next-wave: --kind is lessons or content, got {_quote(raw)}"
                args["kind"] = raw
            else:
                if not ISSUE_LIST.fullmatch(raw):
                    return (
                        "next-wave: --only needs issue numbers separated by commas,"
                        f" got {_quote(raw)}"
                    )
                args["only"] = [int(n) for n in raw.split(",")]
        else:
            return f"next-wave: unknown argument {arg}"
        i += 1
    return args


def run(command: Sequence[str], cwd: Path | None = None) -> str:
    """The stdout of a command, or exit 1 with the command named. Its stderr goes to ours."""
    try:
        result = subprocess.run(
            list(command),
            cwd=cwd,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            check=False,
        )
    except OSError as e:
        reason = (
            f'Executable not found in $PATH: "{command[0]}"'
            if isinstance(e, FileNotFoundError)
            else str(e)
        )
        fail(command, reason)
    if result.returncode != 0:
        fail(command, f"Command failed: {' '.join(command)}")
    return result.stdout.decode("utf-8", errors="replace")


def fail(command: Sequence[str], reason: str) -> NoReturn:
    """Exit 1 with one line that names the command.

    A `gh` command is named by its first three words (`gh issue list`), as
    the JavaScript tool named it, and the reason repeats it in full.
    """
    name = " ".join(command[:3]) if command[0] == "gh" else " ".join(command)
    print(f"next-wave: {name} failed: {reason}", file=sys.stderr)
    sys.exit(1)


def _strings(value: object) -> list[str]:
    return (
        [x for x in cast("list[object]", value) if isinstance(x, str)]
        if isinstance(value, list)
        else []
    )


def parse_lesson_plan(output: str) -> list[PlannedLesson]:
    """The lessons from `bun scripts/lesson-plan.mjs` output."""
    data = cast("dict[str, object]", json.loads(output))
    lessons: list[PlannedLesson] = []
    for raw in cast("list[dict[str, object]]", data["lessons"]):
        issue = raw["issue"]
        position = raw["position"]
        lessons.append(
            {
                "id": cast("str", raw["id"]),
                "area": cast("str", raw["area"]),
                "title": raw["title"],
                "issue": issue if isinstance(issue, int) else None,
                "position": position if isinstance(position, int) else None,
                "after": _strings(raw["after"]),
                "assumes": _strings(raw["assumes"]),
                "serves": _strings(raw["serves"]),
                "live": raw["live"] is True,
            }
        )
    return lessons


def parse_issues(output: str) -> list[ReadyIssue]:
    """The issues from `gh issue list --json number,title,assignees,labels` output,
    with assignees as login names and labels as names."""
    issues: list[ReadyIssue] = []
    for raw in cast("list[dict[str, object]]", json.loads(output)):
        assignees = cast("list[dict[str, str]]", raw.get("assignees") or [])
        labels = cast("list[dict[str, str]]", raw.get("labels") or [])
        issues.append(
            {
                "number": cast("int", raw["number"]),
                "title": cast("str", raw["title"]),
                "assignees": [a["login"] for a in assignees],
                "labels": [label["name"] for label in labels],
            }
        )
    return issues


LESSON_PLAN = ["bun", "scripts/lesson-plan.mjs"]
ISSUE_LIST_COMMAND = [
    "gh",
    "issue",
    "list",
    "-R",
    REPO,
    "-s",
    "open",
    "-L",
    "1000",
    "--json",
    "number,title,assignees,labels",
]


def read_json[T](command: Sequence[str], parse: Callable[[str], T], cwd: Path | None = None) -> T:
    """The parsed output of a command, or exit 1 when it isn't what `parse` expects."""
    output = run(command, cwd)
    try:
        return parse(output)
    except (ValueError, KeyError, TypeError, AttributeError) as e:
        fail(command, f"unreadable output: {e!r}")


def to_json(value: object) -> str:
    """`JSON.stringify(value, null, 2)` and a newline, as the JavaScript tool printed.

    Non-ASCII characters stay as they are, and a lone surrogate becomes a
    `\\uXXXX` escape again, as JavaScript's well-formed JSON.stringify writes it.
    """
    text = json.dumps(value, indent=2, ensure_ascii=False)
    return LONE_SURROGATE.sub(lambda m: f"\\u{ord(m.group()):04x}", text) + "\n"


def to_markdown(result: Wave) -> str:
    """`format_wave`, with a lone surrogate (from a `\\ud800` escape in an
    issue title) as U+FFFD, which is what JavaScript's `process.stdout.write`
    wrote for it. UTF-8 can't encode a lone surrogate.
    """
    return LONE_SURROGATE.sub("\ufffd", format_wave(result))


def main(argv: Sequence[str]) -> int:
    args = parse_args(argv)
    if isinstance(args, str):
        print(args, file=sys.stderr)
        return 2
    lessons = read_json(LESSON_PLAN, parse_lesson_plan, cwd=SITE)
    issues = read_json(ISSUE_LIST_COMMAND, parse_issues)
    ready = [i for i in issues if "ready-for-agent" in i["labels"]]
    result = pick_wave(
        lessons,
        ready,
        open_issues=[i["number"] for i in issues],
        size=args["size"],
        kind=args["kind"],
        only=args["only"],
        unblockers_first=args["unblockersFirst"],
    )
    out = to_json(result) if args["json"] else to_markdown(result)
    sys.stdout.buffer.write(out.encode("utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
