#!/usr/bin/env python3
"""Claude Code hooks for this repo (`.claude/settings.json`, issues #349 and #342).

Three entry points, each reading the hook's JSON event on stdin:

- `guard-bash` (PreToolUse on Bash) rejects a command that breaks a rule
  of `AGENTS.md` or `docs/agents/orchestration.md` and exits 2 with a
  reason that names the alternative, which Claude Code shows the agent.
- `review-bash` (PreToolUse on Bash in the `code-reviewer` agent,
  `.claude/agents/code-reviewer.md`, #348) allows only the read-only
  commands a review needs: `git diff|log|show|status`, `gh pr diff|view`,
  `gh issue view`, `mise run <task>`, `cd`, `ls`, `grep`, and `head`,
  `tail` and `wc`, with no redirect to a file. Anything else exits 2.
- `format` (PostToolUse on Edit and Write) runs Biome on an edited file
  under `site/` and ruff on an edited `.py` file. It never fails the tool
  call: a formatter that is missing or errors is skipped.

The guard matches shell text, so it catches mistakes and not an agent that
works around it on purpose. It splits the command at `&&`, `||`, `;`, `|`
and newlines outside quotes, skips here-document bodies (a commit message
is data), follows `cd`, and reads `git -C <dir>`.

No agent pushes to `main` (#353): every change reaches it through a pull
request. `gh pr merge` is allowed only when `AI_TRAINING_ROLE` names a
role that may merge, either in the hook's environment or as a prefix on
the command itself (`AI_TRAINING_ROLE=wave-lead gh pr merge`).
"""

import contextlib
import json
import os
import re
import shlex
import subprocess
import sys
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

ROLE_VAR = "AI_TRAINING_ROLE"
PUSH_MAIN_ROLES: frozenset[str] = frozenset()
MERGE_ROLES = frozenset({"dispatcher", "wave-lead", "coordinator"})
MAX_SLEEP_SECONDS = 60
MAIN_BRANCH = "main"

