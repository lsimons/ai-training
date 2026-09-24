/**
 * Renders the Habit component with Astro's Container API and checks the
 * markup `scripts/habits.ts` binds to (spec S07 "Where habits surface").
 */
import Habit from '@components/lesson/Habit.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

const locals = { starlightRoute: { entry: { id: 'safety/agent-risk' } } } as unknown as App.Locals;

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

describe('Habit', () => {
	it('renders the card in a not-content container with its progress id, text, buttons and results list', async () => {
		const html = await container.renderToString(Habit, {
			props: { id: 'name-the-blast-radius' },
			locals,
			slots: { default: '<p>Say what it can reach.</p>' },
		});
		expect(html).toMatch(
			/<aside class="habit not-content" id="name-the-blast-radius" data-habit(="")? data-progress-id="safety\/agent-risk#name-the-blast-radius" data-state="unfinished">/,
		);
		expect(html).toContain('<p class="habit-title">Habit</p>');
		expect(html).toContain('<div class="habit-text"><p>Say what it can reach.</p></div>');
		expect(html).toMatch(/<p class="habit-status" data-habit-status(="")? role="status"><\/p>/);
		// Done and Skip are rendered hidden; the script shows them when the habit is due.
		expect(html).toMatch(/<div class="habit-actions" data-habit-actions(="")? hidden>/);
		expect(html).toContain('<button type="button" class="habit-done" data-habit-done>Done</button>');
		expect(html).toContain('<button type="button" class="habit-skip" data-habit-skip>Skip</button>');
		expect(html).toMatch(/<ol class="habit-results" data-habit-results(="")? hidden><\/ol>/);
	});
	it('fails the build on a missing or malformed id', async () => {
		await expect(container.renderToString(Habit, { props: {}, locals })).rejects.toThrow(/without an id/);
		await expect(container.renderToString(Habit, { props: { id: 'Not Kebab' }, locals })).rejects.toThrow(
			/not a lowercase kebab-case slug/,
		);
	});
});
