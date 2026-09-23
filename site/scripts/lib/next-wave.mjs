/**
 * The wave picker's logic (`mise run next-wave`, docs/agents/meta-orchestration.md,
 * "The loop", step 1): which issues the next wave of builders should take
 * on. `pickWave` reads the data tree and the set of live lesson pages, and
 * gets the `ready-for-agent` issues from the caller, so it never touches the
 * network. `formatWave` renders the result as markdown.
 * `scripts/next-wave.mjs` is the command-line entry and
 * tests/scripts/next-wave.test.ts covers this module.
 *
 * Two kinds of wave. A `lessons` wave (the default) picks planned lessons. A
 * lesson is a candidate when its plan file names an `issue`, it has no page
 * yet, and that issue is ready and unassigned. It is blocked when it assumes
 * an objective that no live lesson serves. A plan file's `assumes` entries
 * only name the objective, and the builder fills in the `lesson` and
 * `section` that teach it when the page goes live. The build
 * (`mise run site-build`, through MarkdownContent.astro) rejects a page
 * whose `assumes` names a lesson without a page, so a wave that includes
 * such a lesson can't land. An `after` entry that is still planned does not
 * block. It is reported per lesson as ordering advice for the wave lead.
 *
 * A `content` wave picks the ready, unassigned issues with the `content`
 * label that no plan file claims as its lesson issue, in ascending issue
 * number, with no dependency logic. An issue that also has the `code`
 * label is included and marked, so the lead can give it a code review too.
 * A nits issue (title starting `Nits` or `Cosmetic nits`) is left out, since
 * the dispatcher adds those to a wave as the nits row.
 *
 * `only` narrows either kind to a set of issue numbers. Everything else is
 * reported as skipped with the reason `not in --only`, and every listed
 * number that did not make the wave is reported under `notPicked` with the
 * reason, so an unattended run never drops a number silently. `openIssues`
 * (every open issue number) tells `no such open issue` from
 * `not ready-for-agent`, and defaults to the ready issues when absent.
 */
import { courseLessonIds } from './area-tree.mjs';

/** The skipped reason `--only` gives. `formatWave` groups these on one line. */
export const NOT_IN_ONLY = 'not in --only';

/** A nits issue by title, the marker the dispatcher and `/wave` use (the repo has no nits label). */
export const NITS_TITLE = /^(nits|cosmetic nits)\b/i;

/**
 * @typedef {{ number: number, title: string, assignees: string[], labels?: string[] }} ReadyIssue
 * @typedef {{ issue: number, id: string, title: string, area: string, position: number | null, afterPlanned: string[] }} WaveEntry
 * @typedef {{ objective: string, servedBy: string[] }} Blocker An assumed objective and the planned lessons that serve it.
 * @typedef {{ issue: number, id: string, blockedBy: Blocker[] }} BlockedEntry
 * @typedef {{ issue: number, id?: string, reason: string }} SkippedEntry `id` is the lesson id, and a content issue has none.
 * @typedef {{ area: string, lessons: WaveEntry[] }} WaitingArea
 * @typedef {{ issue: number, reason: string }} NotPickedEntry A number from `only` that is not in the wave, and why.
 * @typedef {{ kind: 'lessons', size: number, only: number[] | null, wave: WaveEntry[], blocked: BlockedEntry[], skipped: SkippedEntry[], waiting: WaitingArea[], notPicked: NotPickedEntry[] }} LessonsWave
 * @typedef {{ issue: number, title: string, labels: string[], mixed: boolean }} ContentEntry `mixed` is true when the issue has both `content` and `code`.
 * @typedef {{ kind: 'content', size: number, only: number[] | null, wave: ContentEntry[], skipped: SkippedEntry[], waiting: ContentEntry[], notPicked: NotPickedEntry[] }} ContentWave
 * @typedef {LessonsWave | ContentWave} Wave
 * @typedef {{ tree: import('./area-tree.mjs').AreaTree, livePageIds: Iterable<string>, readyIssues: ReadyIssue[], openIssues?: Iterable<number> | null, size?: number, kind?: 'lessons' | 'content', only?: Iterable<number> | null }} PickInput
 */

/**
 * Pick the next wave of the given `kind`.
 * @overload
 * @param {PickInput & { kind?: 'lessons' }} input
 * @returns {LessonsWave}
 */
/**
 * @overload
 * @param {PickInput & { kind: 'content' }} input
 * @returns {ContentWave}
 */
