"""The document, the redaction map and the two operations the lesson
"Redacting a document before you paste it" runs.

Every person and company here is invented. The email is a support request
about a leaking dishwasher, and the task the lesson runs on it (draft a
reply that offers a second visit and asks for a time window) needs none of
the names, numbers or addresses in it.

The scripts next to this file import it: `redact.py` prints the redacted
email, `check_partial.py` shows what a half-done redaction leaves in, and
`restore.py` puts the real values back into a reply drafted on the
redacted text.
"""

EMAIL = """\
From: Renske Adelhof <renske.adelhof@example.net>
To: support@norrbeck-appliances.example
Subject: Dishwasher still leaking after repair (account NB-4471-0928)

Hello,

Your technician Tijmen Boskoorn came by on Tuesday to fix the leak in our
dishwasher, a Norrbeck D410. It worked for two days and now the water is
back under the sink. I leave for work at 7:30, so please call me on
+31 6 1234 5678 before that, or write back. My account number is
NB-4471-0928.

Kind regards,
Renske Adelhof
Kastanjelaan 12, Zwolle
"""

# One row per value the task does not need: the text as it appears in the
# document, and the placeholder that replaces it. The same placeholder is
# used everywhere the value appears, so the redacted text still says which
# person did what.
MAP = [
    ("Renske Adelhof", "Person 1"),
    ("renske.adelhof@example.net", "[email]"),
    ("Tijmen Boskoorn", "Person 2"),
    ("+31 6 1234 5678", "[phone]"),
    ("NB-4471-0928", "[account number]"),
    ("Kastanjelaan 12, Zwolle", "[address]"),
]


def redact(text: str, replacements: "list[tuple[str, str]]") -> str:
    """Replace every value in `replacements` with its placeholder.

    Longer values go first, so a value that contains a shorter one (a full
    name that contains a first name) is replaced whole.
    """
    for value, placeholder in sorted(replacements, key=lambda row: -len(row[0])):
        text = text.replace(value, placeholder)
    return text


def restore(text: str, replacements: "list[tuple[str, str]]") -> str:
    """Put the real values back for every placeholder that appears in `text`.

    Longer placeholders go first, so `Person 10` is restored whole and not
    as `Person 1` followed by a `0`.
    """
    for value, placeholder in sorted(replacements, key=lambda row: -len(row[1])):
        text = text.replace(placeholder, value)
    return text


def read_map(path: str) -> "list[tuple[str, str]]":
    """Read a map file: one `value => placeholder` per line, blank lines skipped."""
    rows = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            value, separator, placeholder = line.partition(" => ")
            if not separator:
                raise SystemExit(f"map line without ' => ': {line}")
            rows.append((value, placeholder))
    return rows
