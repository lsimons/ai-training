"""The complete program behind the lesson "Cost, caching and pinning the model".

Run any step with:  python3 ops.py <step>   where step is one of the names
in STEPS at the end of this file. The lesson's Predict blocks run these in CI.

A help desk agent answers questions with three tools: get_ticket,
search_kb and read_log. The provider is fake. It runs in this process,
makes no network call, and answers with a scripted model that reads the
message list. It counts tokens, charges a price per million tokens, and
can be told to refuse a call with an error, the way a real provider does.

The counter counts every word and every punctuation mark as one token. It
is a rough stand-in for a real tokenizer, so compare the numbers with each
other and not with a price list. The prices are made up, and the cache
multipliers are the ones the Claude API pricing page lists for most
models: a cache write costs 1.25 times the input price and a cache read
0.1 times.
"""

import re
import sys
from dataclasses import dataclass, field
from typing import Callable, Optional

# The provider's price list, in dollars per million tokens. Made up.

PRICE_INPUT = 3.00
PRICE_OUTPUT = 15.00
PRICE_CACHE_WRITE = PRICE_INPUT * 1.25
PRICE_CACHE_READ = PRICE_INPUT * 0.1

# The model id the agent pins, and the alias the pitfall uses. An alias is
# a name the provider moves to a newer model on a date it chooses.

PINNED_MODEL = "fake-helper-2-1"
ALIAS = "fake-helper-latest"
ALIAS_TARGETS = [("2026-01-01", "fake-helper-2-1"), ("2026-06-01", "fake-helper-3-0")]


def resolve(model: str, today: str) -> str:
    if model != ALIAS:
        return model
    target = ""
    for since, name in ALIAS_TARGETS:
        if today >= since:
            target = name
    return target


# The stable prefix: the system prompt and the tool list are the same on
# every call of every run.

SYSTEM = (
    "You are the help desk assistant of a small office. You answer questions from staff about "
    "tickets, accounts and the office systems. Look facts up with your tools before you answer, "
    "and never guess a ticket status. Answer in two or three short sentences. When the tools do "
    "not give the answer, say so and suggest opening a ticket."
)

TOOL_LIST = [
    {
        "name": "get_ticket",
        "description": "Return one help desk ticket by number: title, status and the last note.",
        "input_schema": {"ticket": "string, the ticket number"},
    },
    {
        "name": "search_kb",
        "description": "Search the knowledge base and return the best matching article.",
        "input_schema": {"query": "string, a few words that describe the problem"},
    },
    {
        "name": "read_log",
        "description": "Return the last night's log of one office service, line by line.",
        "input_schema": {"service": "string, the service name, such as backup or mail"},
    },
]

# The tools. The data is invented for the lesson.

TICKETS = {
    "311": {"title": "Laptop will not start", "status": "open", "note": "User tried a restart."},
    "318": {
        "title": "Printer on floor 2 jams",
        "status": "waiting for parts",
        "note": "Roller ordered.",
    },
    "322": {
        "title": "Printer floor 2 paper jam",
        "status": "open",
        "note": "Reported by reception.",
    },
}

KB = {
    "laptop will not start": "Hold the power button for 15 seconds, then charge it for 10 minutes.",
    "reset vpn password": "Open the account portal, choose Security, then Reset VPN password.",
}

FOLDERS = [
    "finance",
    "hr",
    "projects",
    "sales",
    "design",
    "legal",
    "it",
    "marketing",
    "support",
    "archive",
    "scans",
    "photos",
]
YEARS = [
    "2015",
    "2016",
    "2017",
    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025",
    "2026",
]

# One line per folder and year, the way a chatty backup job logs, and the
# one line that matters at the end.
BACKUP_LOG = [
    f"02:{n // 60:02d}:{n % 60:02d} backup: copied share/{folder}/{year}, checksum ok"
    for n, (folder, year) in enumerate((f, y) for f in FOLDERS for y in YEARS)
] + ["02:02:30 backup: stopped, the target disk is full"]


def get_ticket(ticket: str) -> dict:
    return {"ticket": ticket, **TICKETS[ticket]}


def search_kb(query: str) -> dict:
    return {"query": query, "article": KB[query]}


def read_log(service: str) -> dict:
    return {"service": service, "lines": BACKUP_LOG}


TOOLS: dict[str, Callable[..., dict]] = {
    "get_ticket": get_ticket,
    "search_kb": search_kb,
    "read_log": read_log,
}

# The five tasks. Each script says which tool calls the fake model makes, in
# order, and what it answers once it has every result.

