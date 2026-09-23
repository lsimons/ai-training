import { describe, expect, it } from 'vitest';
import type { AreaTree } from '../../scripts/lib/area-tree.mjs';
import { pickWave } from '../../scripts/lib/next-wave.mjs';

type Lesson = {
	id: string;
	title?: string;
	issue?: number;
	assumes?: { objective: string; lesson?: string }[];
	after?: string[];
};
/** `course` is the flat lesson list of the area's one course. `courses` replaces the course files when set. */
type Area = { dir: string; course: string[]; lessons: Lesson[]; courses?: AreaTree['areas'][number]['courses'] };

/** A tree in the shape `readAreaTree` returns, with one course per area listing `course`. */
function tree(areas: Area[]): AreaTree {
	return {
		groups: [],
		alignment: [],
		bibliographyKeys: new Set<string>(),
		areas: areas.map((a) => ({
			dir: a.dir,
			area: { id: a.dir },
			topics: [],
			competencies: [],
			courses: a.courses ?? [
				{ file: `${a.dir}.yaml`, stem: a.dir, data: { id: a.dir, area: a.dir, lessons: a.course } },
			],
			lessons: a.lessons.map((l) => ({ file: `${l.id}.yaml`, stem: l.id.split('/')[1] ?? l.id, data: l })),
		})),
	};
}
const issue = (number: number, assignees: string[] = []) => ({ number, title: `Lesson #${number}`, assignees });
const ids = (entries: { id: string }[]) => entries.map((e) => e.id);

