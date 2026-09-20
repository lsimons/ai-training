"""Estimate the token count of a text, for the lesson "What the model can see".

Run it on your own text:   python3 count_tokens.py page.txt
Run it with no argument and it counts the sample paragraph below.

This is an estimate. Every vendor has its own tokenizer, and only that
tokenizer gives the exact count for its models. The rule used here is the
common rule of thumb for English, about four characters per token: a word
of up to six characters is one token, a longer word is one token per four
characters (rounded up), and every punctuation mark is a token of its own.
"""

import math
import re
import sys

CHARS_PER_TOKEN = 4
ONE_TOKEN_WORD = 6

# A piece is a run of letters and digits, or a single mark of punctuation.
# Whitespace is not a piece: the space before a word is part of that word's
# token in most real tokenizers.
PIECE = re.compile(r"\w+|[^\w\s]")

SAMPLE = """\
Meeting notes, project Lantern, 14 March.

Present: Ana, Bram, Chidi. Ana reported that the supplier moved the delivery
of the sensor boards from April to June. Bram asked whether the June date is
firm. Ana will confirm it in writing by Friday. Chidi showed the first draft
of the installation guide; the team asked for a shorter version with one
photo per step. Decision: the pilot in the Utrecht warehouse moves to July.
Next meeting on 28 March, same room.
"""


def estimate_tokens(text: str) -> int:
    """Return the estimated number of tokens in `text`."""
    total = 0
    for piece in PIECE.findall(text):
        if not piece[0].isalnum() or len(piece) <= ONE_TOKEN_WORD:
            total += 1
        else:
            total += math.ceil(len(piece) / CHARS_PER_TOKEN)
    return total


def report(text: str) -> str:
    """Return the three-line report the lesson shows."""
    return "\n".join(
        [
            f"characters: {len(text)}",
            f"words: {len(text.split())}",
            f"tokens (estimate): {estimate_tokens(text)}",
        ]
    )


def main(argv: "list[str]") -> None:
    if len(argv) > 1:
        with open(argv[1], encoding="utf-8") as handle:
            text = handle.read()
    else:
        text = SAMPLE
    print(report(text))


if __name__ == "__main__":
    main(sys.argv)