/**
 * @param {PickInput} input
 * @returns {Wave}
 */
export function pickWave(input) {
	const kind = input.kind ?? 'lessons';
	if (kind === 'content') return pickContentWave(input);
	if (kind !== 'lessons') throw new Error(`next-wave: unknown kind ${JSON.stringify(kind)}`);
	return pickLessonsWave(input);
}

/**
 * Pick the next lessons wave.
 *
 * Within an area, candidates with no planned `after` come first, then course
 * position (a lesson no course lists has position `null` and sorts last).
 * The wave takes one lesson per area in turn, in the tree's area order,
 * until `size` is reached or the areas run out, so every area gets progress.
 * Every candidate ends up in exactly one of the four lists: `wave`,
 * `blocked` (it assumes an objective no live lesson serves), `skipped` (the
 * issue is not ready, is assigned, or is not in `only`) or `waiting` (fit
 * for a wave, but this one is full), grouped by area.
 *
 * @param {PickInput} input
 * @returns {LessonsWave}
 */
function pickLessonsWave({ tree, livePageIds, readyIssues, openIssues = null, size = 6, only = null }) {
	const live = new Set(livePageIds);
	const ready = new Map(readyIssues.map((i) => [i.number, i]));
	const open = new Set(openIssues ?? ready.keys());
	const onlyList = only ? [...only] : null;
	const onlySet = onlyList ? new Set(onlyList) : null;
	/** @type {Map<number, string>} planned lesson issue to its lesson id, live pages included */
	const plannedIssues = new Map();

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
			plannedIssues.set(l.issue, l.id);
			if (live.has(l.id)) continue;
			if (onlySet && !onlySet.has(l.issue)) {
				skipped.push({ issue: l.issue, id: l.id, reason: NOT_IN_ONLY });
				continue;
			}
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

	/** @type {NotPickedEntry[]} */
	const notPicked = [];
	const inWave = new Set(wave.map((w) => w.issue));
	for (const n of onlyList ?? []) {
		if (inWave.has(n)) continue;
		const id = plannedIssues.get(n);
		const b = blocked.find((x) => x.issue === n);
		const s = skipped.find((x) => x.issue === n);
		let reason;
		if (id === undefined) reason = open.has(n) ? 'not a planned lesson (use --kind content)' : 'no such open issue';
		else if (live.has(id)) reason = `lesson ${id} is live`;
		else if (b) reason = `blocked by ${blockedByText(b)}`;
		else if (s) reason = s.reason.startsWith('issue is assigned') ? 'assigned' : 'not ready-for-agent';
		else reason = 'waiting (wave full)';
		notPicked.push({ issue: n, reason });
	}
	return { kind: 'lessons', size, only: onlyList, wave, blocked, skipped, waiting, notPicked };
}

/** The lessons that serve a blocked lesson's missing objectives, or the objectives when no lesson does. */
function blockedByText(b) {
	const lessons = [...new Set(b.blockedBy.flatMap((x) => x.servedBy))];
	if (lessons.length) return lessons.join(', ');
	return `objective ${b.blockedBy.map((x) => x.objective).join(', ')} (no lesson serves it)`;
}

/**
 * Pick the next content wave: ready, unassigned `content` issues that no
 * plan file names as its `issue`, by ascending number. The first `size` are
 * the wave and the rest wait. An assigned issue, or one outside `only`, is
 * skipped with the reason.
 *
 * @param {PickInput} input
 * @returns {ContentWave}
 */
