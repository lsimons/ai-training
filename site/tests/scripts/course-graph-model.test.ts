import {
	type Box,
	courseEdgePath,
	type GraphNode,
	nodeProgress,
	nodeState,
	reviewableItems,
	stopReached,
} from '@scripts/course-graph-model';
import { emptyRecord } from '@scripts/progress-model';
import { describe, expect, it } from 'vitest';

const node: GraphNode = {
	id: 'concepts/a',
	checkpoints: [
		{ id: 'c1', reviewable: true, revision: 2 },
		{ id: 'c2', reviewable: false, revision: 1 },
		{ id: 'c3', reviewable: true, revision: 1 },
	],
};

describe('nodeState', () => {
	it('maps the lesson entry to a node color', () => {
		expect(nodeState({ state: 'finished', at: '2026-01-01' })).toBe('finished');
		expect(nodeState({ state: 'skipped', at: '2026-01-01' })).toBe('skipped');
		expect(nodeState({ state: 'read', at: '2026-01-01' })).toBe('in-progress');
		expect(nodeState(undefined)).toBe('untouched');
	});
});

describe('nodeProgress', () => {
	it('counts passed checkpoints of this lesson only', () => {
		const rec = emptyRecord();
		rec.checkpoints['concepts/a#c1'] = { state: 'passed', attempts: 1 };
		rec.checkpoints['concepts/a#c2'] = { state: 'attempted', attempts: 2 };
		rec.checkpoints['concepts/b#c3'] = { state: 'passed', attempts: 1 };
		expect(nodeProgress(node, rec)).toEqual({ ring: 33, count: '1/3 checkpoints' });
	});
	it('shows nothing for a lesson without checkpoints', () => {
		expect(nodeProgress({ id: 'x/y', checkpoints: [] }, emptyRecord())).toEqual({ ring: 0, count: '' });
	});
});

describe('stopReached', () => {
	it('lights only the first stop at 0%', () => {
		expect([0, 50, 80, 100].map((s) => stopReached(0, s))).toEqual([true, false, false, false]);
	});
	it('lights every stop at or below the percent', () => {
		expect([0, 50, 80, 100].map((s) => stopReached(80, s))).toEqual([true, true, true, false]);
	});
});

describe('reviewableItems', () => {
	it('keeps the reviewable checkpoints with their revision', () => {
		expect(reviewableItems([node])).toEqual([
			{ id: 'concepts/a#c1', revision: 2 },
			{ id: 'concepts/a#c3', revision: 1 },
		]);
	});
});

describe('courseEdgePath', () => {
	const box = (left: number, top: number, width: number, height: number): Box => ({
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
	});
	it('curves from the bottom center of one node to the top center of the next, relative to the graph', () => {
		expect(courseEdgePath(box(10, 20, 100, 40), box(210, 120, 100, 40), box(10, 10, 400, 400))).toBe(
			'M50,50 C50,80 250,80 250,110',
		);
	});
});