OPERATORS = frozenset({"&&", "||", ";", "|", "&", "\n", ";;", "|&"})
KEYWORDS = frozenset({"do", "then", "else", "elif", "{", "(", "!", "time"})
LOOP_WORDS = frozenset({"for", "while", "until"})
HEREDOC = re.compile(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1")
SLEEP_ARG = re.compile(r"^(\d+(?:\.\d+)?)([smhd]?)$")
GH_SUBSHELL = re.compile(r"(?:\$\(|`)\s*gh\s")
UNITS = {"": 1, "s": 1, "m": 60, "h": 3600, "d": 86400}

BIOME_SUFFIXES = frozenset(
    {".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx", ".json", ".jsonc", ".astro", ".css"}
)


@dataclass(frozen=True)
class Segment:
    """One simple command: its words, the role prefix it carries, and where it runs."""

    words: list[str]
    role: str | None
    cwd: str


def strip_heredocs(command: str) -> str:
    """The command without the bodies of its here-documents, which are data."""
    lines = command.split("\n")
    kept: list[str] = []
    ends: list[str] = []
    for line in lines:
        if ends:
            if line.strip() == ends[0]:
                ends.pop(0)
            continue
        kept.append(line)
        ends.extend(m.group(2) for m in HEREDOC.finditer(line))
    return "\n".join(kept)


def tokens(command: str) -> list[str]:
    """Shell words and control operators, with quotes respected and newlines kept."""
    lexer = shlex.shlex(strip_heredocs(command), posix=True, punctuation_chars=";&|\n")
    lexer.whitespace = " \t\r"
    lexer.whitespace_split = True
    lexer.commenters = ""
    try:
        return list(lexer)
    except ValueError:
        return command.split()


def split_segments(command: str, cwd: str) -> list[Segment]:
    """The simple commands of a shell line, with `cd` followed for the ones after it."""
    segments: list[Segment] = []
    here = cwd
    current: list[str] = []
    for token in [*tokens(command), ";"]:
        if token not in OPERATORS and not set(token) <= set(";&|\n"):
            current.append(token)
            continue
        words = current
        current = []
        while words and words[0] in KEYWORDS:
            words = words[1:]
        role: str | None = None
        while words and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", words[0]):
            name, _, value = words[0].partition("=")
            if name == ROLE_VAR:
                role = value
            words = words[1:]
        if not words:
            continue
        if words[0] == "cd" and len(words) > 1:
            here = str(Path(here, Path(words[1]).expanduser()))
        segments.append(Segment(words, role, here))
    return segments


def is_gh_poll_loop(segments: Sequence[Segment]) -> bool:
    """True when the command polls GitHub: a loop that calls `gh` and waits.

    A `while` or `until` loop waits by its nature. A `for` loop over a list
    (`for n in 359 360; do gh issue view $n; done`) runs once per item and
    polls only when it also sleeps.
    """
    starts = {seg.words[0] for seg in segments}
    if not starts & LOOP_WORDS:
        return False
    if not any(calls_gh(seg.words) for seg in segments):
        return False
    return bool(starts & {"while", "until"}) or "sleep" in starts


def calls_gh(words: Sequence[str]) -> bool:
    """True when a simple command runs `gh`, directly, as a loop condition or in `$(...)`."""
    if words[0] == "gh" or (words[0] in LOOP_WORDS and words[1:2] == ["gh"]):
        return True
    return any(GH_SUBSHELL.search(w) for w in words)


def git_args(words: Sequence[str], cwd: str) -> tuple[list[str], str] | None:
    """The git subcommand and its arguments, and the directory it runs in, or None."""
    if not words or words[0] != "git":
        return None
    rest = list(words[1:])
    here = cwd
    while rest and rest[0].startswith("-"):
        flag = rest.pop(0)
        if flag == "-C" and rest:
            here = str(Path(here, Path(rest.pop(0)).expanduser()))
        elif flag in {"-c", "--git-dir", "--work-tree", "--namespace"} and rest:
            rest.pop(0)
    return rest, here


def is_main_checkout(path: str) -> bool:
    """True when `path` is inside the repository's first worktree (not a linked one)."""
    try:
        out = subprocess.run(
            ["git", "-C", path, "rev-parse", "--absolute-git-dir", "--git-common-dir"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.split()
    except OSError, subprocess.CalledProcessError:
        return False
    if len(out) != 2:
        return False
    git_dir, common = out
    return Path(git_dir).resolve() == Path(path, common).resolve()


def current_branch(path: str) -> str:
    """The checked-out branch at `path`, or "" when there is none."""
    try:
        return subprocess.run(
            ["git", "-C", path, "branch", "--show-current"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except OSError, subprocess.CalledProcessError:
        return ""


def role_of(segment: Segment, env: Mapping[str, str]) -> str:
    return segment.role or env.get(ROLE_VAR, "")


def pushes_main(args: Sequence[str], branch: str) -> bool:
    """True when a `git push` argument list updates `main` on the remote."""
    positional = [a for a in args if not a.startswith("-")]
    refspecs = positional[1:]
    if not refspecs:
        return branch == MAIN_BRANCH
    for spec in refspecs:
        dest = spec.lstrip("+").split(":")[-1]
        if dest in {MAIN_BRANCH, f"refs/heads/{MAIN_BRANCH}"}:
            return True
        if dest == "HEAD" and branch == MAIN_BRANCH:
            return True
    return False


def force_push(args: Sequence[str]) -> bool:
    for a in args:
        if a in {"--force", "-f"}:
            return True
        if re.match(r"^-[a-zA-Z]*f[a-zA-Z]*$", a) and not a.startswith("--"):
            return True
    positional = [a for a in args if not a.startswith("-")]
    return any(spec.startswith("+") for spec in positional[1:])


def sleep_seconds(words: Sequence[str]) -> float:
    """The total a `sleep` command waits (GNU sleep adds its arguments), or 0."""
    if not words or words[0] != "sleep":
        return 0
    total = 0.0
    for arg in words[1:]:
        m = SLEEP_ARG.match(arg)
        if m:
            total += float(m.group(1)) * UNITS[m.group(2)]
    return total


def stash_reason(sub: str, rest: list[str], args: list[str]) -> str | None:
    """The reason a `git stash` that changes the stash is rejected, in any directory."""
    if sub != "stash" or (rest and rest[0] in {"list", "show"}):
        return None
    return (
        f"`git {' '.join(args)}`: every worktree of the clone shares one stash "
        "(`refs/stash`), so a `git stash pop` can return another agent's changes. Commit "
        "your work in progress instead. You can also save it with "
        "`git diff HEAD > .scratch/x.patch` and restore it with `git apply` (run "
        "`git add -N` first for untracked files), or run `git worktree add --detach` "
        "for a separate checkout under `../ai-training-wt/`."
    )


def check_segment(
    segment: Segment,
    env: Mapping[str, str],
    main_checkout: Callable[[str], bool],
    branch_of: Callable[[str], str],
) -> str | None:
    """The reason a simple command is rejected, or None when it may run."""
    words = segment.words
    waited = sleep_seconds(words)
    if waited > MAX_SLEEP_SECONDS:
        return (
            f"`sleep` of {waited:g} seconds: the limit is {MAX_SLEEP_SECONDS}. End your turn "
            "and let the agents' notifications wake you, or wait on the thing itself in one "
            "blocking call (`gh pr checks <n> --watch`, `gh run watch <id>`, or a Bash call "
            "with run_in_background)."
        )
    if words[:3] == ["gh", "pr", "merge"] and role_of(segment, env) not in MERGE_ROLES:
        return (
            "`gh pr merge` is for the wave lead, the dispatcher, or a coordinator the "
            "maintainer asked to merge. Report the pull request as ready instead. A role "
            f"that may merge prefixes the command with `{ROLE_VAR}=<role>`."
        )
    parsed = git_args(words, segment.cwd)
    if parsed is None:
        return None
    args, where = parsed
    if not args:
        return None
    sub, rest = args[0], args[1:]
    if sub == "push":
        if force_push(rest):
            return (
                "Force push: use `git push --force-with-lease` on your own branch instead, "
                "and never on a branch another branch is stacked on."
            )
        if pushes_main(rest, branch_of(where)) and role_of(segment, env) not in PUSH_MAIN_ROLES:
            return (
                "Push to `main`: no agent pushes to `main`. Push your own branch and open "
                "a pull request. A dispatcher keeps its record in its run issue, not in git."
            )
        return None
    stash = stash_reason(sub, rest, args)
    if stash is not None:
        return stash
    destructive = (
        (sub == "reset" and "--hard" in rest)
        or (sub == "checkout" and "--" in rest and "." in rest[rest.index("--") :])
        or (sub == "checkout" and rest == ["."])
        or (sub == "restore" and "." in rest)
    )
    if destructive and main_checkout(where):
        return (
            f"`git {' '.join(args)}` in the main checkout: other agents' work may be in it. "
            "Work in your own worktree (`../ai-training-wt/<branch>`), and leave the main "
            "checkout as you found it."
        )
    return None


def check_command(
    command: str,
    cwd: str,
    env: Mapping[str, str],
    main_checkout: Callable[[str], bool] = is_main_checkout,
    branch_of: Callable[[str], str] = current_branch,
) -> str | None:
    """The reason a Bash command is rejected, or None when it may run."""
    segments = split_segments(command, cwd)
    if is_gh_poll_loop(segments):
        return (
            "A loop that calls `gh` and waits is a poll loop. Wait in one blocking call "
            "(`gh pr checks <n> --watch`, `gh run watch <id>`), or end your turn and let "
            "the notifications wake you. Reviews come back in the reviewer's hand-back, so "
            "never poll a pull request for comments."
        )
    for segment in segments:
        reason = check_segment(segment, env, main_checkout, branch_of)
        if reason:
            return reason
    return None


def guard_bash(event: Mapping[str, Any], env: Mapping[str, str]) -> tuple[int, str]:
    """Exit code and message for a PreToolUse event: 2 blocks the call, 0 lets it run."""
    tool_input: Mapping[str, Any] = event.get("tool_input") or {}
    command = tool_input.get("command")
    if not isinstance(command, str):
        return 0, ""
    cwd = event.get("cwd")
    reason = check_command(command, cwd if isinstance(cwd, str) else str(Path.cwd()), env)
    if reason:
        return 2, f"Blocked by .claude/hooks/guard-bash.sh: {reason}"
    return 0, ""


REVIEW_COMMANDS = (
    ("git", "diff"),
    ("git", "log"),
    ("git", "show"),
    ("git", "status"),
    ("gh", "pr", "diff"),
    ("gh", "pr", "view"),
    ("gh", "issue", "view"),
    ("mise", "run"),
    ("head",),
    ("tail",),
    ("grep",),
    ("wc",),
    ("ls",),
)


REDIRECT_END = frozenset(" \t\n;|&<>()")


def output_redirects(command: str) -> list[str]:
    """The targets of the unquoted `>` redirects in a command, as written.

    `2>&1` gives `&1`, and `>> f`, `>| f` and `&> f` give `f`. Text inside
    quotes or after a backslash is not a redirect.
    """
    targets: list[str] = []
    quote = ""
    i = 0
    while i < len(command):
        char = command[i]
        if quote:
            if char == "\\" and quote == '"':
                i += 1
            elif char == quote:
                quote = ""
        elif char == "\\":
            i += 1
        elif char in "'\"":
            quote = char
        elif char == ">":
            j = i + 1
            if j < len(command) and command[j] in ">|":
                j += 1
            if j < len(command) and command[j] == "&":
                k = j + 1
                while k < len(command) and (command[k].isdigit() or command[k] == "-"):
                    k += 1
                targets.append(command[j:k])
                i = k
                continue
            while j < len(command) and command[j] in " \t":
                j += 1
            k = j
            while k < len(command) and command[k] not in REDIRECT_END:
                k += 1
            targets.append(command[j:k])
            i = k
            continue
        i += 1
    return targets


def writes_a_file(command: str) -> bool:
    """True when a redirect writes somewhere other than /dev/null or another descriptor."""
    return any(
        target != "/dev/null" and not re.fullmatch(r"&(\d+|-)", target)
        for target in output_redirects(command)
    )


def review_allows(words: Sequence[str]) -> bool:
    """True when a simple command is one the code reviewer may run."""
    if words[0] == "cd":
        return True
    if words[0] == "git":
        parsed = git_args(words, ".")
        args = parsed[0] if parsed else []
        return bool(args) and ("git", args[0]) in REVIEW_COMMANDS
    return any(tuple(words[: len(allowed)]) == allowed for allowed in REVIEW_COMMANDS)


def review_bash(event: Mapping[str, Any]) -> tuple[int, str]:
    """Exit code and message for the code reviewer's PreToolUse event on Bash."""
    tool_input: Mapping[str, Any] = event.get("tool_input") or {}
    command = tool_input.get("command")
    if not isinstance(command, str):
        return 0, ""
    if writes_a_file(command):
        return 2, (
            "Blocked by the code-reviewer hook: the command redirects output to a file. "
            "A reviewer never writes files. Read the output instead, or send it to /dev/null."
        )
    # The splitter reads the `&` of `2>&1` as an operator, so drop the
    # redirects writes_a_file allows before splitting.
    harmless = re.sub(r"(\d*|&)>>?(&(\d+|-)|\s*/dev/null)", " ", command)
    for segment in split_segments(harmless, "."):
        if segment.role is not None or not review_allows(segment.words):
            allowed = ", ".join(" ".join(c) for c in REVIEW_COMMANDS)
            return 2, (
                f"Blocked by the code-reviewer hook: `{' '.join(segment.words)}` is not a "
                f"review command. A reviewer runs only {allowed} and cd, and never edits."
            )
    return 0, ""


def formatter_for(path: Path, root: Path) -> tuple[list[str], Path] | None:
    """The formatter command for an edited file and the directory to run it in, or None."""
    try:
        rel = path.resolve().relative_to(root.resolve())
    except ValueError:
        return None
    if rel.suffix == ".py":
        ruff = root / ".venv" / "bin" / "ruff"
        return ([str(ruff), "format", "--quiet", str(rel)], root) if ruff.exists() else None
    if rel.parts[:1] == ("site",) and rel.suffix in BIOME_SUFFIXES:
        biome = root / "site" / "node_modules" / ".bin" / "biome"
        if not biome.exists():
            return None
        inner = Path(*rel.parts[1:])
        cmd = [str(biome), "check", "--write", "--no-errors-on-unmatched", str(inner)]
        return cmd, root / "site"
    return None


def repo_root(path: Path) -> Path | None:
    """The worktree that holds `path`, so an edit in a linked worktree formats there."""
    try:
        out = subprocess.run(
            ["git", "-C", str(path.parent), "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except OSError, subprocess.CalledProcessError:
        return None
    return Path(out) if out else None


def format_file(event: Mapping[str, Any]) -> int:
    """Run the formatter for a PostToolUse event's file. Always 0."""
    tool_input: Mapping[str, Any] = event.get("tool_input") or {}
    file_path = tool_input.get("file_path")
    if not isinstance(file_path, str):
        return 0
    path = Path(file_path)
    root = repo_root(path)
    if root is None:
        return 0
    found = formatter_for(path, root)
    if found is None:
        return 0
    cmd, where = found
    with contextlib.suppress(OSError, subprocess.TimeoutExpired):
        subprocess.run(cmd, cwd=where, capture_output=True, timeout=25, check=False)
    return 0


def main(argv: Sequence[str], stdin: str, env: Mapping[str, str]) -> int:
    if len(argv) != 2 or argv[1] not in {"guard-bash", "review-bash", "format"}:
        print("usage: agent_hooks.py guard-bash|review-bash|format < event.json", file=sys.stderr)
        return 1
    try:
        parsed: object = json.loads(stdin)
    except json.JSONDecodeError:
        return 0
    if not isinstance(parsed, dict):
        return 0
    event = cast("dict[str, Any]", parsed)
    if argv[1] == "format":
        return format_file(event)
    if argv[1] == "review-bash":
        code, message = review_bash(event)
    else:
        code, message = guard_bash(event, env)
    if message:
        print(message, file=sys.stderr)
    return code


if __name__ == "__main__":
    sys.exit(main(sys.argv, sys.stdin.read(), os.environ))