function pickContentWave({ tree, readyIssues, openIssues = null, size = 6, only = null }) {
	const ready = new Map(readyIssues.map((i) => [i.number, i]));
	const open = new Set(openIssues ?? ready.keys());
	const onlyList = only ? [...only] : null;
	const onlySet = onlyList ? new Set(onlyList) : null;
	const planned = new Set();
	for (const a of tree.areas) {
		for (const { data: l } of a.lessons) if (typeof l?.issue === 'number') planned.add(l.issue);
	}
	/** @type {SkippedEntry[]} */
	const skipped = [];
	/** @type {ContentEntry[]} */
	const candidates = [];
	for (const i of [...readyIssues].sort((x, y) => x.number - y.number)) {
		const labels = i.labels ?? [];
		if (!labels.includes('content') || planned.has(i.number) || NITS_TITLE.test(i.title)) continue;
		if (onlySet && !onlySet.has(i.number)) {
			skipped.push({ issue: i.number, reason: NOT_IN_ONLY });
			continue;
		}
		if (i.assignees.length) {
			skipped.push({ issue: i.number, reason: `issue is assigned to ${i.assignees.join(', ')}` });
			continue;
		}
		candidates.push({ issue: i.number, title: i.title, labels, mixed: labels.includes('code') });
	}
	const wave = candidates.slice(0, size);
	const waiting = candidates.slice(size);
	/** @type {NotPickedEntry[]} */
	const notPicked = [];
	for (const n of onlyList ?? []) {
		if (wave.some((w) => w.issue === n)) continue;
		const i = ready.get(n);
		let reason;
		if (!open.has(n)) reason = 'no such open issue';
		else if (!i) reason = 'not ready-for-agent';
		else if (planned.has(n)) reason = 'a planned lesson (use --kind lessons)';
		else if (!(i.labels ?? []).includes('content')) reason = 'not a content issue';
		else if (NITS_TITLE.test(i.title)) reason = 'a nits issue (the dispatcher adds it as the nits row)';
		else if (i.assignees.length) reason = 'assigned';
		else reason = 'waiting (wave full)';
		notPicked.push({ issue: n, reason });
	}
	return { kind: 'content', size, only: onlyList, wave, skipped, waiting, notPicked };
}

const code = (s) => `\`${s}\``;

/**
 * The skipped list as markdown lines. The `not in --only` entries are one
 * line of issue numbers, since a whitelist skips nearly everything.
 * @param {SkippedEntry[]} skipped
 * @returns {string[]}
 */
function skippedLines(skipped) {
	const lines = [];
	const notInOnly = skipped.filter((s) => s.reason === NOT_IN_ONLY);
	if (notInOnly.length) lines.push(`- ${NOT_IN_ONLY}: ${notInOnly.map((s) => `#${s.issue}`).join(' ')}`);
	for (const s of skipped) {
		if (s.reason === NOT_IN_ONLY) continue;
		lines.push(`- #${s.issue}${s.id ? ` ${code(s.id)}` : ''}: ${s.reason}`);
	}
	return lines;
}

/**
 * The result as markdown. A lessons wave is a table, then the blocked,
 * skipped and waiting lists. A content wave is a table of issue, title and
 * labels, then the skipped and waiting lists. Lesson ids are in code spans,
 * so cspell skips them.
 * @param {Wave} result
 * @returns {string}
 */
export function formatWave(result) {
	if (result.kind === 'content') return formatContentWave(result);
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
	lines.push('', `## Skipped (${result.skipped.length})`, '', ...skippedLines(result.skipped));
	const count = result.waiting.reduce((n, w) => n + w.lessons.length, 0);
	lines.push('', `## Waiting for a later wave (${count})`, '');
	for (const w of result.waiting) lines.push(`- ${w.area}: ${w.lessons.map((l) => `#${l.issue}`).join(' ')}`);
	lines.push(...notPickedLines(result));
	return `${lines.join('\n')}\n`;
}

/**
 * The `Not picked from --only` section, present whenever `only` was given.
 * @param {Wave} result
 * @returns {string[]}
 */
function notPickedLines(result) {
	if (!result.only) return [];
	const lines = ['', `## Not picked from --only (${result.notPicked.length})`, ''];
	for (const n of result.notPicked) lines.push(`- #${n.issue}: ${n.reason}`);
	return lines;
}

/**
 * @param {ContentWave} result
 * @returns {string}
 */
function formatContentWave(result) {
	const lines = [`## Wave (${result.wave.length} of ${result.size}, content)`, ''];
	lines.push('| Issue | Title | Labels |', '| ----- | ----- | ------ |');
	for (const w of result.wave) {
		const labels = w.labels.map(code).join(', ') + (w.mixed ? ' (content and code)' : '');
		lines.push(`| #${w.issue} | ${w.title.replaceAll('|', '\\|')} | ${labels} |`);
	}
	lines.push('', `## Skipped (${result.skipped.length})`, '', ...skippedLines(result.skipped));
	lines.push('', `## Waiting for a later wave (${result.waiting.length})`, '');
	for (const w of result.waiting) lines.push(`- #${w.issue} ${w.title}${w.mixed ? ' (content and code)' : ''}`);
	lines.push(...notPickedLines(result));
	return `${lines.join('\n')}\n`;
}
