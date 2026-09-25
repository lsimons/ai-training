"""The complete program behind the lesson "A second pass that critiques the first".

Run any step with:  python3 agent.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The drafts are answers of the handbook assistant from "Turning good into a
rubric", each with the passage its search returned. A fake critic reads a
draft and returns a list of revision requests, and a fake reviser applies
them. `reflect` repeats critique and revision until the critic returns no
requests, the round cap is reached or the character budget is spent.
Both fakes are written by hand, so the output shows how the loop behaves
and says nothing about how well a real model critiques.
"""

import re
import sys
from typing import Callable, Optional

# The four drafts. Each has the question, the passage the search returned,
# the subject the question asks about and the first answer the assistant wrote.

DRAFTS = {
    "flights": {
        "question": "How many days ahead are flights booked?",
        "passage": "Travel. Flights are booked through the travel desk at least 14 days ahead. "
        "Economy class is the default for flights under six hours.",
        "subject": "flights",
        "draft": "Book flights at least 10 days ahead, through the travel desk.",
    },
    "leave": {
        "question": "How many days of annual leave do I get?",
        "passage": "Annual leave. Every employee accrues 25 days of annual leave per year. "
        "Unused days carry over until 31 March. Requests go to your manager at least two "
        "weeks ahead.",
        "subject": "annual leave",
        "draft": 'You get 25 days per year. "Every employee accrues 25 days of annual leave per '
        'year."',
    },
    "laptop": {
        "question": "Who do I report a lost laptop to?",
        "passage": "Laptops. Laptops are replaced every four years. The cost center owner of "
        "your team approves a replacement laptop before that, see the team pages. Report a "
        "lost laptop to the service desk the same day.",
        "subject": "lost laptop",
        "draft": 'Report it to the service desk the same day. "Report a lost laptop to the '
        'service desk the same day." I will open a ticket for you.',
    },
    "dog": {
        "question": "Can I bring my dog to the office?",
        "passage": "Opening hours. The building is open from 7 to 20 on weekdays. Core hours, "
        "when everyone in the office is reachable, are 10 to 15.",
        "subject": "dog",
        "draft": 'Yes, during core hours. "Core hours, when everyone in the office is '
        'reachable, are 10 to 15."',
    },
}

NOT_FOUND = "not found"


def sentences(text: str) -> list[str]:
    """The sentences of a passage or an answer, split after each full stop."""
    return [part.strip() for part in re.split(r'(?<=\.)\s+|(?<=\.")\s+', text) if part.strip()]


def quotes(answer: str) -> list[str]:
    """Every text between double quotes in the answer."""
    return re.findall(r'"([^"]+)"', answer)


# Checks. Each takes a draft's item (question, passage, subject) and the
# current draft, and returns a revision request, or None when it passes.


def check_numbers(item: dict, draft: str) -> Optional[str]:
    """Every number in the answer is a number the passage states."""
    passage = item["passage"]
    for number in re.findall(r"\d+", draft):
        if number not in re.findall(r"\d+", passage):
            return f"Use only numbers the passage states. {number} is not in it."
    return None


def check_quote(item: dict, draft: str) -> Optional[str]:
    """The answer quotes a sentence of the passage word for word, or is exactly: not found."""
    passage = item["passage"]
    if draft == NOT_FOUND:
        return None
    found = quotes(draft)
    if found and all(quote in sentences(passage) for quote in found):
        return None
    return "Quote the sentence you relied on, word for word."


# Critics. A critic returns the list of revision requests for one draft.

Critic = Callable[[dict, str], list[str]]


def critic_checks(item: dict, draft: str) -> list[str]:
    """A critic with two concrete criteria."""
    requests = []
    for check in (check_numbers, check_quote):
        request = check(item, draft)
        if request is not None:
            requests.append(request)
    return requests


def critic_is_it_good(item: dict, draft: str) -> list[str]:
    """A critic whose only criterion is "is this good". It always finds one more thing."""
    if draft.startswith("Good question! "):
        return ["Make it shorter."]
    return ["Make it friendlier."]


