import {
	answersMatch,
	choiceFeedback,
	historyDisplay,
	isSequential,
	matchVerdict,
	multiChoiceVerdict,
	normalizeAnswer,
	orderFeedback,
	predictFeedback,
	rotateIfSolved,
	selfGradeFeedback,
	shuffle,
	skillsCheckNote,
	skillsCheckOffer,
	sortFeedback,
	stageDisplay,
} from '@scripts/checkpoint-logic';
import { describe, expect, it } from 'vitest';

describe('answers', () => {
	it('collapses whitespace and case', () => {
		expect(normalizeAnswer('  27°C,\n  Sun ')).toBe('27°c, sun');
		expect(answersMatch(' 27°c, sun', '27°C, sun')).toBe(true);
		expect(answersMatch('27°C, rain', '27°C, sun')).toBe(false);
	});
});

describe('shuffle', () => {
	it('returns a permutation and leaves the input alone', () => {
		const input = [1, 2, 3, 4, 5];
		const out = shuffle(input);
		expect(out).toHaveLength(5);
		expect([...out].sort()).toEqual(input);
		expect(input).toEqual([1, 2, 3, 4, 5]);
	});
	it('follows the injected random source', () => {
		// random() = 0 always picks index 0, which walks the first element to the back.
		expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
		// random() just under 1 keeps every element in place.
		expect(shuffle([1, 2, 3], () => 0.999)).toEqual([1, 2, 3]);
	});
	it('isSequential recognizes 1..n', () => {
		expect(isSequential([1, 2, 3])).toBe(true);
		expect(isSequential([2, 1, 3])).toBe(false);
		expect(isSequential([])).toBe(true);
	});
	it('rotateIfSolved moves the first item to the end only when solved', () => {
		const pos = (n: number) => n;
		expect(rotateIfSolved([1, 2, 3], pos)).toEqual([2, 3, 1]);
		expect(rotateIfSolved([2, 1, 3], pos)).toEqual([2, 1, 3]);
		expect(rotateIfSolved([1], pos)).toEqual([1]);
	});
});

describe('feedback', () => {
	it('choice: correct with or without a consequence', () => {
		expect(choiceFeedback(true, 'why', undefined)).toEqual({ kind: 'ok', text: 'Correct.' });
		expect(choiceFeedback(true, undefined, 'It runs.')).toEqual({ kind: 'ok', text: 'Correct. It runs.' });
	});
	it('choice: a wrong pick shows consequence, then why, then a default', () => {
		expect(choiceFeedback(false, 'why', 'bad')).toEqual({ kind: 'nope', text: 'bad' });
		expect(choiceFeedback(false, 'why', undefined)).toEqual({ kind: 'nope', text: 'why' });
		expect(choiceFeedback(false, undefined, undefined).text).toBe('Not quite. Try again.');
	});
	it('predict, order and self-grade texts', () => {
		expect(predictFeedback(true).kind).toBe('ok');
		expect(predictFeedback(false).text).toBe('Not quite. Trace it once more.');
		expect(orderFeedback(true).text).toBe('Correct order.');
		expect(orderFeedback(false).kind).toBe('nope');
		expect(selfGradeFeedback(true, 'predict').text).toBe('Recorded as a pass.');
		expect(selfGradeFeedback(false, 'predict').text).toContain('Adjust your prediction');
		expect(selfGradeFeedback(false, 'repair').text).toContain('Recorded as partial');
	});
	it('sort: unplaced items block grading', () => {
		expect(sortFeedback(1, true)).toEqual({ kind: 'note', text: '1 item still to place.' });
		expect(sortFeedback(2, false).text).toBe('2 items still to place.');
		expect(sortFeedback(0, true).kind).toBe('ok');
		expect(sortFeedback(0, false).text).toBe('Some items are in the wrong bucket.');
	});
});

describe('skills check texts', () => {
	it('pluralizes the offer', () => {
		expect(skillsCheckOffer(1)).toBe('Answer 1 question');
		expect(skillsCheckOffer(2)).toBe('Answer 2 questions');
	});
	it('counts passes while open, then sums up', () => {
		expect(skillsCheckNote(1, 1, 2)).toBe('Passed 1 of 1 so far.');
		expect(skillsCheckNote(2, 2, 2)).toBe('Passed 2 of 2. Every objective is covered. Go on to the recap.');
		expect(skillsCheckNote(2, 1, 2)).toBe('Passed 1 of 2. The ones you missed are taught below.');
	});
});

describe('stageDisplay', () => {
	it('lights one pill per stage, all five when retired, none when unknown', () => {
		expect(stageDisplay(3)).toEqual({ lit: 3, label: 'stage 3 of 5' });
		expect(stageDisplay('done')).toEqual({ lit: 5, label: 'retired' });
		expect(stageDisplay(undefined)).toEqual({ lit: 0, label: 'stage - of 5' });
	});
});

describe('multiChoiceVerdict', () => {
	it('asks for picks, names the first wrong why, counts what is still missing, then passes', () => {
		expect(multiChoiceVerdict(3, 0, 0, undefined)).toEqual({
			ok: null,
			feedback: { kind: 'note', text: 'Pick 3 answers first.' },
		});
		expect(multiChoiceVerdict(3, 2, 1, 'Clear to whom?')).toEqual({
			ok: false,
			feedback: { kind: 'nope', text: 'Clear to whom?' },
		});
		expect(multiChoiceVerdict(3, 1, 1, undefined).feedback.text).toBe('One of your picks is not right.');
		expect(multiChoiceVerdict(3, 1, 0, undefined)).toEqual({
			ok: false,
			feedback: { kind: 'nope', text: '1 of 3 so far, and nothing wrong. 2 more to find.' },
		});
		expect(multiChoiceVerdict(3, 3, 0, undefined)).toEqual({ ok: true, feedback: { kind: 'ok', text: 'Correct.' } });
	});
});

describe('matchVerdict', () => {
	it('blocks on empty rows, counts wrong rows, and shows the rationale on a full pass', () => {
		expect(matchVerdict(1, 0, 'r')).toEqual({ ok: null, feedback: { kind: 'note', text: '1 row still to fill.' } });
		expect(matchVerdict(3, 0, 'r').feedback.text).toBe('3 rows still to fill.');
		expect(matchVerdict(0, 1, 'r')).toEqual({
			ok: false,
			feedback: { kind: 'nope', text: '1 row wrong. Each row says which.' },
		});
		expect(matchVerdict(0, 2, 'r').feedback.text).toBe('2 rows wrong. Each row says which.');
		expect(matchVerdict(0, 0, 'Because.')).toEqual({ ok: true, feedback: { kind: 'ok', text: 'Correct. Because.' } });
		expect(matchVerdict(0, 0, '').feedback.text).toBe('Correct.');
	});
});

describe('historyDisplay', () => {
	it('says when an item was never answered', () => {
		expect(historyDisplay([])).toBe('not answered yet');
	});
	it('counts the answers and names the last one with its day', () => {
		expect(
			historyDisplay([
				{ at: '2026-03-08', result: 'fail' },
				{ at: '2026-03-10', result: 'pass' },
			]),
		).toBe('2 answered, last pass on 2026-03-10');
	});
});
