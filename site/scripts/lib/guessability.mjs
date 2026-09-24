/**
 * The surface-cue check (spec S03 "Checkpoints", "Writing distractors"): a
 * `choice`, `scenario` or `multi-choice` item must not be answerable from
 * the look of its options alone. Pure functions over the export items
 * (`{lesson, id, kind, stem, options, answer, guessable}`), called from
 * checkpoints.mjs and covered by tests/scripts/guessability.test.ts.
 *
 * Four heuristics, each a failure:
 *
 * - `longest`: the correct option is more than 40 percent longer than the
 *   longest wrong option (for `multi-choice`, the mean length of the correct
 *   options against the mean of the wrong ones).
 * - `hedge`: the correct option is the only one with a hedge word from
 *   `HEDGES` (`usually`, `may`, `depends`, ...).
 * - `echo`: the correct option is the only one sharing a content word (four
 *   or more letters, not in `STOPWORDS`) with the stem.
 * - `fixed-position`: within one lesson, three or more `choice`/`scenario`
 *   items and the correct option sits at the same index in all of them.
 *
 * An item with `guessable="reason"` is skipped and listed in `exemptions`
 * so the opt-out stays visible in the check output. A `guessable` on an
 * item that trips nothing is itself an error, so stale exemptions go.
 */

/** Kinds the heuristics apply to. */
export const GUESSABLE_KINDS = new Set(['choice', 'scenario', 'multi-choice']);

/** The correct option is longer than the longest wrong one by more than this ratio. */
export const LONGEST_RATIO = 1.4;

/** Hedge words and phrases; the key must not be the only option that hedges. */
export const HEDGES = [
	'usually',
	'often',
	'may',
	'might',
	'depends',
	'in most cases',
	'typically',
	'generally',
	'sometimes',
	'not always',
];

/** Common words that don't count as a content word shared between stem and option. */
export const STOPWORDS = new Set([
	'that',
	'this',
	'with',
	'from',
	'what',
	'which',
	'when',
	'where',
	'will',
	'would',
	'should',
	'could',
	'have',
	'has',
	'does',
	'into',
	'than',
	'then',
	'them',
	'they',
	'their',
	'there',
	'these',
	'those',
	'your',
	'yours',
	'about',
	'because',
	'while',
	'only',
	'also',
	'each',
	'every',
	'here',
	'more',
	'most',
	'some',
	'such',
	'over',
	'same',
	'other',
	'been',
	'being',
	'were',
	'make',
	'makes',
	'made',
	'want',
	'wants',
	'like',
	'just',
	'still',
	'both',
	'after',
	'before',
	'again',
	'says',
	'said',
	'asks',
	'asked',
	'tell',
	'tells',
	'told',
	'know',
	'knows',
	'need',
	'needs',
	'give',
	'gives',
	'take',
	'takes',
	'gets',
	'goes',
	'going',
	'right',
	'wrong',
	'true',
	'false',
	'best',
	'next',
	'first',
	'last',
	'much',
	'many',
	'very',
	'well',
	'thing',
	'things',
	'something',
	'anything',
	'nothing',
	'someone',
	'colleague',
	'option',
	'options',
	'answer',
	'question',
	'statement',
	'following',
	'correct',
	'describes',
	'below',
	'above',
]);

/** Lower-case words of four or more letters in `text`, minus stopwords. Markdown and code marks are dropped. */
export function contentWords(text) {
	const words = text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? [];
	return new Set(words.map((w) => w.replace(/^'+|['-]+$/g, '')).filter((w) => w.length >= 4 && !STOPWORDS.has(w)));
}

/** Whether `text` contains a hedge from `HEDGES` as a whole word or phrase. */
export function hasHedge(text) {
	const t = ` ${text.toLowerCase().replace(/[^a-z]+/g, ' ')} `;
	return HEDGES.some((h) => t.includes(` ${h} `));
}

