# write-good.Illusions

## Rule

`.vale/styles/write-good/Illusions.yml` extends Vale's `repetition` check.
It tokenizes on `[^\s]+` (any run of non-whitespace, `alpha: true`) and
flags the same token appearing twice in a row (an "illusion of repetition"
like "the the"). Its `action` is `edit`/`truncate` on `" "`, i.e. it would
suggest collapsing the duplicate. The rule ships at `level: warning`. It
has no word list; the check is purely structural (adjacent identical
tokens), not phrase-based.

## Stats

Zero hits in 66365 words.
