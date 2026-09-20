"""Print the Scorecard checks that need a human to look.

The result file is a hand-written fixture in the shape `scorecard --format
json` prints: a top-level "score" and a "checks" list where each check has a
"name", a 0 to 10 "score" and a one-line "reason". The check names are
Scorecard's. The scores and the project are invented for the lesson.

Standard library only, Python 3.9 or later.
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# Below this score a check is a finding to act on. At or above it, a note.
THRESHOLD = 5


def main():
    with open(os.path.join(HERE, "fixture", "scorecard.json"), encoding="utf-8") as f:
        result = json.load(f)
    findings = [c for c in result["checks"] if c["score"] < THRESHOLD]
    for check in findings:
        print(f"{check['name']} {check['score']}")
    print(f"{len(findings)} of {len(result['checks'])} checks below {THRESHOLD}")


if __name__ == "__main__":
    main()
