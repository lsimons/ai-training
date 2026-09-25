"""List what the user said, and what the agent ran, in more than one session.

For the lesson "Turning repeated work into something the agent keeps".

Run it from this directory:   python3 find_repeats.py

It reads the three session logs in `sessions/`. In a log, a line that
starts with `User: ` is a message from the user, and a line that starts
with `$ ` is a command the agent ran.

Two messages count as the same when at least half of the words in the two
of them together are in both (the Jaccard index of their word sets). The
script prints the wording from the first session that has it. Commands
count as the same only when they are identical, and the script lists the
ones the agent ran in every session.
"""

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SESSIONS = HERE / "sessions"
SAME_MESSAGE = 0.5
USER = "User: "
COMMAND = "$ "


def words(text: str) -> set[str]:
    """Return the lowercase words of `text`, keeping paths and names whole."""
    return set(re.findall(r"[a-z0-9_./()-]+", text.lower()))


def similarity(a: str, b: str) -> float:
    """Return the share of words that two messages have in common."""
    wa, wb = words(a), words(b)
    return len(wa & wb) / len(wa | wb)


def read_session(path: Path) -> tuple[list[str], list[str]]:
    """Return the user messages and the commands of one session log."""
    messages: list[str] = []
    commands: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith(USER):
            messages.append(line[len(USER) :])
        elif line.startswith(COMMAND):
            commands.append(line[len(COMMAND) :])
    return messages, commands


def repeated_messages(sessions: list[list[str]]) -> list[tuple[list[int], str]]:
    """Group messages that recur across sessions, in order of first appearance."""
    used: set[tuple[int, int]] = set()
    groups: list[tuple[list[int], str]] = []
    for s, messages in enumerate(sessions):
        for m, message in enumerate(messages):
            if (s, m) in used:
                continue
            found = [s + 1]
            for t in range(s + 1, len(sessions)):
                for n, other in enumerate(sessions[t]):
                    if (t, n) not in used and similarity(message, other) >= SAME_MESSAGE:
                        used.add((t, n))
                        found.append(t + 1)
                        break
            if len(found) > 1:
                groups.append((found, message))
    return groups


def report() -> list[str]:
    """Return the lines the script prints."""
    paths = sorted(SESSIONS.glob("session-*.txt"))
    parsed = [read_session(path) for path in paths]
    lines = ["Said by the user in more than one session:"]
    for found, message in repeated_messages([messages for messages, _ in parsed]):
        numbers = ", ".join(str(n) for n in found)
        lines.append(f"  sessions {numbers}: {message}")
    everywhere = set(parsed[0][1])
    for _, commands in parsed[1:]:
        everywhere &= set(commands)
    lines.append("Run by the agent in every session:")
    for command in parsed[0][1]:
        if command in everywhere:
            lines.append(f"  {command}")
            everywhere.discard(command)
    return lines


if __name__ == "__main__":
    print("\n".join(report()))
