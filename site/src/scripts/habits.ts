/**
 * Client behavior for habit cards (spec S07 "Where habits surface"). The
 * `Habit` component renders the markup, and the review page builds the same
 * markup for today's due habits; this module binds it. A card is an element
 * with `data-habit` whose progress key is `data-progress-id`
 * (`<lesson id>#<habit id>`). The schedule is in `progress-model.ts`; this
 * file only draws the state and records Done and Skip.
 */

import * as progress from './progress';
import type { HabitEntry, HabitResult, LessonEntry } from './progress-model';

export interface HabitBindOptions {
	onResult?: (el: HTMLElement, result: HabitResult) => void;
}

/** The state line under the habit text, per card state. */
export function habitStatusText(entry: HabitEntry | undefined, day: string, lesson?: LessonEntry): string {
	switch (progress.habitCardState(entry, day, lesson)) {
		case 'unfinished':
			return 'Offered once you finish the lesson.';
		case 'hidden':
			return '';
		case 'waiting':
			return `Next on ${entry?.next ?? ''}.`;
		case 'due':
			return 'Due today. Did you do it?';
		case 'retired':
			return 'Done with this habit.';
	}
}

/** Redraw one card from the record: state attribute, status line, buttons and results. */
export function drawHabit(el: HTMLElement): void {
	const rec = progress.load();
	const id = el.dataset.progressId ?? '';
	const entry = rec.habits[id];
	const lesson = rec.lessons[id.split('#')[0] ?? ''];
	const state = progress.habitCardState(entry, progress.today(), lesson);
	el.dataset.state = state;
	// A finished lesson without an entry: the card never shows (spec S07 "Content changes").
	el.hidden = state === 'hidden';
	const status = el.querySelector<HTMLElement>('[data-habit-status]');
	if (status) status.textContent = habitStatusText(entry, progress.today(), lesson);
	const actions = el.querySelector<HTMLElement>('[data-habit-actions]');
	if (actions) actions.hidden = state !== 'due';
	const results = el.querySelector<HTMLElement>('[data-habit-results]');
	if (results) {
		const history = entry?.history ?? [];
		results.hidden = history.length === 0;
		results.replaceChildren(
			...history.map((h) => {
				const li = document.createElement('li');
				li.dataset.result = h.result;
				li.textContent = `${h.at}: ${h.result}`;
				return li;
			}),
		);
	}
}

export function bindHabit(el: HTMLElement, opts: HabitBindOptions = {}): void {
	if (el.dataset.bound) return;
	el.dataset.bound = 'true';
	const id = el.dataset.progressId ?? '';
	const record = (result: HabitResult) => {
		progress.recordHabit(id, result);
		drawHabit(el);
		opts.onResult?.(el, result);
	};
	el.querySelector('[data-habit-done]')?.addEventListener('click', () => record('done'));
	el.querySelector('[data-habit-skip]')?.addEventListener('click', () => record('skipped'));
	drawHabit(el);
	// Finishing the lesson enters the habit; the card follows the record without a reload.
	document.addEventListener(progress.EVENT, () => drawHabit(el));
}

export function bindHabits(root: ParentNode, opts: HabitBindOptions = {}): HTMLElement[] {
	const els = [...root.querySelectorAll<HTMLElement>('[data-habit]')];
	for (const el of els) bindHabit(el, opts);
	return els;
}
