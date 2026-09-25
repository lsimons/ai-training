"""The complete program behind the lesson "What every extra agent costs".

Run any step with:  python3 tax.py <step>   where step is one of the names
in STEPS below. The lesson's Predict blocks run these in CI.

One small shop answers customer emails about broken items in three
arrangements. The single agent has the tools itself. The pipeline is three
agents that code runs one after another: lookup reads the email, looks the
order up and writes notes, the writer writes the reply from the notes, and
the checker checks the reply against the notes. The manager is a model
that calls two workers, lookup and writer, as tools.
Every model is fake: a function that reads the text it gets, prompt
included, and writes text back. So a change to a prompt changes what that
agent does.

The counter counts every word and every punctuation mark as one token. It
is a rough stand-in for a real tokenizer, so compare the numbers with each
other and not with a price list. Each piece of text a model call reads is
counted once per call, with one of three labels:

  new      text no call of this run has read yet: a prompt, the email, a tool result
  handoff  text another agent wrote, read for the first time
  repeat   text that was read before, or the agent's own earlier output sent back
"""

import json
import os
import re
import sys
from dataclasses import dataclass, field
from typing import Optional

# Needed under PYTHONSAFEPATH=1, which keeps the script's directory off sys.path.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import shop

# The prompts. STOCK_LINE is in the lookup prompt and not in the single
# agent's prompt.

STOCK_LINE = "Check the stock before you offer a replacement."

# Every agent gets the shop's context first, and its own prompt after it.
SHOP_CONTEXT = (
    "The shop sells small kitchen and home appliances online and ships them within the country. "
    "Customers write about broken or unwanted items. Replies are short and polite, start with "
    "'Dear customer,' and end with 'Kind regards, the shop'. Never promise a date that the tools "
    "do not confirm."
)

SINGLE_PROMPT = (
    "You answer customer emails for a small shop. Look up the order and the returns policy with "
    "your tools. When the email asks one more question, look up the policy for it too. Then write "
    "the reply."
)
LOOKUP_PROMPT = (
    "You read a customer email. Look up the order and the returns policy with your tools. "
    + STOCK_LINE
    + " Write notes for the writer with the order, what the customer asks for, and what the "
    "tools returned."
)
WRITER_PROMPT = (
    "You write the reply to a customer from the notes of the lookup agent. Answer every point in "
    "the notes."
)
CHECKER_PROMPT = (
    "You check a reply before it is sent. Answer ok when the reply answers every point in the "
    "notes, or name the point that is missing."
)
MANAGER_PROMPT = (
    "You answer customer emails. You have two workers as tools: lookup reads the email and looks "
    "up the order, and writer writes the reply from the notes. Call lookup, then writer, then "
    "return the reply."
)

# Counting.


def count_tokens(text: str) -> int:
    return len(re.findall(r"\w+|[^\w\s]", text))


LABELS = ["new", "handoff", "repeat"]


@dataclass
class Call:
    agent: str
    parts: list[tuple[str, str]]
    output: str


@dataclass
class Run:
    calls: list[Call] = field(default_factory=list)
    read: set = field(default_factory=set)
    written: dict[str, str] = field(default_factory=dict)

    def call(self, agent: str, parts: list[str], output: str) -> None:
        labeled = []
        for text in parts:
            if text in self.read:
                label = "repeat"
            elif text in self.written and self.written[text] != agent:
                label = "handoff"
            elif text in self.written:
                label = "repeat"
            else:
                label = "new"
            self.read.add(text)
            labeled.append((label, text))
        self.written.setdefault(output, agent)
        self.calls.append(Call(agent, labeled, output))

    def tokens(self, label: str) -> int:
        return sum(count_tokens(t) for c in self.calls for lab, t in c.parts if lab == label)

    def written_tokens(self) -> int:
        return sum(count_tokens(c.output) for c in self.calls)

    def total(self) -> int:
        return sum(self.tokens(label) for label in LABELS) + self.written_tokens()


# What the fake models read in a text.


def order_in(text: str) -> str:
    found = re.search(r"[Oo]rder:? (\d{4})", text)
    return found.group(1) if found else ""


def asks_for(text: str) -> str:
    return "refund" if ("money back" in text or "refund" in text) else "replacement"


def extra_topics(email: str) -> list[str]:
    topics = []
    if "bring" in email:
        topics.append("drop-off")
    if "gift card" in email:
        topics.append("gift card")
    return topics


Request = tuple[str, dict[str, str]]


def requests_text(requests: list[Request]) -> str:
    return "\n".join(f"{name} {json.dumps(args)}" for name, args in requests)


def run_tools(requests: list[Request]) -> str:
    return "\n".join(json.dumps(shop.TOOLS[name](**args)) for name, args in requests)


