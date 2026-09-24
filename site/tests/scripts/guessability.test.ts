import { describe, expect, it } from 'vitest';
import {
	checkGuessability,
	contentWords,
	fixedPositionLessons,
	hasHedge,
	itemCues,
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

describe('contentWords and hasHedge', () => {
	it('keeps lower-cased words of four letters or more and drops stopwords and marks', () => {
		expect([...contentWords('Which `token` does the model pick, and why?')].sort()).toEqual(['model', 'pick', 'token']);
		expect(contentWords('is it so')).toEqual(new Set());
	});
	it('finds a hedge word or phrase as a whole word only', () => {
		expect(hasHedge('It usually works.')).toBe(true);
		expect(hasHedge('In most cases, yes')).toBe(true);
		expect(hasHedge('The mayor depends on it')).toBe(true);
		expect(hasHedge('Mayonnaise')).toBe(false);
		expect(hasHedge('Always')).toBe(false);
	});
});

describe('splitOptions', () => {
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
});

describe('itemCues', () => {
	it('passes an item with options of similar length, no lone hedge and no lone echo', () => {
		expect(itemCues(item())).toEqual([]);
	});
	it('flags longest when the key is more than 40 percent longer than the longest distractor', () => {
		expect(itemCues(item({ options: ['Yes', 'No', 'Drafts in the outbox'] }))).toEqual(['longest']);
		expect(itemCues(item({ options: ['Read only, no writes', 'A scratch copy', 'Drafts in the outbox'] }))).toEqual([]);
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
	it('flags hedge only when the key alone hedges', () => {
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
	it('flags echo only when the key alone repeats a stem word', () => {
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
		expect(itemCues(item({ kind: 'order', options: ['a', 'bbbbbbbbbb'], answer: 'bbbbbbbbbb' }))).toEqual([]);
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
	it('skips exempted items unless told not to', () => {
		const items = [at('a/x', 'p', 1), at('a/x', 'q', 1), at('a/x', 'r', 1, { guessable: 'reason' })];
		expect(fixedPositionLessons(items)).toEqual([]);
		expect(fixedPositionLessons(items, false)).toEqual([{ lesson: 'a/x', index: 1, count: 3 }]);
	});
});

describe('checkGuessability', () => {
	it('passes a clean list with no exemptions', () => {
		expect(checkGuessability([item()])).toEqual({ errors: [], exemptions: [] });
	});
	it('names the item and the heuristic for each hit', () => {
		const { errors } = checkGuessability([item({ options: ['Yes', 'No', 'Drafts in the outbox'] })]);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatch(/^a\/x#q: longest: /);
	});
	it('reports a fixed position per lesson', () => {
		const three = ['p', 'q', 'r'].map((id) => item({ id, options: ['one', 'two', 'three'], answer: 'two' }));
		const { errors } = checkGuessability(three);
		expect(errors).toEqual([
			'a/x: fixed-position: the correct option is option 2 in all 3 choice/scenario checkpoints; move some',
		]);
	});
	it('skips an exempted item, lists the reason with the heuristics, and rejects an empty or stale one', () => {
		const long = item({
			options: ['Yes', 'No', 'Drafts in the outbox'],
			guessable: 'the key is a full sentence on purpose',
		});
		expect(checkGuessability([long])).toEqual({
			errors: [],
			exemptions: ['a/x#q: guessable (longest): the key is a full sentence on purpose'],
		});
		expect(checkGuessability([item({ guessable: '  ' })]).errors).toEqual(['a/x#q: guessable needs a reason']);
		expect(checkGuessability([item({ guessable: 'why' })]).errors).toEqual([
			'a/x#q: guessable, but no heuristic trips; remove it',
		]);
		expect(checkGuessability([item({ guessable: 3 })]).errors).toEqual(['a/x#q: guessable must be a string reason']);
	});
	it('accepts an exemption for a fixed position and drops the lesson error when it breaks the run', () => {
		const three = ['p', 'q', 'r'].map((id) =>
			item({
				id,
				options: ['one', 'two', 'three'],
				answer: 'two',
				guessable: id === 'r' ? 'the three keys are the same step' : null,
			}),
		);
		expect(checkGuessability(three)).toEqual({
			errors: [],
			exemptions: ['a/x#r: guessable (fixed-position): the three keys are the same step'],
		});
	});
});
