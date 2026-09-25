"""The agent behind the lesson "Reading failures one by one".

A handbook assistant for the staff of one office answers questions with two
tools: a keyword search over a small staff handbook, and a calendar of the
office's opening hours. The fixture holds two weeks of its runs. A colleague
checked each answer against the handbook and the calendar, and wrote down the
phrase a correct answer contains.

A real model takes a different path on different runs. A fake model always
takes the same one, so each run has its own scripted model: the list of
replies that run makes, in order. The tools and the loop are real code, so
every tool result in a transcript is what the tool returns for those
arguments. The handbook, the calendar and the questions are illustrative,
written by the author. Nothing needs an API key.
"""

import datetime
import re
from typing import Optional

# The staff handbook the search reads, one page per topic.

HANDBOOK = {
    "annual-leave": (
        "Every employee gets 25 days of annual leave per year. Request leave in the HR portal "
        "at least two weeks ahead."
    ),
    "parking": (
        "The car park under the building has 40 spaces and a rack for bikes. Book a space in "
        "the facilities app."
    ),
    "office-hours": "The office is open from 7:00 to 20:00 on weekdays and is closed at weekends.",
    "guest-network": (
        "The wireless network for guests is called Visitor. Reception has the password."
    ),
    "expenses": (
        "Meals on a work trip are reimbursed up to 40 euros per day. Taxis are reimbursed when "
        "no train or bus goes there."
    ),
    "training": "Each employee has a training budget of 1500 euros per year.",
    "laptops": "Report a lost or broken laptop to the service desk on extension 4400.",
    "remote-work": "You can work from home up to three days per week.",
    "visitors": "Register a visitor at reception by 17:00 on the day before the visit.",
    "access": "Ask reception for a new access card. Bring photo ID.",
}

STOP_WORDS = {
    "a",
    "an",
    "the",
    "i",
    "my",
    "do",
    "can",
    "is",
    "on",
    "to",
    "for",
    "of",
    "what",
    "how",
    "where",
}

# The calendar the opening_hours tool reads: every day that differs from the usual hours.

CLOSURES = {
    "2026-12-24": "open 7:00 to 14:00",
    "2026-12-25": "closed (public holiday)",
    "2026-12-28": "closed (company holiday)",
    "2026-12-29": "closed (company holiday)",
    "2026-12-30": "closed (company holiday)",
    "2026-12-31": "open 7:00 to 14:00",
    "2027-01-01": "closed (public holiday)",
}

# The tools.


def words(text: str) -> list:
    return [w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP_WORDS]


def search_handbook(query: str) -> dict:
    """Return the page that contains the query's words most often, or an error when none does."""
    wanted = set(words(query))
    best, best_score = "", 0
    for page, text in HANDBOOK.items():
        score = sum(1 for w in words(text) if w in wanted)
        if score > best_score:
            best, best_score = page, score
    if best_score == 0:
        return {"error": f"no page matches '{query}'"}
    return {"page": best, "text": HANDBOOK[best]}


def opening_hours(date: str) -> dict:
    """Return the opening hours on one day. The date must be written as YYYY-MM-DD."""
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        return {"error": f"cannot read the date '{date}'"}
    if date in CLOSURES:
        return {"date": date, "hours": CLOSURES[date]}
    if datetime.date.fromisoformat(date).weekday() >= 5:
        return {"date": date, "hours": "closed (weekend)"}
    return {"date": date, "hours": "open 7:00 to 20:00"}


TOOLS = {
    "search_handbook": {
        "fn": search_handbook,
        "description": "Search the staff handbook and return the page that matches best.",
        "parameters": {"query": "Words to search for."},
    },
    "opening_hours": {
        "fn": opening_hours,
        "description": "Get the opening hours of the office on one day, with holiday closures.",
        "parameters": {"date": "The day to check."},
    },
}

# After week 1 the team changed one line, the description of the date parameter, to
# this text. TOOLS above keeps the week 1 description that the lesson shows. The scripted
# replies of week 2 already send dates as YYYY-MM-DD, so this constant only documents it.
DATE_PARAMETER_WEEK_2 = "The day to check, as YYYY-MM-DD, for example 2026-12-24."