def compose(item: str, days: int, asks: str, stock: Optional[dict], extras: list[str]) -> str:
    """How every fake agent writes a reply, once it knows these facts."""
    lines = ["Dear customer,"]
    if days > 30:
        lines.append(
            f"Returns and refunds are possible within 30 days of delivery, and your {item} "
            f"arrived {days} days ago, so we can't take it back."
        )
    elif asks == "refund":
        lines.append(f"Your refund for the {item} is on its way.")
    elif stock is not None and stock["in_stock"] == 0:
        lines.append(
            f"The {item} is out of stock and back in {stock['back_in_days']} days. We can send a "
            "replacement then, or refund you now."
        )
    else:
        lines.append(f"A replacement {item} is on its way.")
    lines.extend(extras)
    lines.append("Kind regards, the shop")
    return " ".join(lines)


def facts_from_results(results: str) -> tuple[dict, Optional[dict], dict[str, str]]:
    order: dict = {}
    stock: Optional[dict] = None
    policies: dict[str, str] = {}
    for line in results.splitlines():
        result = json.loads(line)
        if "order" in result:
            order = result
        elif "in_stock" in result:
            stock = result
        else:
            policies[result["topic"]] = result["text"]
    return order, stock, policies


# The single agent: one agent, one loop, all the tools.


def single_tools(system: str, email: str) -> list[Request]:
    order_id = order_in(email)
    requests: list[Request] = [
        ("get_order", {"order_id": order_id}),
        ("get_policy", {"topic": "returns"}),
    ]
    requests += [("get_policy", {"topic": t}) for t in extra_topics(email)]
    if STOCK_LINE in system and asks_for(email) == "replacement":
        requests.append(("check_stock", {"order_id": order_id}))
    return requests


def run_single(email: str, system: str = SINGLE_PROMPT) -> tuple[str, Run]:
    run = Run()
    requests = single_tools(system, email)
    asked = requests_text(requests)
    run.call("agent", [SHOP_CONTEXT, system, email], asked)
    results = run_tools(requests)
    order, stock, policies = facts_from_results(results)
    extras = [policies[t] for t in extra_topics(email)]
    reply = compose(
        str(order["item"]), int(order["days_since_delivery"]), asks_for(email), stock, extras
    )
    run.call("agent", [SHOP_CONTEXT, system, email, asked, results], reply)
    return reply, run


# The lookup, writer and checker agents, used by the pipeline and by the manager.


def lookup(run: Run, email: str) -> str:
    order_id = order_in(email)
    asks = asks_for(email)
    requests: list[Request] = [
        ("get_order", {"order_id": order_id}),
        ("get_policy", {"topic": "returns"}),
    ]
    if STOCK_LINE in LOOKUP_PROMPT and asks == "replacement":
        requests.append(("check_stock", {"order_id": order_id}))
    asked = requests_text(requests)
    run.call("lookup", [SHOP_CONTEXT, LOOKUP_PROMPT, email], asked)
    results = run_tools(requests)
    order, stock, policies = facts_from_results(results)
    lines = [
        f"order {order_id}: {order['item']}, delivered {order['days_since_delivery']} days ago",
        f"asks for: {asks}",
        f"policy: {policies['returns']}",
    ]
    if stock is not None:
        lines.append(f"stock: {stock['in_stock']}, back in {stock['back_in_days']} days")
    notes = "\n".join(lines)
    run.call("lookup", [SHOP_CONTEXT, LOOKUP_PROMPT, email, asked, results], notes)
    return notes


def writer(run: Run, notes: str) -> str:
    found = re.search(r": (.+), delivered (\d+) days ago", notes)
    item, days = (found.group(1), int(found.group(2))) if found else ("item", 0)
    stock_line = re.search(r"stock: (\d+), back in (\d+) days", notes)
    stock = None
    if stock_line:
        stock = {"in_stock": int(stock_line.group(1)), "back_in_days": int(stock_line.group(2))}
    asks = re.search(r"asks for: (\w+)", notes)
    reply = compose(item, days, asks.group(1) if asks else "", stock, [])
    run.call("writer", [SHOP_CONTEXT, WRITER_PROMPT, notes], reply)
    return reply


def checker(run: Run, notes: str, reply: str) -> str:
    asks = re.search(r"asks for: (\w+)", notes)
    verdict = "ok" if asks and asks.group(1) in reply else "missing: what the customer asks for"
    run.call("checker", [SHOP_CONTEXT, CHECKER_PROMPT, notes, reply], verdict)
    return verdict


# The pipeline: code runs lookup, the writer and the checker, in that order.


def run_pipeline(email: str) -> tuple[str, Run]:
    run = Run()
    notes = lookup(run, email)
    reply = writer(run, notes)
    checker(run, notes, reply)
    return reply, run


# The manager: a model that calls lookup and writer as tools. A worker's
# result comes back as {"ok": true, "text": ...}.


