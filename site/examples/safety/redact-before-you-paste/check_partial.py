"""Show what a half-done redaction still gives away.

A colleague redacted the lesson's email by hand: they shortened the
customer's name to initials and took the phone number and the email address
out. The script checks the result for the details from the original that
would let someone work out who the customer is, and prints the ones it
finds.

    python3 check_partial.py
"""

PARTIAL = """\
From: R. A.
To: support@norrbeck-appliances.example
Subject: Dishwasher still leaking after repair (account NB-4471-0928)

Hello,

Your technician Tijmen Boskoorn came by on Tuesday to fix the leak in our
dishwasher, a Norrbeck D410. It worked for two days and now the water is
back under the sink. I leave for work at 7:30, so please call me before
that, or write back.

Kind regards,
R. A.
Zwolle
"""

# What to look for, and the label the report uses for it, in report order.
IDENTIFYING = [
    ("name", "Renske Adelhof"),
    ("initials", "R. A."),
    ("phone", "+31 6 1234 5678"),
    ("email", "renske.adelhof@example.net"),
    ("account number", "NB-4471-0928"),
    ("street", "Kastanjelaan 12"),
    ("city", "Zwolle"),
    ("technician", "Tijmen Boskoorn"),
]


def still_identifying(text: str) -> "list[str]":
    """Return the labels of the identifying details that are still in `text`."""
    return [label for label, value in IDENTIFYING if value in text]


if __name__ == "__main__":
    print("still identifying: " + ", ".join(still_identifying(PARTIAL)))
