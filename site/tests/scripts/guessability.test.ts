import { describe, expect, it } from 'vitest';
import {
	checkGuessability,
	contentWords,
	fixedPositionLessons,
	hasHedge,
	itemCues,
	optionErrors,
	parseGuessable,
	plainLength,
	splitOptions,
} from '../../scripts/lib/guessability.mjs';

const item = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
	id: 'q',
	lesson: 'a/x',
	kind: 'choice',
	stem: 'Which access keeps the send step for you?',
	options: ['Reading only', 'A scratch copy of it', 'Drafts in the outbox'],
	answer: 'Drafts in the outbox',
	guessable: null,
	...over,
});

describe('contentWords, plainLength and hasHedge', () => {
	it('keeps lower-cased words of four letters or more and drops stopwords and marks', () => {
		expect([...contentWords('Which `token` does the model pick, and why?')].sort()).toEqual(['model', 'pick', 'token']);
		expect(contentWords('is it so')).toEqual(new Set());
	});
	it('counts length without backticks, emphasis marks or link targets', () => {
		expect(plainLength('`todo list`')).toBe(9);
		expect(plainLength('a *b* _c_ [d](https://example.com/very/long)')).toBe(7);
	});
	it('finds a hedge word or phrase as a whole word only, and may only in lower case', () => {
		expect(hasHedge('It usually works.')).toBe(true);
		expect(hasHedge('In most cases, yes')).toBe(true);
		expect(hasHedge('The mayor depends on it')).toBe(true);
		expect(hasHedge('Mayonnaise')).toBe(false);
		expect(hasHedge('Always')).toBe(false);
		expect(hasHedge('It may fail')).toBe(true);
		expect(hasHedge('Released in May 2024')).toBe(false);
	});
});

describe('splitOptions and optionErrors', () => {
	it('splits correct from wrong for choice, scenario and multi-choice, and returns null otherwise', () => {
		expect(splitOptions(item())).toEqual({
			correct: ['Drafts in the outbox'],
			wrong: ['Reading only', 'A scratch copy of it'],
		});
		expect(splitOptions(item({ kind: 'multi-choice', answer: ['Reading only', 'A scratch copy of it'] }))).toEqual({
			correct: ['Reading only', 'A scratch copy of it'],
			wrong: ['Drafts in the outbox'],
		});
		expect(splitOptions(item({ kind: 'sort' }))).toBeNull();
		expect(splitOptions(item({ options: null }))).toBeNull();
		expect(splitOptions(item({ answer: 'nope' }))).toBeNull();
	});
	it('reports a duplicate option text and an answer that is not an option', () => {
		expect(optionErrors(item())).toEqual([]);
		expect(optionErrors(item({ kind: 'order' }))).toEqual([]);
		expect(optionErrors(item({ options: ['a', 'a', 'b'], answer: 'c' }))).toEqual([
			'option text appears twice: "a"',
			'answer is not one of the options: "c"',
		]);
		expect(optionErrors(item({ kind: 'multi-choice', answer: ['Reading only', 'zz'] }))).toEqual([
			'answer is not one of the options: "zz"',
		]);
	});
});