describe('pickWave', () => {
	it('picks planned lessons in course order and reports the course position', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/one', 'a/two', 'a/three'],
				lessons: [
					{ id: 'a/three', title: 'Three', issue: 3 },
					{ id: 'a/one', title: 'One' },
					{ id: 'a/two', title: 'Two', issue: 2 },
				],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: ['a/one'], readyIssues: [issue(2), issue(3)], size: 6 });
		expect(r.wave).toEqual([
			{ issue: 2, id: 'a/two', title: 'Two', area: 'a', course: 'a', position: 2, afterPlanned: [] },
			{ issue: 3, id: 'a/three', title: 'Three', area: 'a', course: 'a', position: 3, afterPlanned: [] },
		]);
		expect(r.blocked).toEqual([]);
		expect(r.skipped).toEqual([]);
		expect(r.waiting).toEqual([]);
	});

	it('leaves out a lesson that already has a page, even when its issue is ready', () => {
		const t = tree([{ dir: 'a', course: ['a/one'], lessons: [{ id: 'a/one', issue: 1 }] }]);
		const r = pickWave({ tree: t, livePageIds: ['a/one'], readyIssues: [issue(1)], size: 6 });
		expect(r).toEqual({ wave: [], blocked: [], skipped: [], waiting: [] });
	});

	it('blocks a lesson whose assumes name a planned lesson, and says which', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/one', 'a/two', 'a/three'],
				lessons: [
					{ id: 'a/one' },
					{ id: 'a/two', issue: 2 },
					{
						id: 'a/three',
						issue: 3,
						assumes: [
							{ objective: 'o1', lesson: 'a/one' },
							{ objective: 'o2', lesson: 'a/two' },
							{ objective: 'o3', lesson: 'a/two' },
							{ objective: 'o4' },
						],
					},
				],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: ['a/one'], readyIssues: [issue(2), issue(3)], size: 6 });
		expect(ids(r.wave)).toEqual(['a/two']);
		expect(r.blocked).toEqual([{ issue: 3, id: 'a/three', blockedBy: ['a/two'] }]);
	});

	it('takes lessons round-robin across areas, in area order', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/1', 'a/2', 'a/3'],
				lessons: [
					{ id: 'a/1', issue: 11 },
					{ id: 'a/2', issue: 12 },
					{ id: 'a/3', issue: 13 },
				],
			},
			{
				dir: 'b',
				course: ['b/1', 'b/2'],
				lessons: [
					{ id: 'b/1', issue: 21 },
					{ id: 'b/2', issue: 22 },
				],
			},
			{ dir: 'c', course: ['c/1'], lessons: [{ id: 'c/1', issue: 31 }] },
		]);
		const ready = [11, 12, 13, 21, 22, 31].map((n) => issue(n));
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: ready, size: 10 });
		expect(ids(r.wave)).toEqual(['a/1', 'b/1', 'c/1', 'a/2', 'b/2', 'a/3']);
		expect(r.waiting).toEqual([]);
	});

	it('caps the wave at size and reports the rest as waiting', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/1', 'a/2'],
				lessons: [
					{ id: 'a/1', issue: 11 },
					{ id: 'a/2', issue: 12 },
				],
			},
			{
				dir: 'b',
				course: ['b/1', 'b/2'],
				lessons: [
					{ id: 'b/1', issue: 21 },
					{ id: 'b/2', issue: 22 },
				],
			},
		]);
		const ready = [11, 12, 21, 22].map((n) => issue(n));
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: ready, size: 3 });
		expect(ids(r.wave)).toEqual(['a/1', 'b/1', 'a/2']);
		expect(r.skipped).toEqual([]);
		expect(ids(r.waiting)).toEqual(['b/2']);
	});

	it('defaults the size to six', () => {
		const lessons = Array.from({ length: 8 }, (_, i) => ({ id: `a/${i}`, issue: i + 1 }));
		const t = tree([{ dir: 'a', course: lessons.map((l) => l.id), lessons }]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: lessons.map((l) => issue(l.issue)) });
		expect(r.wave).toHaveLength(6);
		expect(ids(r.waiting)).toEqual(['a/6', 'a/7']);
	});

	it('skips an assigned issue and an issue that is not ready, and says why', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/1', 'a/2', 'a/3'],
				lessons: [
					{ id: 'a/1', issue: 1 },
					{ id: 'a/2', issue: 2 },
					{ id: 'a/3', issue: 3 },
				],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1), issue(2, ['someone'])], size: 6 });
		expect(ids(r.wave)).toEqual(['a/1']);
		expect(r.skipped).toEqual([
			{ issue: 2, id: 'a/2', reason: 'issue is assigned to someone' },
			{ issue: 3, id: 'a/3', reason: 'issue is not ready-for-agent' },
		]);
	});

	it('reports planned after entries and picks lessons without them first within an area', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/live', 'a/1', 'a/2', 'a/3'],
				lessons: [
					{ id: 'a/live' },
					{ id: 'a/1', issue: 1, after: ['a/live', 'a/3'] },
					{ id: 'a/2', issue: 2, after: ['a/live'] },
					{ id: 'a/3', issue: 3 },
				],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: ['a/live'], readyIssues: [issue(1), issue(2), issue(3)], size: 6 });
		expect(ids(r.wave)).toEqual(['a/2', 'a/3', 'a/1']);
		expect(r.wave.map((w) => w.afterPlanned)).toEqual([[], [], ['a/3']]);
	});

	it('falls back to the issue title and sorts a lesson no course lists last', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/2'],
				lessons: [
					{ id: 'a/1', issue: 1 },
					{ id: 'a/2', issue: 2 },
				],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1), issue(2)], size: 6 });
		expect(r.wave.map((w) => [w.id, w.title, w.position])).toEqual([
			['a/2', 'Lesson #2', 1],
			['a/1', 'Lesson #1', null],
		]);
	});

	it('reads course order from parts when the course has no flat list', () => {
		const t = tree([
			{
				dir: 'a',
				course: [],
				courses: [{ file: 'a.yaml', stem: 'a', data: { id: 'a', area: 'a', parts: [{ lessons: ['a/1'] }] } }],
				lessons: [{ id: 'a/1', issue: 1 }],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1)] });
		expect(r.wave.map((w) => [w.course, w.position])).toEqual([['a', 1]]);
	});

	it('names the area as the course and a null position when the area has no course file', () => {
		const t = tree([{ dir: 'a', course: [], courses: [], lessons: [{ id: 'a/1', issue: 1 }] }]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1)] });
		expect(r.wave.map((w) => [w.course, w.position])).toEqual([['a', null]]);
	});
});
