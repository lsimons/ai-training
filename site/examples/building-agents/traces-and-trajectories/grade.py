"""The two graders of the lesson "Recording and grading the path the agent took".

`answer_passes` grades the final answer only. `path_failures` grades the trace
with two rules and returns the name of each rule the run breaks.
"""

from typing import Optional

# A phrase each correct answer contains, per invoice.
EXPECTED = {
    "2207": "paid on 2026-09-02",
    "2208": "paid on 2026-08-28",
    "2311": "paid on 2026-09-10",
    "2415": "has not been paid",
}


def invoice_of(question: str) -> str:
    return question.split("invoice ")[1].split(" ")[0]


def answer_passes(run: dict) -> bool:
    expected = EXPECTED[invoice_of(run["question"])]
    return run["answer"] is not None and expected in run["answer"]


def tool_calls(trace: list[dict]) -> list[dict]:
    return [record for record in trace if record["kind"] == "tool"]


def search_first(trace: list[dict]) -> Optional[str]:
    """The first tool call is a search for the invoice."""
    calls = tool_calls(trace)
    if not calls or calls[0]["tool"] != "search_invoices":
        return "search-first"
    return None


def same_account(trace: list[dict]) -> Optional[str]:
    """Every payment lookup uses the account the search returned."""
    searches = [c for c in tool_calls(trace) if c["tool"] == "search_invoices"]
    found = {c["result"]["account"] for c in searches if "account" in c["result"]}
    for call in tool_calls(trace):
        if call["tool"] == "get_payments" and call["args"]["account"] not in found:
            return "same-account"
    return None


RULES = [search_first, same_account]


def path_failures(trace: list[dict]) -> list[str]:
    return [name for name in (rule(trace) for rule in RULES) if name is not None]
