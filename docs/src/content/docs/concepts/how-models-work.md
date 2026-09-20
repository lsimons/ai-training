---
title: How a language model works
description: What a language model actually does when it answers, why that explains its strengths, and why it explains its failures too.
mode: explanation
serves:
  - concepts/how-models-work/explains-generation
  - concepts/how-models-work/names-failure-modes
---

<div data-lesson="concepts/how-models-work" hidden></div>

You type a question, and a paragraph comes back that reads like a person
wrote it. It is tempting to picture a mind on the other side that looked up
the answer. Nothing like that happens. This lesson replaces that picture
with the real one, which is simpler and explains more: a language model
predicts the next piece of text, one piece at a time.

## Text becomes tokens

A model never sees letters or words. Its input is cut into **tokens**, short
chunks of text that are usually a word, part of a word or a punctuation
mark. "Unbelievable" might be three tokens; "the" is one. Each token has a
number, and the model works only with those numbers.

This has consequences you will notice. Models are bad at counting letters
in a word, because they never saw the letters. They are priced per token,
not per word. And code, rare names and non-English text cost more tokens
than plain English, because the token vocabulary was built mostly from
English prose.

## One token at a time

Given the tokens so far, the model outputs a score for every token in its
vocabulary: how likely is each one to come next? Those scores become a
probability distribution. One token is picked from it, appended to the
input, and the whole thing runs again. A hundred-word answer is a hundred
or so rounds of "what comes next?".

Try it. The widget below is a toy with five candidate tokens and made-up
scores, but the mechanism is the real one.

<div class="not-content" id="sampler">
  <p><strong>The cat sat on the</strong> …</p>
  <label>Temperature <input type="range" min="0.05" max="2" step="0.05" value="1"> <span class="tval">1.00</span></label>
  <div class="bars"></div>
  <button type="button">Sample next token</button>
  <p class="gen"></p>
</div>
<script src="/ai-training/spike/sampler.js" defer></script>

Two things to notice. The distribution is fixed by the input; only the
*pick* is random. And **temperature** does not add knowledge, it only
flattens or sharpens the same distribution. At low temperature the model
almost always picks the top token and sounds confident and repetitive. At
high temperature it wanders.

<div class="pitfall not-content">
<strong>Pitfall: asking the model why.</strong> You ask a model to solve a
puzzle, it gets it wrong, and you ask "why did you say that?". It produces a
fluent explanation. That explanation is <em>also</em> next-token prediction
conditioned on your question. It is a plausible story about the earlier
text, not a readout of what happened inside. Rule: treat self-explanations
as new output to be checked, not as evidence.
</div>

## Where the scores come from

The scores are produced by a neural network with billions of adjustable
numbers, the **weights**. During training the network reads enormous
amounts of text and is nudged, each time, so that the token that really
came next scores higher. Nothing is stored as facts or rules. What emerges
is a compressed statistical model of the text it saw: grammar, style,
common facts, common code, common arguments.

That is why models know a great deal about things that appear often in
writing and are unreliable about things that appear rarely, recently, or
only in your company's private documents. Knowledge is frequency-weighted
and frozen at the training cutoff.

<div class="checkpoint not-content" data-checkpoint="what-the-model-does" data-kind="choice">
<span class="cp-kind">Checkpoint · choice</span><span class="cp-state"></span>
<p>A colleague says: "The model looked up the answer in its database and
returned it." Which correction is right?</p>
<label data-why="Weights are not a database. Nothing is stored as retrievable records; the network produces scores for next tokens."><input type="radio" name="q1"> It looked the answer up, but the database is called the weights.</label>
<label data-correct><input type="radio" name="q1"> It produced the answer token by token, each time scoring what text is likely to come next.</label>
<label data-why="Search is a separate tool some products add on top. The model itself only predicts tokens; it has no built-in search."><input type="radio" name="q1"> It searched the web and summarised the results.</label>
<label data-why="There is no reasoning step separate from generation. Any reasoning happens as generated text, one token at a time."><input type="radio" name="q1"> It reasoned about the question first, then wrote the answer down.</label>
<button type="button" class="cp-check">Check</button>
<button type="button" class="cp-hint-btn">Hint</button>
<button type="button" class="cp-skip">Skip</button>
<div class="cp-hint" hidden>Look back at the widget. What is the one operation it performs, over and over?</div>
<div class="cp-feedback" aria-live="polite"></div>
</div>

## Failure modes, named

Once you see generation as prediction, the famous failures stop being
mysterious.

- **Hallucination.** The most likely continuation of "The 2019 paper by
  Smith et al. showed" is a plausible citation, whether or not one exists.
  Confidence in the prose is not confidence in the fact.
- **Sycophancy.** Text that agrees with the questioner is common in
  training data. Push back and the model often folds, not because you were
  right but because folding is likely text.
- **Instruction dilution.** Everything in the context is just tokens.
  A rule you stated on page one competes with everything said since; long
  conversations drift.
- **Cutoff and staleness.** Anything after training is invisible unless a
  tool puts it in the context.

<div class="checkpoint not-content" data-checkpoint="name-the-failure" data-kind="choice">
<span class="cp-kind">Checkpoint · choice</span><span class="cp-state"></span>
<p>You ask for the release date of a library version that came out last
month. The model answers with a specific date, stated confidently, and it
is wrong. Which failure mode is the best name for this?</p>
<label data-why="Sycophancy is agreeing with the user. Nobody suggested a date here."><input type="radio" name="q2"> Sycophancy</label>
<label data-correct><input type="radio" name="q2"> Hallucination driven by the training cutoff</label>
<label data-why="Nothing in the conversation was long enough to dilute; this is a single question."><input type="radio" name="q2"> Instruction dilution</label>
<label data-why="Tokenisation affects things like counting letters, not knowledge of recent events."><input type="radio" name="q2"> A tokenisation problem</label>
<button type="button" class="cp-check">Check</button>
<button type="button" class="cp-hint-btn">Hint</button>
<button type="button" class="cp-skip">Skip</button>
<div class="cp-hint" hidden>When did the model's training data end, and when did the event happen?</div>
<div class="cp-feedback" aria-live="polite"></div>
</div>

## Exercise

Open any chat assistant you have access to. Ask it to count the letter "r"
in "strawberry" and to spell the word backwards. Then ask it for the
opening sentence of a book you know well. Note which answers are right and,
for the wrong ones, which failure mode from this lesson explains it.

**Stretch:** ask the assistant to explain why it got one of them wrong, then
decide whether you believe the explanation and why.

## Recap

1. Input is tokens, not words; that alone explains several odd weaknesses.
2. Output is one token at a time, sampled from a distribution the model
   scores; temperature reshapes the distribution and adds nothing.
3. The scores come from weights fitted to training text, so knowledge is
   frequency-weighted and stops at the cutoff.
4. Hallucination, sycophancy, dilution and staleness all follow from that.

You can now explain how a model generates text and name its main failure
modes.

**Next:** [Why agent safety is different](/concepts/) (not yet written; the
course page shows what exists).

<div class="not-content"><button type="button" class="recap-finish" data-finish>Mark lesson finished</button></div>
<script src="/ai-training/spike/lesson.js" defer></script>
