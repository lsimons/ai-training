import { describe, expect, it } from 'vitest';
import type { AreaTree } from '../../scripts/lib/area-tree.mjs';
import { formatWave, NITS_TITLE, NOT_IN_ONLY, pickWave } from '../../scripts/lib/next-wave.mjs';

type Lesson = {
	id: string;
	title?: string;
	issue?: number;
	serves?: string[];
	assumes?: { objective: string; lesson?: string; section?: string }[];
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
const issue = (number: number, assignees: string[] = [], labels?: string[]) => ({
	number,
	title: `Lesson #${number}`,
	assignees,
	...(labels ? { labels } : {}),
});
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
		expect(r).toEqual({
			kind: 'lessons',
			size: 6,
			only: null,
			wave: [
				{ issue: 2, id: 'a/two', title: 'Two', area: 'a', position: 2, afterPlanned: [] },
				{ issue: 3, id: 'a/three', title: 'Three', area: 'a', position: 3, afterPlanned: [] },
			],
			blocked: [],
			skipped: [],
			waiting: [],
			notPicked: [],
		});
	});

	it('leaves out a lesson that already has a page, even when its issue is ready', () => {
		const t = tree([{ dir: 'a', course: ['a/one'], lessons: [{ id: 'a/one', issue: 1 }] }]);
		const r = pickWave({ tree: t, livePageIds: ['a/one'], readyIssues: [issue(1)], size: 6 });
		expect(r).toEqual({
			kind: 'lessons',
			size: 6,
			only: null,
			wave: [],
			blocked: [],
			skipped: [],
			waiting: [],
			notPicked: [],
		});
	});

	it('blocks a lesson that assumes an objective only a planned lesson serves, and names that lesson', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/one', 'a/two', 'a/three'],
				lessons: [
					{ id: 'a/one', serves: ['a/c/o1'] },
					{ id: 'a/two', issue: 2, serves: ['a/c/o2'] },
					{
						id: 'a/three',
						issue: 3,
						assumes: [
							{ objective: 'a/c/o1', lesson: 'a/one', section: 's' },
							{ objective: 'a/c/o2' },
							{ objective: 'a/c/o2' },
						],
					},
				],
			},
		]);
		const r = pickWave({ tree: t, livePageIds: ['a/one'], readyIssues: [issue(2), issue(3)], size: 6 });
		expect(ids(r.wave)).toEqual(['a/two']);
		expect(r.blocked).toEqual([{ issue: 3, id: 'a/three', blockedBy: [{ objective: 'a/c/o2', servedBy: ['a/two'] }] }]);
	});

	it('does not block a lesson whose assumed objective a live lesson serves, even from another area', () => {
		const t = tree([
			{ dir: 'a', course: ['a/one'], lessons: [{ id: 'a/one', serves: ['a/c/o1'] }] },
			{ dir: 'b', course: ['b/one'], lessons: [{ id: 'b/one', issue: 1, assumes: [{ objective: 'a/c/o1' }] }] },
		]);
		const r = pickWave({ tree: t, livePageIds: ['a/one'], readyIssues: [issue(1)], size: 6 });
		expect(ids(r.wave)).toEqual(['b/one']);
		expect(r.blocked).toEqual([]);
	});

	it('blocks a lesson whose assumed objective no lesson serves, and says so', () => {
		const t = tree([
			{ dir: 'a', course: ['a/one'], lessons: [{ id: 'a/one', issue: 1, assumes: [{ objective: 'x/y/z' }] }] },
		]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1)], size: 6 });
		expect(r.wave).toEqual([]);
		expect(r.blocked).toEqual([{ issue: 1, id: 'a/one', blockedBy: [{ objective: 'x/y/z', servedBy: [] }] }]);
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

	it('caps the wave at size and reports the rest as waiting, grouped by area', () => {
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
		]);
		const ready = [11, 12, 13, 21, 22].map((n) => issue(n));
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: ready, size: 3 });
		expect(ids(r.wave)).toEqual(['a/1', 'b/1', 'a/2']);
		expect(r.skipped).toEqual([]);
		expect(r.waiting.map((w) => [w.area, ids(w.lessons)])).toEqual([
			['a', ['a/3']],
			['b', ['b/2']],
		]);
	});

	it('defaults the size to six', () => {
		const lessons = Array.from({ length: 8 }, (_, i) => ({ id: `a/${i}`, issue: i + 1 }));
		const t = tree([{ dir: 'a', course: lessons.map((l) => l.id), lessons }]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: lessons.map((l) => issue(l.issue)) });
		expect(r.size).toBe(6);
		expect(r.wave).toHaveLength(6);
		expect(r.waiting.map((w) => ids(w.lessons))).toEqual([['a/6', 'a/7']]);
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

	it('falls back to the issue title and sorts a lesson no course lists last, with a null position', () => {
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
		expect(r.wave.map((w) => w.position)).toEqual([1]);
	});

	it('rejects an unknown kind', () => {
		const t = tree([]);
		// @ts-expect-error the kind is checked at run time too, for the command line
		expect(() => pickWave({ tree: t, livePageIds: [], readyIssues: [], kind: 'nope' })).toThrow(/unknown kind/);
	});

	it('with only, skips every planned lesson outside the whitelist before the ready check', () => {
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
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1), issue(2)], only: [2], size: 6 });
		expect(ids(r.wave)).toEqual(['a/2']);
		expect(r.only).toEqual([2]);
		expect(r.notPicked).toEqual([]);
		expect(r.skipped).toEqual([
			{ issue: 1, id: 'a/1', reason: NOT_IN_ONLY },
			{ issue: 3, id: 'a/3', reason: NOT_IN_ONLY },
		]);
	});

	it('with only, reports every listed number that is not in the wave with a reason', () => {
		const t = tree([
			{
				dir: 'a',
				course: ['a/live', 'a/1', 'a/2', 'a/3', 'a/4', 'a/5', 'a/6'],
				lessons: [
					{ id: 'a/live', issue: 9, serves: ['a/c/o1'] },
					{ id: 'a/1', issue: 1 },
					{ id: 'a/2', issue: 2 },
					{ id: 'a/3', issue: 3 },
					{ id: 'a/4', issue: 4, assumes: [{ objective: 'a/c/o2' }] },
					{ id: 'a/5', issue: 5, serves: ['a/c/o2'] },
					{ id: 'a/6', issue: 6, assumes: [{ objective: 'x/y/z' }] },
				],
			},
		]);
		const ready = [issue(1), issue(3, ['someone']), issue(4), issue(5), issue(6), issue(50)];
		const r = pickWave({
			tree: t,
			livePageIds: ['a/live'],
			readyIssues: ready,
			openIssues: [1, 2, 3, 4, 5, 6, 9, 50, 51],
			only: [1, 2, 3, 4, 5, 6, 9, 50, 51, 999],
			size: 1,
		});
		expect(ids(r.wave)).toEqual(['a/1']);
		expect(r.notPicked).toEqual([
			{ issue: 2, reason: 'not ready-for-agent' },
			{ issue: 3, reason: 'assigned' },
			{ issue: 4, reason: 'blocked by a/5' },
			{ issue: 5, reason: 'waiting (wave full)' },
			{ issue: 6, reason: 'blocked by objective x/y/z (no lesson serves it)' },
			{ issue: 9, reason: 'lesson a/live is live' },
			{ issue: 50, reason: 'not a planned lesson (use --kind content)' },
			{ issue: 51, reason: 'not a planned lesson (use --kind content)' },
			{ issue: 999, reason: 'no such open issue' },
		]);
	});

	it('without openIssues, treats the ready issues as the open set for the not-picked reasons', () => {
		const t = tree([{ dir: 'a', course: ['a/1'], lessons: [{ id: 'a/1', issue: 1 }] }]);
		const r = pickWave({ tree: t, livePageIds: [], readyIssues: [issue(1), issue(2)], only: [1, 2, 3] });
		expect(r.notPicked).toEqual([
			{ issue: 2, reason: 'not a planned lesson (use --kind content)' },
			{ issue: 3, reason: 'no such open issue' },
		]);
	});
});