/** The correct and wrong option texts of one item, or null when the kind is out of scope or the data is not usable. */
export function splitOptions(item) {
	if (!GUESSABLE_KINDS.has(item?.kind) || !Array.isArray(item.options)) return null;
	const answers = new Set(Array.isArray(item.answer) ? item.answer : [item.answer]);
	const correct = item.options.filter((o) => answers.has(o));
	const wrong = item.options.filter((o) => !answers.has(o));
	if (correct.length === 0 || wrong.length === 0) return null;
	return { correct, wrong };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * The per-item heuristic names (`longest`, `hedge`, `echo`) an item trips.
 * `fixed-position` needs the whole lesson; see `fixedPositionLessons`.
 */
export function itemCues(item) {
	const split = splitOptions(item);
	if (!split) return [];
	const { correct, wrong } = split;
	const cues = [];
	const correctLength = mean(correct.map((o) => o.length));
	const wrongLength =
		item.kind === 'multi-choice' ? mean(wrong.map((o) => o.length)) : Math.max(...wrong.map((o) => o.length));
	if (correctLength > wrongLength * LONGEST_RATIO) cues.push('longest');
	if (correct.every(hasHedge) && !wrong.some(hasHedge)) cues.push('hedge');
	const stemWords = contentWords(item.stem ?? '');
	const echoes = (o) => [...contentWords(o)].some((w) => stemWords.has(w));
	if (stemWords.size > 0 && correct.every(echoes) && !wrong.some(echoes)) cues.push('echo');
	return cues;
}

/**
 * The lessons in which three or more `choice`/`scenario` items all have the
 * correct option at the same index, with that index. Exempted items are
 * skipped when `skipExempt` is true.
 */
export function fixedPositionLessons(items, skipExempt = true) {
	const byLesson = new Map();
	for (const item of items) {
		if (item.kind !== 'choice' && item.kind !== 'scenario') continue;
		if (skipExempt && typeof item.guessable === 'string') continue;
		if (!Array.isArray(item.options)) continue;
		const index = item.options.indexOf(item.answer);
		if (index === -1) continue;
		if (!byLesson.has(item.lesson)) byLesson.set(item.lesson, []);
		byLesson.get(item.lesson).push(index);
	}
	const out = [];
	for (const [lesson, indexes] of byLesson) {
		if (indexes.length >= 3 && indexes.every((i) => i === indexes[0]))
			out.push({ lesson, index: indexes[0], count: indexes.length });
	}
	return out;
}

/**
 * Check every item. Returns `{ errors, exemptions }`: `errors` are the
 * messages for items that trip a heuristic and for stale exemptions, and
 * `exemptions` one line per `guessable` item with its reason.
 */
export function checkGuessability(items) {
	const errors = [];
	const exemptions = [];
	const positionAll = new Set(fixedPositionLessons(items, false).map((p) => p.lesson));
	for (const item of items) {
		const where = `${item.lesson}#${item.id}`;
		const guessable = item.guessable;
		if (guessable !== undefined && guessable !== null && typeof guessable !== 'string') {
			errors.push(`${where}: guessable must be a string reason`);
			continue;
		}
		const cues = itemCues(item);
		if (typeof guessable === 'string') {
			const position = (item.kind === 'choice' || item.kind === 'scenario') && positionAll.has(item.lesson);
			if (guessable.trim() === '') errors.push(`${where}: guessable needs a reason`);
			else if (cues.length === 0 && !position) errors.push(`${where}: guessable, but no heuristic trips; remove it`);
			else
				exemptions.push(
					`${where}: guessable (${[...cues, ...(position ? ['fixed-position'] : [])].join(', ')}): ${guessable}`,
				);
			continue;
		}
		for (const cue of cues) errors.push(`${where}: ${describe(cue)}`);
	}
	for (const { lesson, index, count } of fixedPositionLessons(items)) {
		errors.push(
			`${lesson}: fixed-position: the correct option is option ${index + 1} in all ${count} choice/scenario checkpoints; move some`,
		);
	}
	return { errors, exemptions };
}

function describe(cue) {
	switch (cue) {
		case 'longest':
			return 'longest: the correct option is more than 40 percent longer than the longest wrong one; tighten it or lengthen the distractors';
		case 'hedge':
			return `hedge: only the correct option hedges (${HEDGES.join(', ')}); drop the hedge or give a distractor one`;
		case 'echo':
			return 'echo: only the correct option repeats a content word from the stem; reword it or let a distractor share the word';
		default:
			return cue;
	}
}
