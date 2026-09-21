"""The complete program behind the lesson "When a tool fails".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The loop is the one from "Building your first agent", with two changes: a
tool result can be a structured error, and the harness counts errors in a
row and stops after two of them with a named stop reason.
"""

import sys

ACCOUNTS = {"1001": {"plan": "basic", "balance": "12.50 EUR"}}


# Section one: two ways a tool can fail badly.


def lookup_account_raises(account_id: str) -> dict:
    """Raises KeyError for an unknown id. The exception escapes the loop."""
    return ACCOUNTS[account_id]


def lookup_account_empty(account_id: str) -> str:
    """Returns an empty string for an unknown id. The model reads it as a result."""
    account = ACCOUNTS.get(account_id)
    if account is None:
        return ""
    return str(account)


# Section two: the tool says what went wrong, as data.


def lookup_account(account_id: str) -> dict:
    account = ACCOUNTS.get(account_id)
    if account is None:
        return {"ok": False, "error": f"no account {account_id}"}
    return {"ok": True, "plan": account["plan"], "balance": account["balance"]}


# Section three: a tool that calls a slow service.


def slow_service(currency: str) -> str:
    """Simulates an HTTP call. In this fixture it always times out."""
    raise TimeoutError(f"rate service for {currency} timed out after 2 seconds")


def fetch_rate(currency: str) -> dict:
    try:
        return {"ok": True, "rate": slow_service(currency)}
    except TimeoutError as exc:
        return {"ok": False, "error": str(exc)}


TOOLS = {
    "lookup_account": {
        "fn": lookup_account,
        "description": "Account plan and balance by exact account id. Args: account_id (str).",
    },
    "fetch_rate": {
        "fn": fetch_rate,
        "description": "Today's exchange rate for a currency code. Args: currency (str).",
    },
}


def fake_model(messages):
    last = messages[-1]
    if last["role"] == "user":
        word = last["content"].split()[-1].rstrip("?")
        if "account" in last["content"]:
            return {"tool": "lookup_account", "args": {"account_id": word}}
        return {"tool": "fetch_rate", "args": {"currency": word}}
    result = last["content"]
    if isinstance(result, dict) and not result.get("ok", False):
        if "timed out" in result["error"]:
            return messages[-2]["content"]
        return {"answer": f"Sorry, that failed: {result['error']}."}
    return {"answer": f"Here is what I found: {result}."}


def is_error(result) -> bool:
    return isinstance(result, dict) and result.get("ok") is False


def run(question, tools=TOOLS, model=fake_model, max_steps=5, max_errors=2):
    messages = [{"role": "user", "content": question}]
    errors_in_a_row = 0
    for _ in range(max_steps):
        reply = model(messages)
        if "answer" in reply:
            return {"stop": "end_turn", "answer": reply["answer"], "messages": messages}
        tool = tools[reply["tool"]]
        result = tool["fn"](**reply["args"])
        messages.append({"role": "assistant", "content": reply})
        messages.append({"role": "tool", "content": result, "is_error": is_error(result)})
        errors_in_a_row = errors_in_a_row + 1 if is_error(result) else 0
        if errors_in_a_row >= max_errors:
            return {"stop": "too_many_errors", "answer": None, "messages": messages}
    return {"stop": "max_steps", "answer": None, "messages": messages}


def show(outcome) -> None:
    for message in outcome["messages"]:
        print(f"{message['role']}: {message['content']!r}")
    print(f"stop: {outcome['stop']}")
    if outcome["answer"] is not None:
        print(f"answer: {outcome['answer']}")


def with_tool(fn):
    """TOOLS with lookup_account replaced by fn, for the section one steps."""
    tools = dict(TOOLS)
    tools["lookup_account"] = {"fn": fn, "description": TOOLS["lookup_account"]["description"]}
    return tools


def step_raises() -> None:
    try:
        run("What is the balance of account 4711?", tools=with_tool(lookup_account_raises))
    except KeyError as exc:
        print(f"KeyError: {exc}")


def step_empty() -> None:
    show(run("What is the balance of account 4711?", tools=with_tool(lookup_account_empty)))


def step_structured() -> None:
    show(run("What is the balance of account 4711?"))


def step_timeout() -> None:
    show(run("What is the rate for EUR?"))


STEPS = {
    "raises": step_raises,
    "empty": step_empty,
    "structured": step_structured,
    "timeout": step_timeout,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