# The loop gives up after this many tool calls.
MAX_TOOL_CALLS = 4


def should_stop(reply: dict) -> bool:
    """The run ends when the model's reply has text."""
    return bool(reply.get("text"))


def run(script: list) -> dict:
    """Run one scripted model through the loop and return the steps and the answer."""
    steps = []
    for reply in script:
        if should_stop(reply):
            return {"steps": steps, "answer": reply["text"], "last_reply": reply}
        if len(steps) == MAX_TOOL_CALLS:
            return {
                "steps": steps,
                "answer": "Sorry, I could not find an answer.",
                "last_reply": reply,
            }
        tool = reply["tool"]
        result = TOOLS[tool]["fn"](**reply["args"])
        steps.append({"tool": tool, "args": reply["args"], "result": result})
    raise ValueError("the scripted model ran out of replies")


# Short ways to write a scripted reply.


def search(query: str) -> dict:
    return {"tool": "search_handbook", "args": {"query": query}}


def hours(date: str) -> dict:
    return {"tool": "opening_hours", "args": {"date": date}}


def say(text: str) -> dict:
    return {"text": text}


def note_then_hours(note: str, date: str) -> dict:
    """A reply with a short note and a tool request together."""
    return {"text": note, "tool": "opening_hours", "args": {"date": date}}


# Runs that went well. Each is (question, script, the phrase a correct answer contains).

GOOD = [
    (
        "How many days of annual leave do I get?",
        [search("annual leave days"), say("You get 25 days of annual leave per year.")],
        "25 days",
    ),
    (
        "Is the office open on 2026-12-24?",
        [hours("2026-12-24"), say("Yes, from 7:00 to 14:00 on 24 December.")],
        "14:00",
    ),
    (
        "What is the training budget?",
        [search("training budget"), say("The training budget is 1500 euros per year.")],
        "1500 euros",
    ),
    (
        "How many days can I work from home?",
        [search("work from home days"), say("Up to three days per week.")],
        "three days",
    ),
    (
        "Who do I tell about a lost laptop?",
        [search("lost laptop"), say("The service desk, on extension 4400.")],
        "4400",
    ),
    (
        "How much can I spend on meals on a work trip?",
        [search("meals work trip"), say("Up to 40 euros per day.")],
        "40 euros",
    ),
    (
        "When is the office open?",
        [search("office open"), say("From 7:00 to 20:00 on weekdays.")],
        "7:00 to 20:00",
    ),
    (
        "When must I register a visitor?",
        [search("register visitor"), say("At reception, by 17:00 on the day before.")],
        "17:00",
    ),
    (
        "Is the office open on 2026-12-25?",
        [hours("2026-12-25"), say("No, it is closed for the public holiday.")],
        "closed",
    ),
    (
        "How do I book a parking space?",
        [search("book parking space"), say("Book a space in the facilities app.")],
        "facilities app",
    ),
]

# Week 1 runs 30 questions. Twenty went well and ten failed, in this order.

WEEK_1_FAILED = {
    "a03": (
        "Is the office open on 24 December?",
        [
            hours("24 December"),
            search("office opening hours"),
            say("Yes, the office is open from 7:00 to 20:00 on weekdays."),
        ],
        "14:00",
    ),
    "a06": (
        "Where can I leave my car?",
        [search("leave car"), say("Request leave in the HR portal at least two weeks ahead.")],
        "car park",
    ),
    "a09": (
        "Can I come in on 25/12?",
        [
            hours("25/12"),
            hours("25-12-2026"),
            search("office open"),
            say("Yes, the office is open from 7:00 to 20:00."),
        ],
        "closed",
    ),
    "a11": (
        "Is the office open on 2026-12-31?",
        [
            note_then_hours("Let me check the calendar.", "2026-12-31"),
            say("Yes, from 7:00 to 14:00."),
        ],
        "14:00",
    ),
    "a14": (
        "What is the wifi code?",
        [search("wifi code"), say("The handbook does not say anything about wifi.")],
        "Visitor",
    ),
    "a16": (
        "What time does the office close on New Year's Eve?",
        [hours("New Year's Eve"), search("office hours"), say("The office closes at 20:00.")],
        "14:00",
    ),
    "a20": (
        "Is the office open on Monday 28 December?",
        [
            hours("Monday 28 December"),
            search("office open"),
            say("Yes, it is a weekday, so it is open from 7:00 to 20:00."),
        ],
        "closed",
    ),
    "a22": (
        "Can I expense a taxi?",
        [search("expense taxi"), say("The handbook does not cover taxis, so I cannot say.")],
        "no train or bus",
    ),
    "a26": (
        "Is the office open on the afternoon of Christmas Eve?",
        [
            hours("Christmas Eve"),
            search("office open"),
            say("Yes, the office is open until 20:00."),
        ],
        "14:00",
    ),
    "a29": (
        "Is the office open on 2027-01-01?",
        [
            note_then_hours("I will look that up for you.", "2027-01-01"),
            say("No, it is closed for the public holiday."),
        ],
        "closed",
    ),
}

