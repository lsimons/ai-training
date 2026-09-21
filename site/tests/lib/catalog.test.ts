import { buildCatalog, orderByPlan } from '@lib/catalog';
import type { Lesson } from '@lib/lessons';
import { describe, expect, it, vi } from 'vitest';

// The safety course lists `deeper` before `agent-risk`, the reverse of id order, and
// `concepts` has no course file at all.
vi.mock('astro:content', async () => {
	const { courses, mockContent } = await import('./content');
	const safety = courses.find((c) => c.data.id === 'safety');
	if (!safety) throw new Error('no safety fixture');
	const reversed = {
		...safety,
		data: { id: 'safety', area: 'safety', lessons: ['safety/deeper', 'safety/agent-risk', 'safety/coming'] },
	};
	return mockContent({ courses: [reversed] });
});

const lesson = (id: string) => ({ id, data: { title: id } }) as unknown as Lesson;

describe('orderByPlan', () => {
	it('follows the plan order and appends unplanned lessons in id order', () => {
		const ordered = orderByPlan([lesson('x/a'), lesson('x/z'), lesson('x/b'), lesson('x/c')], ['x/c', 'x/a']);
		expect(ordered.map((l) => l.id)).toEqual(['x/c', 'x/a', 'x/b', 'x/z']);
	});
});

describe('buildCatalog', () => {
	it('orders lessons by the course plan, not alphabetically (spec S04 "Progress display")', async () => {
		const catalog = await buildCatalog();
		expect(catalog.find((c) => c.area === 'safety')?.lessons.map((l) => l.id)).toEqual([
			'safety/deeper',
			'safety/agent-risk',
		]);
		// No course file: id order.
		expect(catalog.find((c) => c.area === 'concepts')?.lessons.map((l) => l.id)).toEqual(['concepts/how-models-work']);
	});
});
