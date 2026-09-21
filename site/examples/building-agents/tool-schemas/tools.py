"""The complete program behind the lesson "Writing a tool schema the model uses correctly".

Run any step with:  python3 tools.py <step>   where step is one of the
names in STEPS below. The lesson's Predict checkpoints run these in CI.

The fake model picks a tool by counting the words a request shares with
each tool's description, and it fills a parameter from the request text,
reading the parameter's schema to see which values are allowed.
"""

import re
import sys

# Filler words the fake model ignores when it compares a request with a
# description.
FILLER = {"a", "an", "the", "by", "for", "or", "and", "to", "of", "with"}


def words(text):
    """Lowercase words of a text, minus filler and minus a plural s.

    A tool name such as search_customers is one word, so naming another
    tool in a description does not borrow its words.
    """
    return {w.rstrip("s") for w in re.findall(r"[a-z0-9_]+", text.lower())} - FILLER


def choose_tool(request, tools):
    """The tool whose description shares the most words with the request.

    On a tie, the first tool in the list wins.
    """
    scores = [(len(words(request) & words(tool["description"])), tool["name"]) for tool in tools]
    best = max(score for score, _ in scores)
    return next(name for score, name in scores if score == best)


CURRENCY_WORDS = {"euros", "euro", "dollars", "dollar", "pounds", "pound"}


def fill_currency(request, schema):
    """The fake model's value for a `currency` parameter.

    With an enum it picks the allowed value the request mentions. Without
    one it writes the code the way it has seen codes written, in capitals.
    """
    mentioned = next(
        w.rstrip(".?") for w in request.lower().split() if w.rstrip(".?") in CURRENCY_WORDS
    )
    if "enum" in schema:
        return next(code for code in schema["enum"] if mentioned.startswith(code))
    return mentioned[:3].upper()


# The customer tools. The functions are stubs. The lesson is about the
# descriptions the model reads.
CUSTOMERS = {4711: "Vos", 3120: "Okafor", 9001: "Lindqvist"}


def get_customer(account_id):
    return CUSTOMERS.get(account_id, f"no account {account_id}")


def search_customers(query):
    return [name for name in CUSTOMERS.values() if query.lower() in name.lower()]


VAGUE_TOOLS = [
    {
        "name": "get_customer",
        "description": "Get customer.",
        "fn": get_customer,
    },
    {
        "name": "search_customers",
        "description": "Search customers. Matches name, email, city or account id.",
        "fn": search_customers,
    },
]

CLEAR_TOOLS = [
    {
        "name": "get_customer",
        "description": (
            "Look up one customer by exact account id, an integer such as 8842. "
            "Returns the full record for that id. "
            "Use search_customers instead when you do not have the account id."
        ),
        "fn": get_customer,
    },
    VAGUE_TOOLS[1],
]

# Six requests and the tool each one should reach.
REQUESTS = [
    ("Look up the customer with account id 4711", "get_customer"),
    ("Pull up the record for account id 3120", "get_customer"),
    ("Show the email and current balance of account id 4711", "get_customer"),
    ("Search customers by name for Vos", "search_customers"),
    ("Search for customers with an email at example.org", "search_customers"),
    ("List the customers in the city of Utrecht", "search_customers"),
]


def wrong_calls(tools):
    """The requests the fake model sends to the wrong tool."""
    return [request for request, expected in REQUESTS if choose_tool(request, tools) != expected]


def report():
    before = wrong_calls(VAGUE_TOOLS)
    after = wrong_calls(CLEAR_TOOLS)
    lines = [
        f"wrong calls before: {len(before)} of {len(REQUESTS)}",
        f"wrong calls after: {len(after)} of {len(REQUESTS)}",
    ]
    lines.extend(f"still wrong: {request}" for request in after)
    return "\n".join(lines)


# The balance tool, in two versions that differ only in the currency schema.
BALANCES = {(4711, "eur"): "250.00", (4711, "usd"): "271.50", (4711, "gbp"): "214.20"}


def get_balance(account_id, currency):
    amount = BALANCES.get((account_id, currency))
    if amount is None:
        return f"unknown currency: {currency}"
    return f"{account_id}: {amount} {currency}"


FREE_TEXT_SCHEMA = {
    "type": "object",
    "properties": {
        "account_id": {"type": "integer"},
        "currency": {"type": "string"},
    },
    "required": ["account_id", "currency"],
}

ENUM_SCHEMA = {
    "type": "object",
    "properties": {
        "account_id": {
            "type": "integer",
            "description": "The customer's account id, such as 4711.",
        },
        "currency": {
            "type": "string",
            "enum": ["eur", "usd", "gbp"],
            "description": "Lowercase currency code. The balance is converted into this currency.",
        },
    },
    "required": ["account_id", "currency"],
}


def call_balance(request, schema):
    """The fake model fills the arguments from the request, then the tool runs."""
    digits = re.search(r"\d+", request)
    if digits is None:
        return "no account id in the request"
    account_id = int(digits.group())
    currency = fill_currency(request, schema["properties"]["currency"])
    return get_balance(account_id, currency)


BALANCE_REQUEST = "What is the balance of account 4711 in euros?"

STEPS = {
    "pick_vague": lambda: print(choose_tool(REQUESTS[0][0], VAGUE_TOOLS)),
    "pick_clear": lambda: print(choose_tool(REQUESTS[0][0], CLEAR_TOOLS)),
    "balance_free": lambda: print(call_balance(BALANCE_REQUEST, FREE_TEXT_SCHEMA)),
    "balance_enum": lambda: print(call_balance(BALANCE_REQUEST, ENUM_SCHEMA)),
    "count": lambda: print(report()),
}

if __name__ == "__main__":
    STEPS[sys.argv[1]]()
