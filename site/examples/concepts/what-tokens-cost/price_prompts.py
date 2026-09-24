"""Price a short prompt and a long one, for the lesson "What every token costs".

Run it with no argument and it prices the two built-in prompts below at the
example prices in PRICES. Run it on your own prompt to see its estimated
token count and its price:   python3 price_prompts.py prompt.txt

Every number here is an estimate or an example. The token rule is the
common rule of thumb for English, about four characters per token, the same
rule the lesson "What the model can see" uses: a word of up to six
characters is one token, a longer word is one token per four characters
(rounded up), and every punctuation mark is a token of its own. Vendors
publish the exact tokenizer and the current prices; PRICES holds round
example numbers for "a small model" and "a large model", not a quote.
"""

import math
import re
import sys

CHARS_PER_TOKEN = 4
ONE_TOKEN_WORD = 6

# A piece is a run of letters and digits, or a single mark of punctuation.
PIECE = re.compile(r"\w+|[^\w\s]")

# Example prices in dollars per million tokens: (input, output). Vendors
# charge more for a token the model writes than for one it reads.
PRICES = {
    "small model": (0.6, 3.0),
    "large model": (6.0, 30.0),
}

# The model's answer is priced at the output rate. The lesson assumes the
# same five-bullet summary, about 120 tokens, for every call.
ANSWER_TOKENS = 120

# The lesson's team wants a summary of every meeting, about a thousand a month.
CALLS_PER_MONTH = 1_000

SHORT_PROMPT = """\
Summarize these meeting notes in five bullet points for the finance team.
Keep each bullet under 20 words.

Meeting notes, project Lantern, 14 March.
Present: Ana, Bram, Chidi. The supplier moved the delivery of the sensor
boards from April to June. Ana will confirm the June date in writing by
Friday. The installation guide needs a shorter version with one photo per
step. The pilot in the Utrecht warehouse moves to July. Next meeting on
28 March.
"""

LONG_PROMPT = """\
Hello! I hope you are doing well today. I have a task for you and I would
really appreciate your help with it. I work in a company that runs a
project called Lantern, which is about installing sensor boards in
warehouses, and we have regular meetings about it. I have the notes from
our latest meeting below and I need a summary of them. The summary is for
the finance team, so please keep that in mind. I think five bullet points
would be a good length, and it would be great if each bullet point was not
too long, maybe under 20 words or so, because the finance team does not
have a lot of time to read long documents. Please make sure to include the
most important points. Thank you so much in advance for your help, I really
appreciate it!

Here are the notes:

Meeting notes, project Lantern, 14 March.
Present: Ana, Bram, Chidi. Ana opened the meeting and reported that the
supplier has moved the delivery of the sensor boards from April to June.
Bram asked whether the June date is firm. Ana will confirm the June date in
writing by Friday. Chidi showed the first draft of the installation guide
and the team asked for a shorter version with one photo per step. After
some discussion, the team decided that the pilot in the Utrecht warehouse
moves to July. The next meeting is on 28 March, in the same room as
before.

Please let me know if you need any more information. Thanks again!
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


def price(prompt_tokens: int, answer_tokens: int, model: str, calls: int = 1) -> float:
    """Return the price in dollars of `calls` calls at the example prices of `model`."""
    input_price, output_price = PRICES[model]
    per_call = (prompt_tokens * input_price + answer_tokens * output_price) / 1_000_000
    return per_call * calls


def report(prompts: "dict[str, str]") -> str:
    """Return the report the lesson shows: token counts, then a price per prompt and model."""
    counts = {name: estimate_tokens(text) for name, text in prompts.items()}
    lines = [f"{name}: {tokens} tokens (estimate)" for name, tokens in counts.items()]
    if len(counts) == 2:
        low, high = sorted(counts.values())
        lines.append(f"difference: {high - low} tokens")
    lines.append(f"answer: {ANSWER_TOKENS} tokens (assumed)")
    lines.append("")
    lines.append(f"{'':26}{'one call':>10}{f'{CALLS_PER_MONTH:,} calls':>16}")
    for model in PRICES:
        for name, tokens in counts.items():
            one = price(tokens, ANSWER_TOKENS, model)
            month = price(tokens, ANSWER_TOKENS, model, CALLS_PER_MONTH)
            lines.append(f"{model + ', ' + name:26}{f'${one:.4f}':>10}{f'${month:,.2f}':>16}")
    return "\n".join(lines)


def main(argv: "list[str]") -> None:
    if len(argv) > 1:
        with open(argv[1], encoding="utf-8") as handle:
            prompts = {"your prompt": handle.read()}
    else:
        prompts = {"short prompt": SHORT_PROMPT, "long prompt": LONG_PROMPT}
    print(report(prompts))


if __name__ == "__main__":
    main(sys.argv)
