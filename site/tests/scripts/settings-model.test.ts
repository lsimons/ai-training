import { applyLessonFinished, emptyRecord } from '@scripts/progress-model';
import {
	type CatalogCourse,
	comfortNote,
	describeItem,
	itemHref,
	itemLabel,
	scheduleRows,
	toggledComfort,
} from '@scripts/settings-model';
import { describe, expect, it } from 'vitest';

const catalog: CatalogCourse[] = [
	{
		area: 'concepts',
		title: 'Concepts',
		lessons: [{ id: 'concepts/a', title: 'Lesson A', checkpoints: [{ id: 'c1', title: 'First check' }] }],
	},
];

describe('comfortNote', () => {
	it('names the set level, or says none is set', () => {
		expect(comfortNote('less')).toBe('Set: less comfortable.');
		expect(comfortNote('more')).toBe('Set: more comfortable.');
		expect(comfortNote(undefined)).toBe('Not set.');
	});
});

describe('toggledComfort', () => {
	it('sets the clicked level, and unsets it on a second click', () => {
		expect(toggledComfort(undefined, 'less')).toBe('less');
		expect(toggledComfort('less', 'more')).toBe('more');
		expect(toggledComfort('more', 'more')).toBeUndefined();
	});
	it('reads an unknown button value as unset', () => {
		expect(toggledComfort('less', 'bogus')).toBeUndefined();
		expect(toggledComfort('less', undefined)).toBeUndefined();
	});
});

describe('describeItem and itemLabel', () => {
	it('names a known checkpoint with its lesson', () => {
		expect(describeItem(catalog, 'concepts/a#c1')?.checkpoint.title).toBe('First check');
		expect(itemLabel(catalog, 'concepts/a#c1')).toBe('First check (Lesson A)');
	});
	it('falls back to the raw id for an unknown lesson or checkpoint', () => {
		expect(describeItem(catalog, 'concepts/a#gone')).toBeNull();
		expect(describeItem(catalog, 'concepts/gone#c1')).toBeNull();
		expect(itemLabel(catalog, 'concepts/gone#c1')).toBe('concepts/gone#c1');
	});
});

describe('itemHref', () => {
	it('links to the checkpoint anchor on the lesson page', () => {
		expect(itemHref('/ai-training', 'concepts/a#c1')).toBe('/ai-training/concepts/a/#c1');
	});
});

describe('scheduleRows', () => {
	it('drops retired items and sorts the rest by due day', () => {
		const rec = emptyRecord();
		applyLessonFinished(
			rec,
			'concepts/a',
			[
				{ id: 'concepts/a#c1', revision: 1 },
				{ id: 'concepts/a#c2', revision: 1 },
				{ id: 'concepts/a#c3', revision: 1 },
			],
			'2026-01-01',
		);
		const [c1, c2, c3] = ['c1', 'c2', 'c3'].map((id) => rec.reviews[`concepts/a#${id}`]);
		if (!c1 || !c2 || !c3) throw new Error('finishing did not schedule the items');
		c1.due = '2026-03-01';
		c2.due = '2026-02-01';
		c3.stage = 'done';
		expect(scheduleRows(rec).map(([id]) => id)).toEqual(['concepts/a#c2', 'concepts/a#c1']);
	});
});