TASKS = {
    "t1": "Ticket 311 says the laptop will not start. What should the user try first?",
    "t2": "What is the status of ticket 318?",
    "t3": "How do I reset my VPN password?",
    "t4": "Why did the backup fail last night?",
    "t5": "Is ticket 322 the same problem as ticket 318?",
}

SCRIPTS = {
    "t1": (
        [("get_ticket", {"ticket": "311"}), ("search_kb", {"query": "laptop will not start"})],
        "Ticket 311 is open. Hold the power button for 15 seconds, then charge it for 10 minutes.",
    ),
    "t2": ([("get_ticket", {"ticket": "318"})], "Ticket 318 is waiting for parts."),
    "t3": (
        [("search_kb", {"query": "reset vpn password"})],
        "Open the account portal, choose Security, then Reset VPN password.",
    ),
    "t4": (
        [("read_log", {"service": "backup"})],
        "The backup stopped at 02:02 because the disk is full.",
    ),
    "t5": (
        [("get_ticket", {"ticket": "322"}), ("get_ticket", {"ticket": "318"})],
        "Yes, both are the paper jam on the floor 2 printer. Ticket 318 is waiting for parts.",
    ),
}

# The newer model behind the alias looks up one more thing on task t1 and
# writes a longer answer, the kind of change a new version brings.

NEWER_EXTRA = ("search_kb", {"query": "laptop will not start"})
NEWER_SUFFIX = " If that does not help, reply to the ticket and the help desk will book a visit."


def count_tokens(text: str) -> int:
    return len(re.findall(r"\w+|[^\w\s]", text))


def task_of(messages: list) -> str:
    question = messages[0]["content"]
    return next(key for key, text in TASKS.items() if text == question)


def fake_model(model: str, messages: list) -> dict:
    calls, answer = SCRIPTS[task_of(messages)]
    if model == "fake-helper-3-0" and task_of(messages) == "t1":
        calls = [*calls[:1], NEWER_EXTRA, *calls[1:]]
        answer = answer + NEWER_SUFFIX
    done = (len(messages) - 1) // 2
    if done < len(calls):
        tool, args = calls[done]
        return {"tool": tool, "args": args}
    return {"answer": answer}


# The provider. An error is an exception with the status code and error
# type of the Claude API, and a retry_after in seconds when the provider
# sends one.


class ProviderError(Exception):
    def __init__(self, status: int, kind: str, message: str, retry_after: Optional[int] = None):
        super().__init__(message)
        self.status = status
        self.kind = kind
        self.message = message
        self.retry_after = retry_after


class CallTimeoutError(Exception):
    pass


RETRIABLE = {429, 500, 529}


@dataclass
class Provider:
    """The fake provider. It numbers every attempt. `refuse` maps an attempt
    number to the error it raises, and `seconds` to how long the reply takes."""

    today: str = "2026-09-01"
    refuse: dict = field(default_factory=dict)
    seconds: dict = field(default_factory=dict)
    cached: set = field(default_factory=set)
    calls: int = 0

    def create(self, model, system, tools, messages, cache=False, timeout=30.0) -> dict:
        self.calls += 1
        error = self.refuse.pop(self.calls, None)
        if error is not None:
            raise error
        if self.seconds.get(self.calls, 1.0) > timeout:
            raise CallTimeoutError(f"no reply within {timeout:.0f}s")
        name = resolve(model, self.today)
        prefix = count_tokens(system) + count_tokens(str(tools))
        rest = count_tokens(str(messages))
        usage = {
            "input_tokens": rest,
            "cache_creation_input_tokens": 0,
            "cache_read_input_tokens": 0,
            "output_tokens": 0,
        }
        key = (name, system, str(tools))
        if not cache:
            usage["input_tokens"] += prefix
        elif key in self.cached:
            usage["cache_read_input_tokens"] = prefix
        else:
            usage["cache_creation_input_tokens"] = prefix
            self.cached.add(key)
        reply = fake_model(name, messages)
        usage["output_tokens"] = count_tokens(str(reply))
        return {"model": name, "reply": reply, "usage": usage}


# The cost record of one run.


def dollars(usage: dict) -> float:
    return (
        usage["input_tokens"] * PRICE_INPUT
        + usage["cache_creation_input_tokens"] * PRICE_CACHE_WRITE
        + usage["cache_read_input_tokens"] * PRICE_CACHE_READ
        + usage["output_tokens"] * PRICE_OUTPUT
    ) / 1_000_000


def tokens(usage: dict) -> int:
    return sum(usage.values())