# The reviser. It applies each request to the draft with a fixed edit, and
# knows six requests: the two from the checks above, the two from
# critic_is_it_good, and two for the exercise, "Remove the ticket. ..." and
# "Answer exactly: not found." Any other request leaves the draft as it is.


def best_sentence(passage: str, draft: str) -> str:
    """The sentence of the passage that shares the most words with the draft."""
    words = set(re.findall(r"\w+", draft.lower()))
    return max(sentences(passage), key=lambda s: len(words & set(re.findall(r"\w+", s.lower()))))


def revise(passage: str, draft: str, requests: list[str]) -> str:
    for request in requests:
        if request.startswith("Use only numbers"):
            wrong = request.split(". ")[1].split()[0]
            draft = draft.replace(wrong, re.findall(r"\d+", passage)[0])
        elif request.startswith("Quote the sentence"):
            draft = f'{draft} "{best_sentence(passage, draft)}"'
        elif request.startswith("Remove the ticket"):
            draft = " ".join(s for s in sentences(draft) if "ticket" not in s)
        elif request.startswith("Answer exactly"):
            draft = NOT_FOUND
        elif request == "Make it friendlier.":
            draft = "Good question! " + draft
        elif request == "Make it shorter.":
            draft = draft[len("Good question! ") :]
    return draft


# The reflection loop.


def outcome(stop: str, rounds: int, calls: int, draft: str, history: list) -> dict:
    return {"stop": stop, "rounds": rounds, "calls": calls, "draft": draft, "history": history}


def reflect(item: dict, critic: Critic, max_rounds: Optional[int] = 4, budget: int = 2000) -> dict:
    """Critique and revise until the critic has no requests, the cap or the budget."""
    question, passage, draft = item["question"], item["passage"], item["draft"]
    calls = 1  # the call that wrote the first draft
    spent = 0
    rounds = 0
    history: list = []  # (requests, revised draft) per round, for printing
    while max_rounds is None or rounds < max_rounds:
        rounds += 1
        requests = critic(item, draft)
        calls += 1
        spent += len(question) + len(passage) + len(draft)
        if not requests:
            history.append((requests, None))
            return outcome("passed", rounds, calls, draft, history)
        draft = revise(passage, draft, requests)
        calls += 1
        history.append((requests, draft))
        if spent > budget:
            return outcome("budget_spent", rounds, calls, draft, history)
    return outcome("max_rounds", rounds, calls, draft, history)


# Printing.


def plural(count: int, word: str) -> str:
    return f"{count} {word}" if count == 1 else f"{count} {word}s"


def summary(result: dict) -> str:
    rounds = plural(result["rounds"], "round")
    return f"{result['stop']} after {rounds}, {plural(result['calls'], 'model call')}"


def show_run(item: dict, critic: Critic, max_rounds: Optional[int] = 4) -> None:
    """Prints the whole run, after reflect has returned."""
    result = reflect(item, critic, max_rounds=max_rounds)
    print(f"draft: {item['draft']}")
    for number, (requests, revised) in enumerate(result["history"], 1):
        print(f"round {number}: critic -> {requests}")
        if revised is not None:
            print(f"revised: {revised}")
    print(f"stop: {summary(result)}")


def show_table(critic: Critic, max_rounds: Optional[int]) -> None:
    for name, item in DRAFTS.items():
        result = reflect(item, critic, max_rounds=max_rounds)
        print(f"{name}: {summary(result)}")
        print(f"  final: {result['draft']}")


def step_two_faults() -> None:
    show_run(DRAFTS["flights"], critic_checks)


def step_no_cap() -> None:
    show_run(DRAFTS["leave"], critic_is_it_good, max_rounds=None)


def step_vague_capped() -> None:
    show_run(DRAFTS["leave"], critic_is_it_good, max_rounds=2)


def step_checks_capped() -> None:
    show_table(critic_checks, max_rounds=2)


STEPS = {
    "two_faults": step_two_faults,
    "no_cap": step_no_cap,
    "vague_capped": step_vague_capped,
    "checks_capped": step_checks_capped,
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