describe('itemCues', () => {
	it('passes an item with options of similar length, no lone hedge and no lone echo', () => {
		expect(itemCues(item())).toEqual([]);
	});
	it('flags longest when the key is more than 40 percent and at least 12 characters longer than the longest distractor', () => {
		expect(itemCues(item({ options: ['Yes', 'No', 'Drafts in the outbox'] }))).toEqual(['longest']);
		expect(itemCues(item({ options: ['Read only, no writes', 'A scratch copy', 'Drafts in the outbox'] }))).toEqual([]);
		expect(itemCues(item({ options: ['No', 'Yes'], answer: 'Yes' }))).toEqual([]);
		expect(itemCues(item({ options: ['Yes', 'No', 'Maybe'], answer: 'Maybe' }))).toEqual([]);
	});
	it('measures length with Markdown marks stripped', () => {
		const key = '`todo add "Pay rent" due 2026-10-01` then `todo list`';
		const wrong = ['Dates work well for the whole team.', 'Dates parse'];
		expect(itemCues(item({ options: [...wrong, key], answer: key }))).toEqual([]);
		const raw = key.replaceAll('`', 'x');
		expect(itemCues(item({ options: [...wrong, raw], answer: raw }))).toEqual(['longest']);
	});
	it('compares mean lengths for multi-choice', () => {
		const keys = ['Every date in the memo appears in the summary.', 'No fact appears that is not in the memo.'];
		const multi = (wrong: string) =>
			item({
				kind: 'multi-choice',
				stem: 'Which lines can you tick?',
				options: [keys[0], wrong, keys[1]],
				answer: keys,
			});
		expect(itemCues(multi('Clear.'))).toEqual(['longest']);
		expect(itemCues(multi('The summary is clear and reads well to the team.'))).toEqual([]);
	});
	it('flags hedge only when a key hedges and no distractor does', () => {
		expect(
			itemCues(
				item({
					options: ['Reading only', 'A scratch copy of the folder', 'It depends on the task'],
					answer: 'It depends on the task',
				}),
			),
		).toEqual(['hedge']);
		expect(
			itemCues(
				item({
					options: ['Usually reading', 'A scratch copy of the folder', 'It depends on the task'],
					answer: 'It depends on the task',
				}),
			),
		).toEqual([]);
	});
	it('flags a single cued key in a multi-choice', () => {
		const hedge = item({
			kind: 'multi-choice',
			stem: 'Pick two.',
			options: ['It usually works', 'Zebra crossing', 'Kitten basket'],
			answer: ['It usually works', 'Zebra crossing'],
		});
		expect(itemCues(hedge)).toEqual(['hedge']);
		const echo = item({
			kind: 'multi-choice',
			stem: 'Which access keeps the send step for you?',
			options: ['Access to send', 'Zebra crossing', 'Kitten basket'],
			answer: ['Access to send', 'Zebra crossing'],
		});
		expect(itemCues(echo)).toEqual(['echo']);
	});
	it('flags echo only when a key repeats a stem word and no distractor does', () => {
		const echo = item({
			stem: 'Which access keeps the send step for you?',
			options: ['Reading only', 'A scratch copy', 'Access to send'],
			answer: 'Access to send',
		});
		expect(itemCues(echo)).toEqual(['echo']);
		expect(itemCues({ ...echo, options: ['Reading access', 'A scratch copy', 'Access to send'] })).toEqual([]);
		expect(itemCues({ ...echo, stem: '' })).toEqual([]);
	});
	it('ignores kinds outside the check', () => {
		expect(
			itemCues(item({ kind: 'order', options: ['a', 'bbbbbbbbbbbbbbbbbbbb'], answer: 'bbbbbbbbbbbbbbbbbbbb' })),
		).toEqual([]);
	});
});

describe('parseGuessable', () => {
	it('reads the named cues and the reason, and rejects text without a cue prefix or with an unknown cue', () => {
		expect(parseGuessable('longest: the key is a full sentence')).toEqual({
			cues: ['longest'],
			reason: 'the key is a full sentence',
		});
		expect(parseGuessable(' longest, fixed-position:  two reasons ')).toEqual({
			cues: ['longest', 'fixed-position'],
			reason: 'two reasons',
		});
		expect(parseGuessable('the key is a full sentence')).toEqual({ cues: null, reason: 'the key is a full sentence' });
		expect(parseGuessable('shortest: nope')).toEqual({ cues: null, reason: 'shortest: nope' });
		expect(parseGuessable('longest:')).toEqual({ cues: ['longest'], reason: '' });
	});
});

describe('fixedPositionLessons', () => {
	const at = (lesson: string, id: string, index: number, over: Record<string, unknown> = {}) =>
		item({ lesson, id, options: ['one', 'two', 'three'], answer: ['one', 'two', 'three'][index], ...over });
	it('reports a lesson with three or more choice/scenario keys at one index', () => {
		expect(
			fixedPositionLessons([at('a/x', 'p', 1), at('a/x', 'q', 1, { kind: 'scenario' }), at('a/x', 'r', 1)]),
		).toEqual([{ lesson: 'a/x', index: 1, count: 3 }]);
	});
	it('passes two items, a moved key, and multi-choice items', () => {
		expect(fixedPositionLessons([at('a/x', 'p', 1), at('a/x', 'q', 1)])).toEqual([]);
		expect(fixedPositionLessons([at('a/x', 'p', 1), at('a/x', 'q', 1), at('a/x', 'r', 0)])).toEqual([]);
		expect(
			fixedPositionLessons([
				at('a/x', 'p', 1),
				at('a/x', 'q', 1),
				at('a/x', 'r', 1, { kind: 'multi-choice', answer: ['two'] }),
			]),
		).toEqual([]);
	});
	it('leaves exempt items out of the run and keeps them in the count', () => {
		const items = [at('a/x', 'p', 1), at('a/x', 'q', 1), at('a/x', 'r', 1), at('a/x', 's', 1, { guessable: 'x' })];
		expect(fixedPositionLessons(items)).toEqual([{ lesson: 'a/x', index: 1, count: 4 }]);
		expect(fixedPositionLessons(items, (i) => i.id === 's')).toEqual([{ lesson: 'a/x', index: 1, count: 4 }]);
		expect(fixedPositionLessons(items, (i) => i.id === 's' || i.id === 'r')).toEqual([]);
	});
});

