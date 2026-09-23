/**
 * The wave picker's logic (`mise run next-wave`, docs/agents/meta-orchestration.md,
 * "The loop", step 1): which planned lessons the next wave of builders should
 * take on. `pickWave` reads the data tree and the set of live lesson pages,
 * and gets the `ready-for-agent` issues from the caller, so it never touches
 * the network. `formatWave` renders the result as markdown.
 * `scripts/next-wave.mjs` is the command-line entry and
 * tests/scripts/next-wave.test.ts covers this module.
 *
 * A lesson is a candidate when its plan file names an `issue`, it has no
 * page yet, and that issue is ready and unassigned. It is blocked when it
 * assumes an objective that no live lesson serves. A plan file's `assumes`
 * entries only name the objective, and the builder fills in the `lesson`
 * and `section` that teach it when the page goes live. The build
 * (`mise run site-build`, through MarkdownContent.astro) rejects a page
 * whose `assumes` names a lesson without a page, so a wave that includes
 * such a lesson can't land. An `after` entry that is still planned does not
 * block. It is reported per lesson as ordering advice for the wave lead.
 */
import { courseLessonIds } from './area-tree.mjs';

/**
 * @typedef {{ number: number, title: string, assignees: string[] }} ReadyIssue
 * @typedef {{ issue: number, id: string, title: string, area: string, position: number | null, afterPlanned: string[] }} WaveEntry
 * @typedef {{ objective: string, servedBy: string[] }} Blocker An assumed objective and the planned lessons that serve it.
 * @typedef {{ issue: number, id: string, blockedBy: Blocker[] }} BlockedEntry
 * @typedef {{ issue: number, id: string, reason: string }} SkippedEntry
 * @typedef {{ area: string, lessons: WaveEntry[] }} WaitingArea
 * @typedef {{ size: number, wave: WaveEntry[], blocked: BlockedEntry[], skipped: SkippedEntry[], waiting: WaitingArea[] }} Wave
 */

/**
 * Pick the next wave.
 *
 * Within an area, candidates with no planned `after` come first, then course
 * position (a lesson no course lists has position `null` and sorts last).
 * The wave takes one lesson per area in turn, in the tree's area order,
 * until `size` is reached or the areas run out, so every area gets progress.
 * Every candidate ends up in exactly one of the four lists: `wave`,
 * `blocked` (it assumes an objective no live lesson serves), `skipped` (the
 * issue is not ready or is assigned) or `waiting` (fit for a wave, but this
 * one is full), grouped by area.
 *
 * @param {{ tree: import('./area-tree.mjs').AreaTree, livePageIds: Iterable<string>, readyIssues: ReadyIssue[], size?: number }} input
 * @returns {Wave}
 */