# Week 2 runs 40 questions with the new date description. Thirty went well and ten failed.

WEEK_2_FAILED = {
    "b02": (
        "What are the rules for working remotely?",
        [search("working remotely rules"), say("The handbook has no page about working remotely.")],
        "three days",
    ),
    "b05": (
        "Is the office open on New Year's Day?",
        [hours("2026-01-01"), say("Yes, the office is open from 7:00 to 20:00.")],
        "closed",
    ),
    "b09": (
        "Is there wifi for my visitor?",
        [search("wifi"), say("The handbook does not mention wifi.")],
        "Visitor",
    ),
    "b12": (
        "Is the office open on 2026-12-24?",
        [
            note_then_hours("One moment, I will check the calendar.", "2026-12-24"),
            say("Yes, from 7:00 to 14:00."),
        ],
        "14:00",
    ),
    "b15": (
        "Can I take a taxi to the airport and claim it?",
        [
            search("taxi airport claim"),
            say("I could not find anything about taxis in the handbook."),
        ],
        "no train or bus",
    ),
    "b19": (
        "Is the office open on 25 December?",
        [hours("2026-12-25"), say("Yes, the office is open from 7:00 to 20:00 on 25 December.")],
        "closed",
    ),
    "b23": (
        "Where can I leave my bike?",
        [search("leave bike"), say("Request leave in the HR portal at least two weeks ahead.")],
        "rack",
    ),
    "b27": (
        "Is the office open on 30 December?",
        [hours("2025-12-30"), say("Yes, it is open from 7:00 to 20:00 on 30 December.")],
        "closed",
    ),
    "b33": (
        "How do I get a new badge?",
        [search("badge"), say("The handbook does not say how to get a badge.")],
        "access card",
    ),
    "b38": (
        "Can I get into the building on 2026-12-29?",
        [
            note_then_hours("Let me look at the opening hours.", "2026-12-29"),
            say("No, it is closed for a company holiday."),
        ],
        "closed",
    ),
}

WEEK_START = {1: datetime.date(2026, 11, 30), 2: datetime.date(2026, 12, 7)}
WEEK_SIZE = {1: 30, 2: 40}
WEEK_FAILED = {1: WEEK_1_FAILED, 2: WEEK_2_FAILED}
WEEK_PREFIX = {1: "a", 2: "b"}


def week_runs(week: int) -> list:
    """Every run of one week in order: the failed runs at their ids, good runs in between."""
    failed = WEEK_FAILED[week]
    size = WEEK_SIZE[week]
    runs = []
    good_index = 0
    for n in range(1, size + 1):
        run_id = f"{WEEK_PREFIX[week]}{n:02d}"
        if run_id in failed:
            question, script, expected = failed[run_id]
        else:
            question, script, expected = GOOD[good_index % len(GOOD)]
            good_index += 1
        day = WEEK_START[week] + datetime.timedelta(days=(n - 1) * 5 // size)
        result = run(script)
        runs.append(
            {
                "id": run_id,
                "day": day,
                "question": question,
                "steps": result["steps"],
                "answer": result["answer"],
                "last_reply": result["last_reply"],
                "expected": expected,
                "passed": expected.lower() in result["answer"].lower(),
            }
        )
    return runs


def find_run(run_id: str) -> Optional[dict]:
    for week in (1, 2):
        for r in week_runs(week):
            if r["id"] == run_id:
                return r
    return None
