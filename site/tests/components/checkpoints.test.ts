/**
 * Renders the checkpoint components to HTML with Astro's Container API and
 * checks the markup `scripts/checkpoints.ts` binds to. The lesson id comes
 * from Starlight's route locals, so each render passes a fake route.
 */
import Choice from '@components/lesson/Choice.astro';
import Match from '@components/lesson/Match.astro';
import MultiChoice from '@components/lesson/MultiChoice.astro';
import Order from '@components/lesson/Order.astro';
import Predict from '@components/lesson/Predict.astro';
import Repair from '@components/lesson/Repair.astro';
import Sort from '@components/lesson/Sort.astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

// Only `entry.id` is read (lib/lesson-context.ts); the rest of Starlight's route data is not needed here.
const locals = { starlightRoute: { entry: { id: 'concepts/how-models-work' } } } as unknown as App.Locals;
const base = { id: 'cp', objective: 'o1', title: 'Title', hint: 'A hint' };

let container: AstroContainer;
beforeAll(async () => {
	container = await AstroContainer.create();
});

// biome-ignore lint/suspicious/noExplicitAny: the Container API takes any Astro component
async function render(component: any, props: Record<string, unknown>, slots?: Record<string, string>) {
	return container.renderToString(component, { props, locals, ...(slots ? { slots } : {}) });
}

describe('CheckpointShell (through Choice)', () => {
	it('carries the progress id, kind, reviewability and revision, and the control buttons', async () => {
		const html = await render(Choice, { ...base, revision: 3, options: [{ text: 'a', correct: true }, { text: 'b' }] });
		expect(html).toContain('data-progress-id="concepts/how-models-work#cp"');
		expect(html).toContain('data-kind="choice"');
		expect(html).toContain('data-reviewable="true"');
		expect(html).toContain('data-revision="3"');
		expect(html).toContain('class="checkpoint not-content"');
		for (const cls of ['cp-check', 'cp-hint-btn', 'cp-skip', 'cp-giveup', 'cp-feedback', 'cp-stage-label']) {
			expect(html).toContain(cls);
		}
		expect(html).toContain('href="/ai-training/concepts/how-models-work/#cp"');
	});
	it('review={false} opts out, and a bad revision fails the build', async () => {
		const html = await render(Choice, { ...base, review: false, options: [{ text: 'a', correct: true }] });
		expect(html).toContain('data-reviewable="false"');
		await expect(render(Choice, { ...base, revision: 0, options: [{ text: 'a', correct: true }] })).rejects.toThrow(
			/revision must be a positive integer/,
		);
	});
});

describe('Choice', () => {
	it('marks the correct option and carries why on the others', async () => {
		const html = await render(Choice, {
			...base,
			options: [
				{ text: 'wrong', why: 'Because.' },
				{ text: 'right', correct: true },
			],
		});
		expect(html).toMatch(/<label data-why="Because\."[^>]*>/);
		expect(html).toMatch(/<label data-correct="true"[^>]*>/);
		expect(html).toContain('name="cp-choice"');
	});
	it('needs exactly one correct option', async () => {
		await expect(render(Choice, { ...base, options: [{ text: 'a' }] })).rejects.toThrow(/exactly one correct option/);
		await expect(
			render(Choice, {
				...base,
				options: [
					{ text: 'a', correct: true },
					{ text: 'b', correct: true },
				],
			}),
		).rejects.toThrow(/has 2/);
	});
});

describe('Predict', () => {
	it('graded: hidden answer, CI note when run is set', async () => {
		const html = await render(Predict, { ...base, answer: '27°C, sun', run: 'x/tool.sh' });
		expect(html).toContain('data-answer="27°C, sun"');
		expect(html).toMatch(/<pre class="cp-reveal" hidden>27°C, sun<\/pre>/);
		expect(html).toContain('Output verified in CI from');
		expect(html).toContain('data-reviewable="true"');
	});
	it('graded without run says the output was checked by hand', async () => {
		const html = await render(Predict, { ...base, answer: 'x' });
		expect(html).toContain('not run in CI');
	});
	it('honor system: self-grade radios, Record label, never reviewed', async () => {
		const html = await render(Predict, base);
		expect(html).toContain('name="cp-selfgrade"');
		expect(html).toContain('>Record</button>');
		expect(html).toContain('data-reviewable="false"');
		expect(html).not.toContain('data-answer');
	});
});