export function pickWave({ tree, livePageIds, readyIssues, size = 6 }) {
	const live = new Set(livePageIds);
	const ready = new Map(readyIssues.map((i) => [i.number, i]));

	/** @type {Set<string>} objectives some live lesson serves */
	const servedLive = new Set();
	/** @type {Map<string, string[]>} objective to the planned lessons that serve it */
	const servedPlanned = new Map();
	for (const a of tree.areas) {
		for (const { data: l } of a.lessons) {
			if (typeof l?.id !== 'string') continue;
			for (const o of l.serves ?? []) {
				if (live.has(l.id)) servedLive.add(o);
				else servedPlanned.set(o, [...(servedPlanned.get(o) ?? []), l.id]);
			}
		}
	}

	/** @type {{ area: string, candidates: WaveEntry[] }[]} */
	const perArea = [];
	/** @type {BlockedEntry[]} */
	const blocked = [];
	/** @type {SkippedEntry[]} */
	const skipped = [];

	for (const a of tree.areas) {
		const order = a.courses.flatMap((c) => courseLessonIds(c.data));
		/** @type {WaveEntry[]} */
		const candidates = [];
		for (const { data: l } of a.lessons) {
			if (typeof l?.issue !== 'number' || typeof l?.id !== 'string') continue;
			if (live.has(l.id)) continue;
			const issue = ready.get(l.issue);
			if (!issue) {
				skipped.push({ issue: l.issue, id: l.id, reason: 'issue is not ready-for-agent' });
				continue;
			}
			if (issue.assignees.length) {
				skipped.push({ issue: l.issue, id: l.id, reason: `issue is assigned to ${issue.assignees.join(', ')}` });
				continue;
			}
			const objectives = [...new Set((l.assumes ?? []).map((x) => x?.objective).filter((o) => typeof o === 'string'))];
			const blockedBy = objectives
				.filter((o) => !servedLive.has(o))
				.map((o) => ({ objective: o, servedBy: servedPlanned.get(o) ?? [] }));
			if (blockedBy.length) {
				blocked.push({ issue: l.issue, id: l.id, blockedBy });
				continue;
			}
			const index = order.indexOf(l.id);
			candidates.push({
				issue: l.issue,
				id: l.id,
				title: l.title ?? issue.title,
				area: a.dir,
				position: index === -1 ? null : index + 1,
				afterPlanned: (l.after ?? []).filter((x) => !live.has(x)),
			});
		}
		const rank = (c) => c.position ?? Number.POSITIVE_INFINITY;
		candidates.sort(
			(x, y) => Number(x.afterPlanned.length > 0) - Number(y.afterPlanned.length > 0) || rank(x) - rank(y),
		);
		perArea.push({ area: a.dir, candidates });
	}

	/** @type {WaveEntry[]} */
	const wave = [];
	let taken = true;
	while (wave.length < size && taken) {
		taken = false;
		for (const { candidates } of perArea) {
			if (wave.length >= size) break;
			const next = candidates.shift();
			if (!next) continue;
			wave.push(next);
			taken = true;
		}
	}
	const waiting = perArea
		.filter(({ candidates }) => candidates.length)
		.map(({ area, candidates }) => ({ area, lessons: candidates }));
	return { size, wave, blocked, skipped, waiting };
}

/**
 * The result as markdown: the wave as a table, then the blocked, skipped and
 * waiting lists. Lesson ids are in code spans, so cspell skips them.
 * @param {Wave} result
 * @returns {string}
 */
export function formatWave(result) {
	const code = (s) => `\`${s}\``;
	const lines = [`## Wave (${result.wave.length} of ${result.size})`, ''];
	lines.push(
		'| Issue | Lesson | Course position | Planned `after` |',
		'| ----- | ------ | --------------- | --------------- |',
	);
	for (const w of result.wave) {
		const position = w.position === null ? `${w.area} (unlisted)` : `${w.area} ${w.position}`;
		lines.push(`| #${w.issue} | ${code(w.id)} | ${position} | ${w.afterPlanned.map(code).join(', ') || '-'} |`);
	}
	lines.push('', `## Blocked (${result.blocked.length})`, '');
	for (const b of result.blocked) {
		const why = b.blockedBy.map(
			(x) =>
				`${code(x.objective)} (${x.servedBy.length ? `served by ${x.servedBy.map(code).join(', ')}` : 'no lesson serves it'})`,
		);
		lines.push(`- #${b.issue} ${code(b.id)}: assumes ${why.join('; ')}`);
	}
	lines.push('', `## Skipped (${result.skipped.length})`, '');
	for (const s of result.skipped) lines.push(`- #${s.issue} ${code(s.id)}: ${s.reason}`);
	const count = result.waiting.reduce((n, w) => n + w.lessons.length, 0);
	lines.push('', `## Waiting for a later wave (${count})`, '');
	for (const w of result.waiting) lines.push(`- ${w.area}: ${w.lessons.map((l) => `#${l.issue}`).join(' ')}`);
	return `${lines.join('\n')}\n`;
}
