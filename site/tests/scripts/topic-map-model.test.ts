import { emptyRecord } from '@scripts/progress-model';
import { type Box, topicEdgePath, topicState } from '@scripts/topic-map-model';
import { describe, expect, it } from 'vitest';

const box = (left: number, top: number, width: number, height: number): Box => ({
	left,
	top,
	width,
	height,
	right: left + width,
	bottom: top + height,
});

describe('topicState', () => {
	const rec = emptyRecord();
	rec.lessons['a/one'] = { state: 'finished', at: '2026-01-01' };
	rec.lessons['a/two'] = { state: 'skipped', at: '2026-01-01' };
	rec.lessons['a/three'] = { state: 'read', at: '2026-01-01' };

	it('is finished once every covering lesson is finished or skipped', () => {
		expect(topicState(['a/one', 'a/two'], rec)).toBe('finished');
	});
	it('is in progress when some lesson has an entry', () => {
		expect(topicState(['a/three'], rec)).toBe('in-progress');
		expect(topicState(['a/one', 'a/new'], rec)).toBe('in-progress');
	});
	it('is untouched without entries or without lessons', () => {
		expect(topicState(['a/new'], rec)).toBe('untouched');
		expect(topicState([], rec)).toBe('untouched');
	});
});

describe('topicEdgePath', () => {
	const map = box(10, 10, 500, 500);
	it('draws a straight line down within one column', () => {
		expect(topicEdgePath(box(10, 20, 100, 40), box(11, 100, 100, 40), map)).toBe('M50,50 L51,90');
	});
	it('curves between the facing sides across columns, in either direction', () => {
		expect(topicEdgePath(box(10, 20, 100, 40), box(210, 100, 100, 40), map)).toBe('M100,30 C150,30 150,110 200,110');
		expect(topicEdgePath(box(210, 100, 100, 40), box(10, 20, 100, 40), map)).toBe('M200,110 C150,110 150,30 100,30');
	});
});
