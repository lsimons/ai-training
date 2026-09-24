"""Resolve the citations in a model-written paragraph against an offline bibliography.

The fixture behind the lesson "Following a claim back to its source". A chat
assistant wrote a paragraph for a briefing and put two references after its
claims. The program looks each reference up in a small bibliography kept in
this file, and for each one prints whether the report exists, and when it
does, what the report says next to what the paragraph says it says.

Nothing here talks to a model. The bibliography holds one real report, the
2025 AI Index Report by Stanford HAI, and the finding recorded for it is
copied from the report's public page. The paragraph and both of its
citations were written for the lesson. The second cited report does not
exist, and the finding the paragraph attributes to the real report is
invented.
"""

# The paragraph as the assistant wrote it, one claim per line, each with
# the citation the assistant attached to it. The wording of a claim is what
# the paragraph says the report says.
PARAGRAPH = [
    (
        "78% of organizations that used AI in 2024 reported a measurable productivity gain",
        "Stanford HAI, The 2025 AI Index Report",
    ),
    (
        "desk workers who use AI daily save an average of 5.4 hours a week",
        "Nordholm Institute, Desk Work and AI Survey 2024",
    ),
]

# The offline bibliography: the report's name as the paragraph cites it, and
# the finding the report itself states on its public page.
BIBLIOGRAPHY = {
    "Stanford HAI, The 2025 AI Index Report": (
        "78% of organizations reported using AI in 2024, up from 55% the year before"
    ),
}


def resolve(claim: str, citation: str, bibliography: "dict[str, str]") -> "list[str]":
    """Return the report lines for one claim and its citation."""
    if citation not in bibliography:
        return [f"NOT FOUND   {citation}", f"            text says:   {claim}"]
    return [
        f"FOUND       {citation}",
        f"            text says:   {claim}",
        f"            report says: {bibliography[citation]}",
    ]


def summary(paragraph: "list[tuple[str, str]]", bibliography: "dict[str, str]") -> str:
    """Return the closing line: how many citations exist and how many claims match."""
    exists = sum(1 for _, citation in paragraph if citation in bibliography)
    # The compare is exact: a claim matches only when it repeats the recorded finding word for word.
    matches = sum(1 for claim, citation in paragraph if bibliography.get(citation) == claim)
    counts = f"citations: {len(paragraph)}  reports found: {exists}"
    return f"{counts}  claims that match the report: {matches}"


def main() -> None:
    for claim, citation in PARAGRAPH:
        for line in resolve(claim, citation, BIBLIOGRAPHY):
            print(line)
    print(summary(PARAGRAPH, BIBLIOGRAPHY))


if __name__ == "__main__":
    main()
