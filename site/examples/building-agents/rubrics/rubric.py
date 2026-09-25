"""The complete program behind the lesson "Turning good into a rubric".

Run any step with:  python3 rubric.py <step>   where step is one of the
names in STEPS below. The lesson's Predict blocks run these in CI.

`transcripts/` holds twelve runs of a handbook assistant, the retrieval
agent described in `agent.txt`. `grades.csv` holds the grades two people
(A and B) and a model judge gave those runs. The grades are illustrative:
the lesson's author wrote them to show how graders agree and disagree, and
no model was called.

Columns of grades.csv:
  vague_a, vague_b   "The answer is well grounded", scored 1 to 5 by A and B
  grounded_a, _b     the anchored 0-1-2 "Grounded" criterion, scored by A and B
  grounded_judge     the same criterion, applied by a model judge
"""

import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TRANSCRIPTS = HERE / "transcripts"


def load_grades() -> list[dict[str, str]]:
    with (HERE / "grades.csv").open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def agreement(rows: list[dict[str, str]], left: str, right: str) -> list[str]:
    """The transcripts where the two columns give different scores."""
    return [row["transcript"] for row in rows if row[left] != row[right]]


def step_show() -> None:
    print((TRANSCRIPTS / "t05.txt").read_text(encoding="utf-8"), end="")


def step_agreement() -> None:
    rows = load_grades()
    total = len(rows)
    vague = agreement(rows, "vague_a", "vague_b")
    print(
        f'"The answer is well grounded", 1 to 5: A and B agree on {total - len(vague)} of {total}'
    )
    anchored = agreement(rows, "grounded_a", "grounded_b")
    print(f'"Grounded", anchored 0-1-2: A and B agree on {total - len(anchored)} of {total}')
    for name in anchored:
        row = next(r for r in rows if r["transcript"] == name)
        print(f"  {name}: A {row['grounded_a']}, B {row['grounded_b']}")


def step_judge() -> None:
    rows = load_grades()
    differ = agreement(rows, "grounded_a", "grounded_judge")
    print(f'"Grounded", judge and A agree on {len(rows) - len(differ)} of {len(rows)}')
    for name in differ:
        row = next(r for r in rows if r["transcript"] == name)
        print(f"  {name}: A {row['grounded_a']}, judge {row['grounded_judge']}")


STEPS = {
    "show": step_show,
    "agreement": step_agreement,
    "judge": step_judge,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