describe('Order and Sort', () => {
	it('Order numbers the steps in the correct order with move buttons', async () => {
		const html = await render(Order, { ...base, steps: ['first', 'second'] });
		expect(html).toMatch(/<li data-pos="1">[\s\S]*first[\s\S]*<li data-pos="2">[\s\S]*second/);
		expect(html).toContain('data-move="up"');
		expect(html).toContain('aria-label="Move &quot;first&quot; up"');
	});
	it('Sort renders chips with their bucket and one target per bucket', async () => {
		const html = await render(Sort, {
			...base,
			buckets: ['Left', 'Right'],
			items: [
				{ text: 'a', bucket: 0 },
				{ text: 'b', bucket: 1 },
			],
		});
		expect(html.match(/class="cp-chip"/g)).toHaveLength(2);
		expect(html).toContain('data-bucket="1"');
		expect(html.match(/class="cp-bucket-target"/g)).toHaveLength(2);
	});
	it('Sort rejects an item pointing outside the buckets', async () => {
		await expect(render(Sort, { ...base, buckets: ['Left'], items: [{ text: 'a', bucket: 1 }] })).rejects.toThrow(
			/points at bucket 1/,
		);
	});
});

describe('Repair', () => {
	it('shows the broken text, hides the model answer, and is never reviewed', async () => {
		const html = await render(Repair, { ...base, broken: 'a\nb', model: 'fixed' });
		expect(html).toContain('a\nb</textarea>');
		expect(html).toMatch(/<div class="cp-model" hidden>/);
		expect(html).toContain('fixed</pre>');
		expect(html).toContain('data-reviewable="false"');
		expect(html).toContain('>Record grade</button>');
	});
});

describe('MultiChoice and Match', () => {
	it('MultiChoice renders checkboxes with the count of correct items, and validates its options', async () => {
		const html = await render(MultiChoice, {
			...base,
			options: [
				{ text: 'a', correct: true },
				{ text: 'b', why: 'No.' },
				{ text: 'c', correct: true },
			],
		});
		expect(html).toContain('data-kind="multi-choice"');
		expect(html).toContain('data-count="2"');
		expect(html).toContain('Select exactly 2.');
		expect(html.match(/type="checkbox"/g)).toHaveLength(3);
		expect(html).toContain('data-reviewable="true"');
		await expect(
			render(MultiChoice, { ...base, options: [{ text: 'a', correct: true }, { text: 'b' }] }),
		).rejects.toThrow(/at least two correct options/);
		await expect(
			render(MultiChoice, {
				...base,
				options: [
					{ text: 'a', correct: true },
					{ text: 'b', correct: true },
				],
			}),
		).rejects.toThrow(/at least one wrong option/);
	});
	it('Match renders one select per row with the answer index and the rationale, and validates its rows', async () => {
		const html = await render(Match, {
			...base,
			options: ['Drafts', 'Copy'],
			rows: [
				{ statement: 'Reply', option: 0, why: 'Keep the send step.' },
				{ statement: 'Clean up', option: 1 },
			],
			rationale: 'Smaller is safer.',
		});
		expect(html).toContain('data-kind="match"');
		expect(html).toContain('data-rationale="Smaller is safer."');
		expect(html).toMatch(/<div class="cp-match-row" data-option="0" data-why="Keep the send step\."/);
		expect(html.match(/<select /g)).toHaveLength(2);
		expect(html).toContain('id="cp-row-0-fb"');
		await expect(
			render(Match, { ...base, options: ['a'], rows: [{ statement: 's', option: 0 }], rationale: '' }),
		).rejects.toThrow(/at least two rows/);
		await expect(
			render(Match, {
				...base,
				options: ['a'],
				rows: [
					{ statement: 's', option: 0 },
					{ statement: 't', option: 1 },
				],
				rationale: '',
			}),
		).rejects.toThrow(/points at option 1/);
	});
});
