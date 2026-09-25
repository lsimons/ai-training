"""Your expected-path rule for the lookup task, for the lesson's exercise.

`expected_path` gets the trace of one run, a list of records in the order they
happened, and returns one reason per broken rule. An empty list is a pass.

A model record has "kind": "model" and "asked", the tool it asked for, or
"answer" on the last call. A tool record has "kind": "tool", "tool", "args"
and "result". `python3 trajectory.py exercise` runs this over the eight runs.

The starter checks one rule. Add the others.
"""


def expected_path(trace: list[dict]) -> list[str]:
    reasons = []
    calls = [record for record in trace if record["kind"] == "tool"]
    if len(calls) > 3:
        reasons.append(f"{len(calls)} tool calls, more than 3")
    return reasons
