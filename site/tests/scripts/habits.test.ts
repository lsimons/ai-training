// @vitest-environment happy-dom
import { bindHabit, bindHabits, drawHabit, habitStatusText } from '@scripts/habits';
import * as progress from '@scripts/progress';
import { addDays, type HabitEntry, today } from '@scripts/progress-model';
import { requiredElement } from '@scripts/required-element';
import { beforeEach, describe, expect, it } from 'vitest';

const ID = 'a/x#h';

function card(): HTMLElement {
	document.body.innerHTML = `
		<aside class="habit" data-habit data-progress-id="${ID}" data-state="unfinished">
			<p data-habit-status></p>
			<div data-habit-actions hidden>
				<button type="button" data-habit-done>Done</button>
				<button type="button" data-habit-skip>Skip</button>
			</div>
			<ol data-habit-results hidden></ol>
		</aside>`;
	return requiredElement(document, '[data-habit]');
}
const status = (el: HTMLElement) => el.querySelector('[data-habit-status]')?.textContent;
const actions = (el: HTMLElement) => requiredElement(el, '[data-habit-actions]');
const results = (el: HTMLElement) => requiredElement(el, '[data-habit-results]');

beforeEach(() => {
	localStorage.clear();
});

describe('habitStatusText', () => {
	const entry = (over: Partial<HabitEntry>): HabitEntry => ({ since: '2026-03-10', next: null, history: [], ...over });
	it('has one line per card state', () => {
		expect(habitStatusText(undefined, '2026-03-10')).toBe('Offered once you finish the lesson.');
		expect(habitStatusText(entry({ next: '2026-03-11' }), '2026-03-10')).toBe('Next on 2026-03-11.');
		expect(habitStatusText(entry({ next: '2026-03-10' }), '2026-03-10')).toBe('Due today. Did you do it?');
		expect(habitStatusText(entry({ next: null }), '2026-03-10')).toBe('Done with this habit.');
		expect(habitStatusText(undefined, '2026-03-10', { state: 'finished', at: '2026-03-10' })).toBe('');
	});
});

describe('bindHabit', () => {
	it('draws the unfinished card, then follows the record when the lesson is finished', () => {
		const el = card();
		bindHabit(el);
		expect(el.dataset.state).toBe('unfinished');
		expect(actions(el).hidden).toBe(true);
		progress.finishLesson('a/x', [], [ID]);
		expect(el.dataset.state).toBe('waiting');
		expect(status(el)).toBe(`Next on ${addDays(today(), 1)}.`);
		expect(actions(el).hidden).toBe(true);
	});
	it('hides the card of a finished lesson that has no entry, as for a learner who finished before the habit existed', () => {
		progress.update((r) => {
			r.lessons['a/x'] = { state: 'finished', at: '2026-03-10' };
		});
		const el = card();
		bindHabit(el);
		expect(el.dataset.state).toBe('hidden');
		expect(el.hidden).toBe(true);
		expect(status(el)).toBe('');
		// A lesson only read keeps the unfinished card.
		progress.update((r) => {
			r.lessons['a/x'] = { state: 'read', at: '2026-03-10' };
		});
		expect(el.dataset.state).toBe('unfinished');
		expect(el.hidden).toBe(false);
	});
	it('shows Done and Skip when due, records the result and lists it', () => {
		progress.update((r) => {
			r.habits[ID] = { since: '2000-01-01', next: '2000-01-02', history: [] };
		});
		const el = card();
		bindHabit(el);
		expect(el.dataset.state).toBe('due');
		expect(actions(el).hidden).toBe(false);
		expect(results(el).hidden).toBe(true);
		const seen: string[] = [];
		bindHabit(el, { onResult: (_, r) => seen.push(r) }); // a second bind is a no-op
		requiredElement(el, '[data-habit-done]').click();
		expect(progress.load().habits[ID]).toMatchObject({ next: null, history: [{ at: today(), result: 'done' }] });
		expect(el.dataset.state).toBe('retired');
		expect(actions(el).hidden).toBe(true);
		expect(results(el).hidden).toBe(false);
		expect(results(el).querySelector('li')?.textContent).toBe(`${today()}: done`);
		expect(results(el).querySelector('li')?.dataset.result).toBe('done');
		expect(seen).toEqual([]);
	});
	it('Skip records skipped and calls onResult', () => {
		progress.update((r) => {
			// Finished yesterday, so today is the first occurrence and the next is two days on (since + 3).
			r.habits[ID] = { since: addDays(today(), -1), next: today(), history: [] };
		});
		const el = card();
		const seen: string[] = [];
		expect(bindHabits(document, { onResult: (_, r) => seen.push(r) })).toEqual([el]);
		requiredElement(el, '[data-habit-skip]').click();
		expect(seen).toEqual(['skipped']);
		expect(progress.load().habits[ID]?.history).toEqual([{ at: today(), result: 'skipped' }]);
		expect(el.dataset.state).toBe('waiting');
		drawHabit(el);
		expect(status(el)).toBe(`Next on ${addDays(today(), 2)}.`);
	});
});