@dataclass
class CostRecord:
    calls: int = 0
    tokens: int = 0
    dollars: float = 0.0

    def add(self, usage: dict) -> None:
        self.calls += 1
        self.tokens += tokens(usage)
        self.dollars += dollars(usage)


# Calling the provider: a timeout on every call, a retry with backoff for
# the retriable errors, and every other error back to the caller.


def call_provider(
    provider, model, messages, cache, sleep, log, number, max_retries=3, timeout=30.0
) -> dict:
    attempt = 1
    while True:
        try:
            return provider.create(model, SYSTEM, TOOL_LIST, messages, cache=cache, timeout=timeout)
        except CallTimeoutError as err:
            status, text, wait_for = "timeout", str(err), None
        except ProviderError as err:
            if err.status not in RETRIABLE:
                raise
            status, text, wait_for = f"{err.status} {err.kind}", err.message, err.retry_after
        if attempt > max_retries:
            raise ProviderError(0, "gave_up", f"{status} after {attempt} attempts")
        wait = float(wait_for) if wait_for is not None else 1.0 * 2 ** (attempt - 1)
        log(f"call {number}: {status}: {text}; wait {wait:.1f}s and retry")
        sleep(wait)
        attempt += 1


def no_sleep(seconds: float) -> None:
    """The fixture never really waits. The log line says how long it would."""


def quiet(line: str) -> None:
    pass


def run(
    task: str,
    provider: Optional[Provider] = None,
    model: str = PINNED_MODEL,
    budget: Optional[int] = None,
    cache: bool = False,
    log: Callable[[str], None] = quiet,
    max_steps: int = 6,
) -> dict:
    provider = provider if provider is not None else Provider()
    messages: list = [{"role": "user", "content": TASKS[task]}]
    record = CostRecord()

    def outcome(stop: str, answer: Optional[str], error: Optional[str] = None) -> dict:
        result = {"stop": stop, "answer": answer, "calls": record.calls, "tokens": record.tokens}
        result["cost"] = f"${record.dollars:.6f}"
        if error is not None:
            result["error"] = error
        return result

    for _ in range(max_steps):
        if budget is not None and record.tokens >= budget:
            return outcome("budget_spent", None)
        try:
            response = call_provider(
                provider, model, messages, cache, no_sleep, log, record.calls + 1
            )
        except ProviderError as err:
            return outcome("provider_error", None, f"{err.status} {err.kind}: {err.message}")
        record.add(response["usage"])
        log(f"call {record.calls}: {usage_line(response['usage'])}")
        reply = response["reply"]
        if "answer" in reply:
            return outcome("end_turn", reply["answer"])
        result = TOOLS[reply["tool"]](**reply["args"])
        messages.append({"role": "assistant", "content": reply})
        messages.append({"role": "tool", "content": result})
    return outcome("max_steps", None)


def usage_line(usage: dict) -> str:
    parts = [f"input {usage['input_tokens']}"]
    if usage["cache_creation_input_tokens"]:
        parts.append(f"cache write {usage['cache_creation_input_tokens']}")
    if usage["cache_read_input_tokens"]:
        parts.append(f"cache read {usage['cache_read_input_tokens']}")
    parts.append(f"output {usage['output_tokens']}")
    return ", ".join(parts) + f", ${dollars(usage):.6f}"


# The steps the lesson runs.


def show(result: dict) -> None:
    for key, value in result.items():
        print(f"{key}: {value}")


def step_cost() -> None:
    show(run("t1", log=print))


def step_budget() -> None:
    print(run("t1", budget=600))


def step_cache() -> None:
    show(run("t1", cache=True, log=print))


def step_rate_limit() -> None:
    limited = Provider(
        refuse={3: ProviderError(429, "rate_limit_error", "rate limit exceeded", retry_after=2)}
    )
    show(run("t1", provider=limited, log=print))


def step_errors() -> None:
    # The provider counts attempts: attempt 2 is slow, and attempt 4 is refused.
    refused = Provider(
        seconds={2: 45.0},
        refuse={4: ProviderError(400, "invalid_request_error", "messages: bad format")},
    )
    show(run("t1", provider=refused, log=print))


def step_alias() -> None:
    for today in ["2026-05-31", "2026-06-01"]:
        result = run("t1", provider=Provider(today=today), model=ALIAS)
        print(f"{today}: {resolve(ALIAS, today)}, calls {result['calls']}, cost {result['cost']}")


STEPS = {
    "cost": step_cost,
    "budget": step_budget,
    "cache": step_cache,
    "rate_limit": step_rate_limit,
    "errors": step_errors,
    "alias": step_alias,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
