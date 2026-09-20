import { dueByCourse, dueLine } from '@scripts/due-counts';
import { applyLessonFinished, emptyRecord, type ProgressRecord } from '@scripts/progress-model';
import { describe, expect, it } from 'vitest';

const courses = [
	{ area: 'concepts', title: 'Concepts' },
	{ area: 'safety', title: 'Safety' },
];

/** A record whose review entries come from finishing lessons, then pinned to the given stage and due day. */
function record(items: Record<string, { stage: number | 'done'; due: string }>): ProgressRecord {
	const r = emptyRecord();
	for (const [id, x] of Object.entries(items)) {
		const lessonId = id.split('#')[0] ?? id;
		applyLessonFinished(r, lessonId, [{ id, revision: 1 }], '2026-01-01');
		const entry = r.reviews[id];
		if (!entry) throw new Error(`no review entry for ${id}`);
		entry.stage = x.stage;
		entry.due = x.due;
	}
	return r;
}

describe('dueByCourse', () => {
	it('is empty without reviews', () => {
		expect(dueByCourse(courses, emptyRecord(), '2026-01-10')).toEqual([]);
	});
	it('counts items due on or before the day per course and drops courses at zero', () => {
		const rec = record({
			'concepts/a#c1': { stage: 1, due: '2026-01-10' },
			'concepts/a#c2': { stage: 2, due: '2026-01-01' },
			'concepts/a#c3': { stage: 3, due: '2026-01-11' },
			'concepts/a#c4': { stage: 'done', due: '2026-01-01' },
			'safety/b#c1': { stage: 1, due: '2026-02-01' },
		});
		expect(dueByCourse(courses, rec, '2026-01-10')).toEqual([{ area: 'concepts', title: 'Concepts', due: 2 }]);
	});
	it('keeps the course order and is not capped at the session size', () => {
		const items: Record<string, { stage: number; due: string }> = {};
		for (let i = 0; i < 15; i++) items[`safety/b#c${i}`] = { stage: 1, due: '2026-01-01' };
		items['concepts/a#c1'] = { stage: 1, due: '2026-01-01' };
		expect(dueByCourse(courses, record(items), '2026-01-10').map((c) => [c.area, c.due])).toEqual([
			['concepts', 1],
			['safety', 15],
		]);
	});
});

describe('dueLine', () => {
	it('uses the singular for one item', () => {
		expect(dueLine({ area: 'concepts', title: 'Concepts', due: 1 })).toBe('Concepts: 1 item due');
		expect(dueLine({ area: 'safety', title: 'Safety', due: 3 })).toBe('Safety: 3 items due');
	});
});
