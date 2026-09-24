"""The keyword search behind the lesson "Answers from documents the model never saw".

A small retrieval step over the four policy texts in `policies/`. The
question is split into words, common words are dropped, and each document
is scored by how many of the remaining words it contains. The best-scoring
document is the one a retrieval assistant would paste into the prompt. The
lesson page shows the output this prints, one block per question.

Run all three questions with:  python3 keyword_search.py
"""

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
POLICIES = HERE / "policies"

# Words too common to tell one document from another.
STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "away",
    "can",
    "do",
    "for",
    "from",
    "get",
    "how",
    "i",
    "is",
    "many",
    "much",
    "my",
    "of",
    "the",
    "to",
    "what",
    "when",
    "who",
}

QUESTIONS = [
    "How many days of annual leave do I get?",
    "How much holiday can I take?",
    "What is the daily rate for working away from the office?",
]


def words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def keywords(question: str) -> list[str]:
    return sorted(set(words(question)) - STOPWORDS)


def load_policies() -> dict[str, str]:
    return {
        p.name: p.read_text(encoding="utf-8").strip()
        for p in sorted(POLICIES.iterdir())
        if p.is_file()
    }


def score(document: str, terms: list[str]) -> int:
    present = set(words(document))
    return sum(1 for term in terms if term in present)


def search(question: str, documents: dict[str, str]) -> list[str]:
    terms = keywords(question)
    lines = [f"question: {question}", f"keywords: {', '.join(terms)}"]
    scores = {name: score(text, terms) for name, text in documents.items()}
    for name, hits in scores.items():
        noun = "match" if hits == 1 else "matches"
        lines.append(f"  {name}: {hits} {noun}")
    best = max(scores, key=lambda name: scores[name])  # the first document wins a tie
    if scores[best] == 0:
        lines.append("retrieved: nothing, no document contains any of the keywords")
    else:
        lines.append(f"retrieved: {best}")
        lines.append(f"passage: {documents[best]}")
    return lines


def main() -> None:
    documents = load_policies()
    blocks = ["\n".join(search(question, documents)) for question in QUESTIONS]
    print("\n\n".join(blocks))


if __name__ == "__main__":
    main()
