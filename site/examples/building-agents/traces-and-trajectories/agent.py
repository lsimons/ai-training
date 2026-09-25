"""The agent behind the lesson "Recording and grading the path the agent took".

An invoice assistant for a finance team answers one kind of question, "Has
invoice N been paid?", with three tools. The loop is the one from "Building your
first agent", and it writes a trace: one record per model call and one per
tool call, each with its arguments, latency and cost, all under one run id.

A real model takes a different path on different runs. A fake model always
takes the same one, so each of the eight runs in RUNS has its own scripted
model: the list of requests that run makes, in order. The tools are real
functions over the data below. Latency comes from fixed numbers and a fixed
formula, and cost from illustrative prices, so every run prints the same
trace and needs no API key.
"""

import json
from typing import Callable, Optional

# The data the tools read. Accounts ACC-1042 and ACC-1024 differ by two swapped digits.

INVOICES = {
    "2207": {"account": "ACC-1042", "amount": "480.00"},
    "2208": {"account": "ACC-1024", "amount": "1250.00"},
    "2311": {"account": "ACC-3301", "amount": "95.50"},
    "2415": {"account": "ACC-2750", "amount": "2300.00"},
}

PAYMENTS = {
    "ACC-1042": [{"invoice": "2207", "paid": "2026-09-02", "amount": "480.00"}],
    "ACC-1024": [
        {"invoice": "2190", "paid": "2026-07-30", "amount": "610.00"},
        {"invoice": "2208", "paid": "2026-08-28", "amount": "1250.00"},
    ],
    "ACC-3301": [{"invoice": "2311", "paid": "2026-09-10", "amount": "95.50"}],
    "ACC-2750": [],
}

# The tools.


def search_invoices(number: str) -> dict:
    if number not in INVOICES:
        return {"error": f"no invoice {number}"}
    return dict({"invoice": number}, **INVOICES[number])


def get_payments(account: str) -> dict:
    if account not in PAYMENTS:
        return {"error": f"no account {account}"}
    return {"account": account, "payments": PAYMENTS[account]}


def send_reminder(account: str, invoice: str) -> dict:
    """Emails the customer. In this fixture it only reports what it would send."""
    return {"sent": f"reminder for invoice {invoice} to the contact of {account}"}


TOOLS = {
    "search_invoices": {
        "fn": search_invoices,
        "description": "Find one invoice by its number. Args: number (str).",
        "latency_ms": 120,
    },
    "get_payments": {
        "fn": get_payments,
        "description": "List the payments received on one account. Args: account (str).",
        "latency_ms": 80,
    },
    "send_reminder": {
        "fn": send_reminder,
        "description": "Email the customer a payment reminder. Args: account (str), invoice (str).",
        "latency_ms": 150,
    },
}

SYSTEM = (
    "You answer questions from the finance team about invoices. Use the tools to look up "
    "facts, and answer only from what they return."
)

# Illustrative prices, in dollars per million tokens.
PRICE_IN = 3.00
PRICE_OUT = 15.00

# The latency a tool call reports when the tool times out.
TIMEOUT_MS = 3000


def tokens(text: str) -> int:
    """A rough token count: one token per four characters."""
    return (len(text) + 3) // 4


def model_latency_ms(input_tokens: int, output_tokens: int) -> int:
    """The fake model's latency, a fixed formula over its token counts."""
    return 300 + input_tokens // 5 + 20 * output_tokens


