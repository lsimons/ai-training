"""The toy agent behind the lesson "Run a tiny agent".

A scripted stand-in for a model, two tools (list a directory, read a file)
and a loop that runs each tool the model asks for and hands the result
back, until the model says it is done, the step limit is reached, or the
script runs out. The lesson page shows the transcripts this prints, and
`tests/test_agent_loop_concepts.py` checks that the page and the output
agree.

Run one of the scripted tasks with:  python3 tiny_agent.py <run>
where run is one of the names in RUNS below.
"""

import sys
from pathlib import Path
from typing import Callable, NamedTuple, Optional

HERE = Path(__file__).resolve().parent

# Each tool is a function plus the description the model reads.
TOOL_DESCRIPTIONS = {
    "list_dir": "List the files in a directory. Parameter: path, the directory to list.",
    "read_file": "Return the text of one file. Parameter: path, the file to read.",
}


def list_dir(path: str) -> str:
    target = HERE / path
    if not target.is_dir():
        return f"error: {path} is not a directory"
    return ", ".join(sorted(p.name for p in target.iterdir() if p.is_file()))


def read_file(path: str) -> str:
    target = HERE / path
    if not target.is_file():
        return f"error: {path} is not a file"
    return target.read_text(encoding="utf-8").strip()


TOOLS: dict[str, Callable[[str], str]] = {"list_dir": list_dir, "read_file": read_file}

# A scripted model: a fixed list of replies, one per step. A reply is either a
# tool request (tool name, path) or a final answer (None, text).
Reply = tuple[Optional[str], str]


class Run(NamedTuple):
    task: str
    max_steps: int
    script: list[Reply]


RUNS: dict[str, Run] = {
    "find": Run(
        task="Which meeting note mentions the June delivery?",
        max_steps=6,
        script=[
            ("list_dir", "notes"),
            ("read_file", "notes/2026-03-14-lantern.txt"),
            (None, "The note of 14 March: the sensor boards moved from April to June."),
        ],
    ),
    "count": Run(
        task="How many of the meeting notes are about project Lantern?",
        max_steps=6,
        script=[
            ("list_dir", "notes"),
            ("read_file", "notes/2026-03-14-lantern.txt"),
            ("read_file", "notes/2026-03-21-budget.txt"),
            ("read_file", "notes/2026-03-28-lantern.txt"),
            (None, "Two of the three notes are about project Lantern: 14 March and 28 March."),
        ],
    ),
    "limit": Run(
        task="Who confirms the delivery date?",
        max_steps=3,
        script=[
            ("list_dir", "notes"),
            ("list_dir", "notes"),
            ("read_file", "notes/2026-03-21-budget.txt"),
            ("read_file", "notes/2026-03-14-lantern.txt"),
            (None, "Ana confirms the delivery date by Friday."),
        ],
    ),
}


def run(task: str, script: list[Reply], max_steps: int) -> list[str]:
    """Run the loop for one task and return the transcript, one line per entry."""
    lines = [f"task: {task}"]
    for step, (tool_name, text) in enumerate(script, start=1):
        if step > max_steps:
            lines.append(f"loop: stopped, the step limit of {max_steps} was reached, no answer")
            return lines
        if tool_name is None:
            lines.append(f"{step}. model: done. {text}")
            lines.append(f"loop: stopped, the model said it is done after {step} steps")
            return lines
        lines.append(f'{step}. model: call {tool_name} with path "{text}"')
        tool = TOOLS[tool_name]
        result = tool(text)
        lines.append(f"   loop: ran {tool_name}, result: {result}")
    lines.append("loop: stopped, the script ran out")
    return lines


def transcript(name: str) -> str:
    spec = RUNS[name]
    return "\n".join(run(spec.task, spec.script, spec.max_steps))


def main(argv: list[str]) -> None:
    name = argv[1] if len(argv) > 1 else "find"
    print(transcript(name))


if __name__ == "__main__":
    main(sys.argv)
