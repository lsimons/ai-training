"""The complete program behind the lesson "A model as the grader".

Run any step with:  python3 grade.py <step>   where step is one of the
names in STEPS below. The lesson's Predict blocks run these in CI.

`runs/` holds sixteen runs of the handbook assistant: twelve in the
development part, which the team looks at while it changes the agent, and
four held out, which run only before a release. `reference.csv` lists the
parts of a complete answer for each run, and `grades.csv` holds the scores
a person gave each run with the rubric in `rubric.txt`. The runs, the
reference answers and the person's grades are illustrative, written by the
lesson's author, and no model was called.

The judge below is not a model. It is a few rules that stand in for one,
so that the lesson runs on any machine and gives the same output every
time. It applies the rubric the way a careful reader would, and then it
does one thing a careful reader wouldn't: see LENGTH_BONUS_WORDS.
"""

import csv
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# The judge's built-in bias. An answer longer than this many words gets one
# extra point on Complete, up to the top of the scale. Model judges tend to
# prefer longer answers; this rule makes that tendency visible and repeatable.
LENGTH_BONUS_WORDS = 40

# The prompt line of the "full answers" change in the `metrics` step. The
# fixture adds it to each answer in code, so the rest of the answer stays the
# same and only the closing sentence differs.
CLOSING = (
    "I hope this answers your question about {keyword}. If anything is still "
    "unclear, ask me again, and I will look for the page of the handbook that "
    "covers it in more detail."
)


def read_run(path: Path) -> dict[str, str]:
    """A run file has one `name: value` line per field."""
    run = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        name, _, value = line.partition(": ")
        run[name] = value
    return run


def load_csv(name: str) -> dict[str, dict[str, str]]:
    with (HERE / name).open(encoding="utf-8", newline="") as f:
        return {row["run"]: row for row in csv.DictReader(f)}


def load_runs() -> list[dict[str, str]]:
    """Every run, with its reference answer, keyword and the person's grades."""
    reference = load_csv("reference.csv")
    grades = load_csv("grades.csv")
    runs = []
    for name, ref in reference.items():
        run = read_run(HERE / "runs" / f"{name}.txt")
        run.update(ref)
        run.update(grades[name])
        runs.append(run)
    return runs


def words(answer: str) -> int:
    return len(answer.split())


def quoted_sentence(answer: str) -> str:
    """The text between the first pair of double quotes, or an empty string."""
    parts = answer.split('"')
    return parts[1] if len(parts) >= 3 else ""


def judge(result: str, answer: str, reference: str) -> dict[str, int]:
    """Scores one answer with the rubric in rubric.txt. Stands in for a model."""
    parts = reference.split(";")
    found = sum(1 for part in parts if part.lower() in answer.lower())
    if found == len(parts):
        complete = 2
    elif found > 0:
        complete = 1
    else:
        complete = 0
    if words(answer) > LENGTH_BONUS_WORDS:
        complete = min(2, complete + 1)  # the length bias
    quote = quoted_sentence(answer)
    if answer == "not found" or (quote and quote in result):
        quoted = 2
    elif "not found" in answer.lower() or "could not find" in answer.lower():
        quoted = 1
    else:
        quoted = 0
    return {"complete": complete, "quoted": quoted}


def step_prefer() -> None:
    pair = read_run(HERE / "pair.txt")
    print(f"question: {pair['question']}")
    totals = {}
    for label in ["A", "B"]:
        answer = pair[f"answer {label}"]
        scores = judge(pair["result"], answer, pair["reference"])
        totals[label] = scores["complete"] + scores["quoted"]
        print(
            f"answer {label} ({words(answer)} words): "
            f"Complete {scores['complete']}, Quoted {scores['quoted']}"
        )
    # On a tie this judge keeps the first answer, the way model judges tend to.
    preferred = "B" if totals["B"] > totals["A"] else "A"
    print(f"judge prefers: answer {preferred}")


def step_agreement() -> None:
    runs = [run for run in load_runs() if run["part"] == "development"]
    for criterion in ["complete", "quoted"]:
        differ = []
        for run in runs:
            score = judge(run["result"], run["answer"], run["reference"])[criterion]
            if score != int(run[criterion]):
                differ.append((run, score))
        agree = len(runs) - len(differ)
        print(f"{criterion.capitalize()}: judge and person agree on {agree} of {len(runs)}")
        for run, score in differ:
            print(
                f"  {run['run']}: person {run[criterion]}, judge {score}"
                f" ({words(run['answer'])} words)"
            )


def with_closing(run: dict[str, str]) -> str:
    """The answer after the "full answers" change. `not found` stays exact."""
    if run["answer"] == "not found":
        return run["answer"]
    return run["answer"] + " " + CLOSING.format(keyword=run["keyword"])


def summary(runs: list[dict[str, str]], answers: list[str]) -> list[str]:
    total_words = sum(words(answer) for answer in answers)
    keyword = sum(1 for run, answer in zip(runs, answers) if run["keyword"] in answer.lower())
    judged = sum(
        judge(run["result"], answer, run["reference"])["complete"]
        for run, answer in zip(runs, answers)
    )
    person = sum(int(run["complete"]) for run in runs)  # the content did not change
    top = 2 * len(runs)
    return [
        f"{round(total_words / len(runs))} words",
        f"{keyword} of {len(runs)}",
        f"{judged} of {top}",
        f"{person} of {top}",
    ]


def step_metrics() -> None:
    runs = [run for run in load_runs() if run["part"] == "development"]
    before = summary(runs, [run["answer"] for run in runs])
    after = summary(runs, [with_closing(run) for run in runs])
    names = ["mean answer length", "keyword present", "judge, Complete", "person, Complete"]
    print(f"{'':20}{'before':12}after")
    for name, old, new in zip(names, before, after):
        print(f"{name:20}{old:12}{new}")


def step_held_out() -> None:
    runs = load_runs()
    print("Complete, scored by a person, before and after the tuned prompt")
    for part in ["development", "held out"]:
        in_part = [run for run in runs if run["part"] == part]
        old = sum(int(run["complete"]) for run in in_part)
        new = sum(int(run["complete_tuned"]) for run in in_part)
        print(f"{part}: {old} -> {new} of {2 * len(in_part)}")


STEPS = {
    "prefer": step_prefer,
    "agreement": step_agreement,
    "metrics": step_metrics,
    "held_out": step_held_out,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