describe('checkGuessability', () => {
	const three = (over: (id: string) => Record<string, unknown> = () => ({})) =>
		['p', 'q', 'r'].map((id) => item({ id, options: ['one', 'two', 'three'], answer: 'two', ...over(id) }));
	it('passes a clean list with no exemptions', () => {
		expect(checkGuessability([item()])).toEqual({ errors: [], exemptions: [] });
	});
	it('names the item and the cue for each hit, and reports bad option data', () => {
		const { errors } = checkGuessability([item({ options: ['Yes', 'No', 'Drafts in the outbox'] })]);
		expect(errors).toEqual([expect.stringMatching(/^a\/x#q: longest: /)]);
		expect(checkGuessability([item({ options: ['a', 'a'], answer: 'b' })]).errors).toEqual([
			'a/x#q: option text appears twice: "a"',
			'a/x#q: answer is not one of the options: "b"',
		]);
	});
	it('reports a fixed position per lesson with the full item count', () => {
		expect(checkGuessability(three()).errors).toEqual([
			'a/x: fixed-position: the correct option is option 2 in every one of the 3 choice/scenario checkpoints; move some',
		]);
	});
	it('skips a named cue, lists the exemption, and rejects a malformed, stale or incomplete one', () => {
		const long = item({
			options: ['Yes', 'No', 'Drafts in the outbox'],
			guessable: 'longest: the key is a full sentence',
		});
		expect(checkGuessability([long])).toEqual({
			errors: [],
			exemptions: ['a/x#q: guessable (longest): the key is a full sentence'],
		});
		const malformed = /guessable must name its cue and a reason/;
		expect(checkGuessability([item({ guessable: '  ' })]).errors).toEqual([expect.stringMatching(malformed)]);
		expect(checkGuessability([item({ guessable: 'no cue named' })]).errors).toEqual([expect.stringMatching(malformed)]);
		expect(checkGuessability([item({ guessable: 'longest:' })]).errors).toEqual([expect.stringMatching(malformed)]);
		expect(checkGuessability([item({ guessable: 3 })]).errors).toEqual([
			'a/x#q: guessable must be a string in the form "<cue>: reason"',
		]);
		expect(checkGuessability([item({ guessable: 'longest: why' })]).errors).toEqual([
			'a/x#q: guessable names longest, which does not trip; remove it',
		]);
		const partial = item({
			options: ['Yes', 'No', 'It depends on the outbox'],
			answer: 'It depends on the outbox',
			guessable: 'longest: full sentence',
		});
		expect(checkGuessability([partial]).errors).toEqual([
			expect.stringMatching(/^a\/x#q: hedge: .*\(guessable does not name it\)$/),
		]);
	});
	it('drops the lesson error only for an exemption that names fixed-position, and keeps the full count', () => {
		const named = three((id) => (id === 'r' ? { guessable: 'fixed-position: the three keys are the same step' } : {}));
		expect(checkGuessability(named)).toEqual({
			errors: [],
			exemptions: ['a/x#r: guessable (fixed-position): the three keys are the same step'],
		});
		const other = three((id) =>
			id === 'r'
				? {
						options: ['No', 'Drafts in the outbox', 'Yes'],
						answer: 'Drafts in the outbox',
						guessable: 'longest: full sentence',
					}
				: {},
		);
		expect(checkGuessability(other).errors).toEqual([
			expect.stringMatching(/^a\/x#r: fixed-position: .*\(guessable does not name it\)$/),
			'a/x: fixed-position: the correct option is option 2 in every one of the 3 choice/scenario checkpoints; move some',
		]);
		const four = [
			...three(),
			item({ id: 's', options: ['one', 'two', 'three'], answer: 'two', guessable: 'fixed-position: r' }),
		];
		expect(checkGuessability(four).errors).toEqual([
			'a/x: fixed-position: the correct option is option 2 in every one of the 4 choice/scenario checkpoints; move some',
		]);
	});
});