describe('pickWave with kind content', () => {
	const planTree = tree([
		{
			dir: 'a',
			course: ['a/1', 'a/2', 'a/live'],
			lessons: [{ id: 'a/1', issue: 10 }, { id: 'a/2', issue: 20 }, { id: 'a/live' }],
		},
	]);

	it('picks ready content issues by ascending number, leaving out planned lessons and other labels', () => {
		const ready = [
			issue(30, [], ['content', 'ready-for-agent']),
			issue(20, [], ['content', 'ready-for-agent']),
			issue(5, [], ['content']),
			issue(7, [], ['code']),
			issue(8),
		];
		const r = pickWave({ tree: planTree, livePageIds: [], readyIssues: ready, kind: 'content', size: 6 });
		expect(r).toEqual({
			kind: 'content',
			size: 6,
			only: null,
			wave: [
				{ issue: 5, title: 'Lesson #5', labels: ['content'], mixed: false },
				{ issue: 30, title: 'Lesson #30', labels: ['content', 'ready-for-agent'], mixed: false },
			],
			skipped: [],
			waiting: [],
			notPicked: [],
		});
	});

	it('includes and marks an issue with both content and code labels', () => {
		const ready = [issue(40, [], ['content', 'code']), issue(41, [], ['code', 'content', 'ready-for-agent'])];
		const r = pickWave({ tree: planTree, livePageIds: [], readyIssues: ready, kind: 'content' });
		expect(r.wave.map((w) => [w.issue, w.mixed])).toEqual([
			[40, true],
			[41, true],
		]);
	});

	it('caps at size, skips assigned issues, and applies only', () => {
		const ready = [50, 51, 52, 53].map((n) => issue(n, n === 52 ? ['someone'] : [], ['content']));
		const r = pickWave({ tree: planTree, livePageIds: [], readyIssues: ready, kind: 'content', size: 1 });
		expect(r.wave.map((w) => w.issue)).toEqual([50]);
		expect(r.skipped).toEqual([{ issue: 52, reason: 'issue is assigned to someone' }]);
		expect(r.waiting.map((w) => w.issue)).toEqual([51, 53]);

		const o = pickWave({ tree: planTree, livePageIds: [], readyIssues: ready, kind: 'content', only: [51, 53] });
		expect(o.wave.map((w) => w.issue)).toEqual([51, 53]);
		expect(o.notPicked).toEqual([]);
		expect(o.skipped).toEqual([
			{ issue: 50, reason: NOT_IN_ONLY },
			{ issue: 52, reason: NOT_IN_ONLY },
		]);
	});

	it('leaves out a nits issue by title, since the dispatcher adds it as the nits row', () => {
		const ready = [
			{ number: 60, title: 'Cosmetic nits left open on wave 8 branches', assignees: [], labels: ['content'] },
			{ number: 61, title: 'Nits: three typos', assignees: [], labels: ['content'] },
			{ number: 62, title: 'Nitpicks are not nits', assignees: [], labels: ['content'] },
		];
		const r = pickWave({ tree: planTree, livePageIds: [], readyIssues: ready, kind: 'content' });
		expect(r.wave.map((w) => w.issue)).toEqual([62]);
		expect(NITS_TITLE.test('nits in the safety course')).toBe(true);
	});

	it('with only, reports every listed number that is not in the wave with a reason', () => {
		const ready = [
			issue(70, [], ['content']),
			issue(71, [], ['content']),
			issue(72, ['someone'], ['content']),
			issue(73, [], ['code']),
			issue(20, [], ['content']),
			issue(76),
			{ number: 74, title: 'Nits: two typos', assignees: [], labels: ['content'] },
		];
		const r = pickWave({
			tree: planTree,
			livePageIds: [],
			readyIssues: ready,
			openIssues: [70, 71, 72, 73, 74, 75, 76, 20],
			kind: 'content',
			only: [70, 71, 72, 73, 74, 75, 76, 20, 999],
			size: 1,
		});
		expect(r.wave.map((w) => w.issue)).toEqual([70]);
		expect(r.notPicked).toEqual([
			{ issue: 71, reason: 'waiting (wave full)' },
			{ issue: 72, reason: 'assigned' },
			{ issue: 73, reason: 'not a content issue' },
			{ issue: 74, reason: 'a nits issue (the dispatcher adds it as the nits row)' },
			{ issue: 75, reason: 'not ready-for-agent' },
			{ issue: 76, reason: 'not a content issue' },
			{ issue: 20, reason: 'a planned lesson (use --kind lessons)' },
			{ issue: 999, reason: 'no such open issue' },
		]);
	});
});