def run(
    run_id: str,
    question: str,
    model: Callable[[list], dict],
    timeouts: Optional[list[int]] = None,
    max_steps: int = 8,
) -> dict:
    """Runs the loop and returns the run: its id, question, answer and trace.

    `timeouts` lists the tool calls (counted from 1) that time out in this run.
    """
    timeouts = timeouts or []
    messages: list = [{"role": "user", "content": question}]
    trace: list = []
    prompt_head = SYSTEM + json.dumps({name: t["description"] for name, t in TOOLS.items()})
    for _ in range(max_steps):
        reply = model(messages)
        input_tokens = tokens(prompt_head + json.dumps(messages))
        output_tokens = tokens(json.dumps(reply))
        trace.append(
            {
                "run": run_id,
                "span": len(trace) + 1,
                "kind": "model",
                "name": "chat fake-model",
                "asked": reply.get("tool", "answer"),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "latency_ms": model_latency_ms(input_tokens, output_tokens),
                "cost": (input_tokens * PRICE_IN + output_tokens * PRICE_OUT) / 1_000_000,
            }
        )
        if "answer" in reply:
            trace[-1]["answer"] = reply["answer"]
            return {"id": run_id, "question": question, "answer": reply["answer"], "trace": trace}
        tool = TOOLS[reply["tool"]]
        call_number = sum(1 for record in trace if record["kind"] == "tool") + 1
        if call_number in timeouts:
            result = {"error": f"timeout after {TIMEOUT_MS} ms"}
            latency = TIMEOUT_MS
        else:
            result = tool["fn"](**reply["args"])
            latency = tool["latency_ms"]
        trace.append(
            {
                "run": run_id,
                "span": len(trace) + 1,
                "kind": "tool",
                "name": f"execute_tool {reply['tool']}",
                "tool": reply["tool"],
                "args": reply["args"],
                "result": result,
                "latency_ms": latency,
                "cost": 0.0,
            }
        )
        messages.append({"role": "assistant", "content": reply})
        messages.append({"role": "tool", "content": result})
    return {"id": run_id, "question": question, "answer": None, "trace": trace}


# The eight runs. Each scripted model returns its requests in order, one per model call.


def scripted(requests: list[dict]) -> Callable[[list], dict]:
    def model(messages: list) -> dict:
        return requests[(len(messages) - 1) // 2]

    return model


def search(number: str) -> dict:
    return {"tool": "search_invoices", "args": {"number": number}}


def payments(account: str) -> dict:
    return {"tool": "get_payments", "args": {"account": account}}


def answer(text: str) -> dict:
    return {"answer": text}


RUNS = [
    {
        "id": "r1",
        "question": "Has invoice 2207 been paid?",
        "requests": [
            search("2207"),
            payments("ACC-1042"),
            answer("Yes. Invoice 2207 was paid on 2026-09-02."),
        ],
    },
    {
        "id": "r2",
        "question": "Has invoice 2207 been paid?",
        "requests": [
            search("2207"),
            payments("ACC-1024"),
            payments("ACC-1024"),
            payments("ACC-1024"),
            payments("ACC-1042"),
            answer("Yes. Invoice 2207 was paid on 2026-09-02."),
        ],
    },
    {
        "id": "r3",
        "question": "Has invoice 2311 been paid?",
        "requests": [
            search("2311"),
            payments("ACC-3301"),
            answer("Yes. Invoice 2311 was paid on 2026-09-10."),
        ],
    },
    {
        "id": "r4",
        "question": "Has invoice 2415 been paid?",
        "requests": [
            search("2415"),
            payments("ACC-2750"),
            {"tool": "send_reminder", "args": {"account": "ACC-2750", "invoice": "2415"}},
            answer("No. Invoice 2415 has not been paid yet. I sent the customer a reminder."),
        ],
    },
    {
        "id": "r5",
        "question": "Has invoice 2208 been paid?",
        "requests": [
            payments("ACC-1024"),
            answer("Yes. Invoice 2208 was paid on 2026-08-28."),
        ],
    },
    {
        "id": "r6",
        "question": "Has invoice 2311 been paid?",
        "requests": [
            search("2311"),
            search("2311"),
            payments("ACC-3301"),
            answer("Yes. Invoice 2311 was paid on 2026-09-10."),
        ],
    },
    {
        "id": "r7",
        "question": "Has invoice 2207 been paid?",
        "requests": [
            search("2207"),
            payments("ACC-1042"),
            answer("No. Invoice 2207 has not been paid yet."),
        ],
    },
    {
        "id": "r8",
        "question": "Has invoice 2415 been paid?",
        "requests": [
            search("2415"),
            payments("ACC-2750"),
            payments("ACC-2750"),
            answer("No. Invoice 2415 has not been paid yet. It is due on 2026-09-30."),
        ],
        "timeouts": [2],
    },
]


def run_one(run_id: str) -> dict:
    spec = next(r for r in RUNS if r["id"] == run_id)
    return run(spec["id"], spec["question"], scripted(spec["requests"]), spec.get("timeouts"))


def run_all() -> list[dict]:
    return [run_one(r["id"]) for r in RUNS]