def worker_result(run: Run, agent: str, text: str) -> str:
    result = json.dumps({"ok": True, "text": text})
    run.written[result] = agent
    return result


def run_manager(email: str) -> tuple[str, Run]:
    run = Run()
    first = f"lookup {json.dumps({'email': email})}"
    run.call("manager", [SHOP_CONTEXT, MANAGER_PROMPT, email], first)
    looked_up = worker_result(run, "lookup", lookup(run, email))
    notes = json.loads(looked_up)["text"]
    second = f"writer {json.dumps({'notes': notes})}"
    run.call("manager", [SHOP_CONTEXT, MANAGER_PROMPT, email, first, looked_up], second)
    written = worker_result(run, "writer", writer(run, notes))
    reply = json.loads(written)["text"]
    run.call(
        "manager", [SHOP_CONTEXT, MANAGER_PROMPT, email, first, looked_up, second, written], reply
    )
    return reply, run


ARRANGEMENTS = {"single": run_single, "pipeline": run_pipeline, "manager": run_manager}
NAMES = {"single": "single agent", "pipeline": "pipeline", "manager": "manager + workers"}


def item(item_id: str) -> shop.Item:
    return next(i for i in shop.GOLDEN if i.id == item_id)


# The steps.


def step_tokens(item_id: str = "g06") -> None:
    email = item(item_id).email
    runs = {key: run(email)[1] for key, run in ARRANGEMENTS.items()}
    base = runs["single"].total()
    print(f"email {item_id}, tokens per arrangement")
    print(f"{'':18} calls   new handoff repeat written  total")
    for key, run in runs.items():
        print(
            f"{NAMES[key]:18} {len(run.calls):5} {run.tokens('new'):5} {run.tokens('handoff'):7}"
            f" {run.tokens('repeat'):6} {run.written_tokens():7} {run.total():6}"
            f"  {run.total() / base:.1f}x"
        )


def one_line(text: str) -> str:
    return text.replace("\n", " / ")


def step_trace(key: str = "pipeline", item_id: str = "g06") -> None:
    golden = item(item_id)
    reply, run = ARRANGEMENTS[key](golden.email)
    print(f"{NAMES[key]}, email {item_id}")
    for number, c in enumerate(run.calls, 1):
        counts = ", ".join(
            f"{label} {sum(count_tokens(t) for lab, t in c.parts if lab == label)}"
            for label in LABELS
            if any(lab == label for lab, _ in c.parts)
        )
        print(f"call {number} {c.agent}: reads {counts}; writes {count_tokens(c.output)}")
        if c.output != reply:
            print(f"  wrote: {one_line(c.output)}")
    print(f"reply: {reply}")
    missing = [p for p in golden.must if p not in reply]
    wrong = [p for p in golden.must_not if p in reply]
    if not missing and not wrong:
        print("graded: pass")
    else:
        why = [f'missing "{p}"' for p in missing] + [f'says "{p}"' for p in wrong]
        print(f"graded: fail, {', '.join(why)}")


def golden_runs(key: str) -> list[tuple[shop.Item, bool, Run]]:
    out = []
    for golden in shop.GOLDEN:
        reply, run = ARRANGEMENTS[key](golden.email)
        out.append((golden, shop.grade(golden, reply), run))
    return out


def step_compare() -> None:
    print(f"golden set, {len(shop.GOLDEN)} emails")
    print(f"{'':25} passed  calls  tokens")
    base = sum(run.total() for _, _, run in golden_runs("single"))
    for key, name in [("single", "single agent"), ("pipeline", "pipeline (three agents)")]:
        runs = golden_runs(key)
        passed = sum(1 for _, ok, _ in runs if ok)
        calls = sum(len(run.calls) for _, _, run in runs)
        tokens = sum(run.total() for _, _, run in runs)
        print(f"{name:25} {passed:2} of {len(runs)} {calls:5} {tokens:7}  {tokens / base:.1f}x")


def step_items() -> None:
    single = golden_runs("single")
    pipeline = golden_runs("pipeline")
    print("email  single agent  pipeline")
    for (golden, one, _), (_, three, _) in zip(single, pipeline):
        print(f"{golden.id}    {'pass' if one else 'fail':12}  {'pass' if three else 'fail'}")


STEPS = {
    "tokens": step_tokens,
    "trace": step_trace,
    "compare": step_compare,
    "items": step_items,
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in STEPS:
        print(f"usage: python3 tax.py <step> [args], where step is one of: {', '.join(STEPS)}")
        print("  tokens [email]              the tokens of each arrangement for one email")
        print(
            "  trace <arrangement> <email> each call of one run, with single, pipeline or manager"
        )
        print("  compare                     the golden-set score and tokens of two arrangements")
        print("  items                       which golden-set emails each arrangement passes")
        sys.exit(2)
    STEPS[sys.argv[1]](*sys.argv[2:])