describe('formatWave', () => {
	it('renders the wave table and the three lists as markdown', () => {
		const out = formatWave({
			kind: 'lessons',
			size: 6,
			only: null,
			notPicked: [],
			wave: [
				{ issue: 1, id: 'a/1', title: 'One', area: 'a', position: 1, afterPlanned: [] },
				{ issue: 2, id: 'a/2', title: 'Two', area: 'a', position: null, afterPlanned: ['a/3', 'a/4'] },
			],
			blocked: [
				{
					issue: 3,
					id: 'b/3',
					blockedBy: [
						{ objective: 'a/c/o1', servedBy: ['a/5', 'a/6'] },
						{ objective: 'a/c/o2', servedBy: [] },
					],
				},
			],
			skipped: [{ issue: 4, id: 'b/4', reason: 'issue is assigned to someone' }],
			waiting: [
				{ area: 'a', lessons: [{ issue: 5, id: 'a/5', title: 'Five', area: 'a', position: 5, afterPlanned: [] }] },
				{
					area: 'b',
					lessons: [
						{ issue: 6, id: 'b/6', title: 'Six', area: 'b', position: 1, afterPlanned: [] },
						{ issue: 7, id: 'b/7', title: 'Seven', area: 'b', position: 2, afterPlanned: [] },
					],
				},
			],
		});
		expect(out).toBe(
			[
				'## Wave (2 of 6)',
				'',
				'| Issue | Lesson | Course position | Planned `after` |',
				'| ----- | ------ | --------------- | --------------- |',
				'| #1 | `a/1` | a 1 | - |',
				'| #2 | `a/2` | a (unlisted) | `a/3`, `a/4` |',
				'',
				'## Blocked (1)',
				'',
				'- #3 `b/3`: assumes `a/c/o1` (served by `a/5`, `a/6`); `a/c/o2` (no lesson serves it)',
				'',
				'## Skipped (1)',
				'',
				'- #4 `b/4`: issue is assigned to someone',
				'',
				'## Waiting for a later wave (3)',
				'',
				'- a: #5',
				'- b: #6 #7',
				'',
			].join('\n'),
		);
	});

	it('renders an empty result with the headings and counts only', () => {
		const out = formatWave({
			kind: 'lessons',
			size: 2,
			only: null,
			wave: [],
			blocked: [],
			skipped: [],
			waiting: [],
			notPicked: [],
		});
		expect(out).toContain('## Wave (0 of 2)');
		expect(out).toContain('## Blocked (0)');
		expect(out).toContain('## Skipped (0)');
		expect(out).toContain('## Waiting for a later wave (0)');
		expect(out).not.toContain('Not picked');
	});

	it('adds the not-picked section whenever only was given, even when it is empty', () => {
		const base = { kind: 'lessons' as const, size: 2, wave: [], blocked: [], skipped: [], waiting: [] };
		expect(formatWave({ ...base, only: [1], notPicked: [] })).toContain('## Not picked from --only (0)');
		const out = formatWave({ ...base, only: [1, 999], notPicked: [{ issue: 999, reason: 'no such open issue' }] });
		expect(out).toContain(['## Not picked from --only (1)', '', '- #999: no such open issue', ''].join('\n'));
	});

	it('groups the not-in-only skips on one line and keeps the other reasons one per line', () => {
		const out = formatWave({
			kind: 'lessons',
			size: 6,
			only: [2],
			notPicked: [{ issue: 2, reason: 'assigned' }],
			wave: [],
			blocked: [],
			skipped: [
				{ issue: 1, id: 'a/1', reason: NOT_IN_ONLY },
				{ issue: 2, id: 'a/2', reason: 'issue is assigned to someone' },
				{ issue: 3, id: 'a/3', reason: NOT_IN_ONLY },
			],
			waiting: [],
		});
		expect(out).toContain(
			['## Skipped (3)', '', '- not in --only: #1 #3', '- #2 `a/2`: issue is assigned to someone'].join('\n'),
		);
	});

	it('renders a content wave as an issue table with the mixed mark, then the skipped and waiting lists', () => {
		const out = formatWave({
			kind: 'content',
			size: 2,
			only: [5, 6, 7, 8],
			notPicked: [{ issue: 7, reason: 'assigned' }],
			wave: [
				{ issue: 5, title: 'Fix the | table', labels: ['content'], mixed: false },
				{ issue: 6, title: 'Widget', labels: ['content', 'code'], mixed: true },
			],
			skipped: [{ issue: 7, reason: 'issue is assigned to someone' }],
			waiting: [
				{ issue: 8, title: 'Later', labels: ['content'], mixed: false },
				{ issue: 9, title: 'Later too', labels: ['code', 'content'], mixed: true },
			],
		});
		expect(out).toBe(
			[
				'## Wave (2 of 2, content)',
				'',
				'| Issue | Title | Labels |',
				'| ----- | ----- | ------ |',
				'| #5 | Fix the \\| table | `content` |',
				'| #6 | Widget | `content`, `code` (content and code) |',
				'',
				'## Skipped (1)',
				'',
				'- #7: issue is assigned to someone',
				'',
				'## Waiting for a later wave (2)',
				'',
				'- #8 Later',
				'- #9 Later too (content and code)',
				'',
				'## Not picked from --only (1)',
				'',
				'- #7: assigned',
				'',
			].join('\n'),
		);
	});
});
