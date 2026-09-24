/**
 * The data tree check's logic (specs S09, S10, S11): the YAML under
 * site/src/data must agree with itself and with the lesson pages under
 * site/src/content/docs. The content collection schemas check each file's
 * shape at build; this checks what one file says about another.
 * `checkData` reports an error when
 *
 * - groups.yaml names an area with no directory, lists an area twice, gives
 *   two groups the same `order`, or an area directory is in no group; an
 *   area file's `id` or `group` disagrees with its directory or its group;
 * - a topic, competency, course or lesson file's `id` isn't `<area>/<stem>`
 *   (a course's `<stem>`), or its `area` isn't its directory; a concept id
 *   is defined twice across topics;
 * - a competency draws on an unknown topic, or an objective id isn't under
 *   its competency; an alignment row names an unknown objective;
 * - a course's id isn't its area's (spec S01: one course per area), a
 *   course lists a lesson the area has no file for, a lesson is in two
 *   courses or in none, or an area has no course;
 * - a lesson covers an unknown topic or one from another area, serves or
 *   assumes an unknown objective, comes `after` a lesson not in its area,
 *   introduces an unknown concept or one another lesson introduces, or cites
 *   a source key the bibliography lacks;
 * - a lesson page (`<area>/<lesson>.mdx`) has no lesson file, carries a
 *   frontmatter field the lesson file owns, cites a source (`(@key)`, the
 *   remark citation plugin's form) that its lesson file's `sources` list
 *   lacks, or its lesson file has no `description` or an `assumes` entry
 *   without `lesson` and `section`; a course page (`<area>/index.mdx`) carries `title` or `description`.
 *
 * It reports a warning, which doesn't fail, when a concept of one of the
 * area's topics is introduced by no lesson: a gap in the plan, which is a
 * content decision. `scripts/check-data.mjs` is the command-line entry;
 * tests import this.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { citationKeys } from '../../plugins/citation-syntax.mjs';
import { allTopics, courseLessonIds, readAreaTree } from './area-tree.mjs';

/** Every file under `dir`, recursively. */
export function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* walk(p);
		else yield p;
	}
}

/** The parsed YAML frontmatter of an MDX file, or `{}` when it has none. */
export function frontmatter(src) {
	const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
	return m ? (parse(m[1]) ?? {}) : {};
}

/**
 * Lesson page id (`<area>/<lesson>`) to frontmatter, for every
 * `<area>/<lesson>.mdx` under `contentDir` whose `<area>` is one of `areaIds`.
 * `<area>/index.mdx` is the course page and isn't listed.
 */
export function lessonPages(contentDir, areaIds) {
	const out = new Map();
	if (!existsSync(contentDir)) return out;
	for (const p of walk(contentDir)) {
		if (!p.endsWith('.mdx')) continue;
		const id = p.slice(contentDir.length + 1).replace(/\.mdx$/, '');
		const [area, lesson, ...rest] = id.split('/');
		if (rest.length || !lesson || lesson === 'index' || !areaIds.has(area)) continue;
		out.set(id, frontmatter(readFileSync(p, 'utf8')));
	}
	return out;
}

/** The fields a lesson page gets from its lesson file; a page's own frontmatter may not set them. */
export const LESSON_OWNED_FIELDS = [
	'title',
	'description',
	'mode',
	'covers',
	'serves',
	'assumes',
	'extends-to',
	'lastUpdated',
	'review-by',
];

/**
 * Check the tree under `dataDir` against the pages under `contentDir`.
 * Returns `{ errors: string[], warnings: string[], lessons: number, pages: number }`.
 */
export function checkData(dataDir, contentDir) {
	const errors = [];
	const warnings = [];
	const fail = (msg) => errors.push(msg);
	const rel = (file) => `src/data/${file.slice(dataDir.length).replace(/^\//, '')}`;
	if (!existsSync(join(dataDir, 'areas'))) {
		return { errors: [`${join(dataDir, 'areas')} does not exist`], warnings, lessons: 0, pages: 0 };
	}
	const tree = readAreaTree(dataDir);

	// Groups and areas.
	const grouped = new Map(); // area -> group id
	const orders = new Set();
	for (const g of tree.groups) {
		if (orders.has(g?.order)) fail(`src/data/groups.yaml: group ${g.id} has the same order as another group`);
		orders.add(g?.order);
		for (const a of g.areas ?? []) {
			if (grouped.has(a)) fail(`src/data/groups.yaml: area ${a} is listed twice`);
			grouped.set(a, g.id);
			if (!tree.areas.some((x) => x.dir === a)) fail(`src/data/groups.yaml: area ${a} has no src/data/areas/${a}/`);
		}
	}
	const areaIds = new Set(tree.areas.map((a) => a.dir));
	for (const a of tree.areas) {
		const where = `src/data/areas/${a.dir}/area.yaml`;
		if (!a.area) {
			fail(`${where}: missing`);
			continue;
		}
		if (a.area.id !== a.dir) fail(`${where}: id is ${JSON.stringify(a.area.id)}, expected ${a.dir} (the directory)`);
		if (!grouped.has(a.dir)) fail(`${where}: no group in src/data/groups.yaml lists ${a.dir}`);
		else if (a.area.group !== grouped.get(a.dir)) {
			fail(`${where}: group is ${JSON.stringify(a.area.group)}, but groups.yaml lists it under ${grouped.get(a.dir)}`);
		}
	}

	// Ids that other files point at.
	const topicIds = new Set();
	const topicArea = new Map();
	const conceptIds = new Map(); // concept -> topic id
	const conceptsOfArea = new Map(); // area -> Set of concept ids
	for (const a of tree.areas) {
		conceptsOfArea.set(a.dir, new Set());
		for (const { data: t, file, stem } of a.topics) {
			const where = rel(file);
			if (t?.id !== `${a.dir}/${stem}`) fail(`${where}: id is ${JSON.stringify(t?.id)}, expected ${a.dir}/${stem}`);
			if (t?.area !== a.dir) fail(`${where}: area is ${JSON.stringify(t?.area)}, expected ${a.dir}`);
			topicIds.add(t?.id);
			topicArea.set(t?.id, a.dir);
			for (const c of t?.concepts ?? []) {
				if (conceptIds.has(c.id)) fail(`${where}: concept ${c.id} is also defined in ${conceptIds.get(c.id)}`);
				conceptIds.set(c.id, t.id);
				conceptsOfArea.get(a.dir).add(c.id);
			}
		}
	}
	const objectiveIds = new Set();
	for (const a of tree.areas) {
		for (const { data: c, file, stem } of a.competencies) {
			const where = rel(file);
			if (c?.id !== `${a.dir}/${stem}`) fail(`${where}: id is ${JSON.stringify(c?.id)}, expected ${a.dir}/${stem}`);
			if (c?.area !== a.dir) fail(`${where}: area is ${JSON.stringify(c?.area)}, expected ${a.dir}`);
			for (const t of c?.topics ?? [])
				if (!topicIds.has(t)) fail(`${where}: topics ${JSON.stringify(t)} is not a topic id`);
			for (const o of c?.objectives ?? []) {
				if (!o?.id?.startsWith(`${c?.id}/`))
					fail(`${where}: objective ${JSON.stringify(o?.id)} is not under ${c?.id}/`);
				objectiveIds.add(o?.id);
			}
		}
	}
	for (const { data: f, file, stem } of tree.alignment) {
		const where = rel(file);
		if (f?.id !== stem) fail(`${where}: id is ${JSON.stringify(f?.id)}, expected ${stem} (the file name)`);
		for (const row of f?.rows ?? []) {
			for (const o of row?.objectives ?? []) {
				if (!objectiveIds.has(o)) fail(`${where} ${row.code}: objective ${JSON.stringify(o)} is not an objective id`);
			}
		}
	}

	// Courses and lessons.
	const pages = lessonPages(contentDir, areaIds);
	const lessonIds = new Set();
	const sourcesOf = new Map(); // lesson id -> Set of bibliography keys the plan lists
	const introducedBy = new Map(); // area -> Map(concept -> lesson id)
	for (const a of tree.areas) {
		const areaLessons = new Set(a.lessons.map((l) => l.data?.id));
		const listedIn = new Map(); // lesson id -> course file
		if (a.courses.length === 0) fail(`src/data/areas/${a.dir}/courses/: no course file`);
		for (const { data: c, file, stem } of a.courses) {
			const where = rel(file);
			if (c?.id !== stem) fail(`${where}: id is ${JSON.stringify(c?.id)}, expected ${stem} (the file name)`);
			if (c?.id !== a.dir)
				fail(`${where}: id is ${JSON.stringify(c?.id)}, expected ${a.dir} (one course per area, spec S01)`);
			if (c?.area !== a.dir) fail(`${where}: area is ${JSON.stringify(c?.area)}, expected ${a.dir}`);
			for (const id of courseLessonIds(c)) {
				if (!areaLessons.has(id))
					fail(`${where}: lists ${id}, which has no file under src/data/areas/${a.dir}/lessons/`);
				if (listedIn.has(id)) fail(`${where}: ${id} is also listed in ${listedIn.get(id)}`);
				listedIn.set(id, where);
			}
		}
		const introduced = new Map();
		introducedBy.set(a.dir, introduced);
		for (const { data: l, file, stem } of a.lessons) {
			const where = rel(file);
			if (l?.id !== `${a.dir}/${stem}`) fail(`${where}: id is ${JSON.stringify(l?.id)}, expected ${a.dir}/${stem}`);
			if (lessonIds.has(l?.id)) fail(`${where}: duplicate id`);
			lessonIds.add(l?.id);
			sourcesOf.set(l?.id, new Set(l?.sources ?? []));
			if (!listedIn.has(l?.id)) fail(`${where}: no course under src/data/areas/${a.dir}/courses/ lists it`);
			if (!topicIds.has(l?.covers)) fail(`${where}: covers ${JSON.stringify(l?.covers)} is not a topic id`);
			else if (topicArea.get(l.covers) !== a.dir) fail(`${where}: covers ${l.covers}, a topic of another area`);
			for (const s of l?.serves ?? [])
				if (!objectiveIds.has(s)) fail(`${where}: serves ${JSON.stringify(s)} is not an objective id`);
			for (const x of l?.assumes ?? []) {
				if (!objectiveIds.has(x?.objective))
					fail(`${where}: assumes ${JSON.stringify(x?.objective)} is not an objective id`);
			}
			for (const x of l?.after ?? []) {
				if (!areaLessons.has(x)) fail(`${where}: after ${JSON.stringify(x)} is not a lesson of this area`);
			}
			for (const c of l?.introduces ?? []) {
				if (!conceptIds.has(c)) fail(`${where}: introduces ${JSON.stringify(c)} is not a concept id`);
				else if (introduced.has(c)) fail(`${where}: introduces ${c}, which ${introduced.get(c)} also introduces`);
				else introduced.set(c, l.id);
			}
			for (const s of l?.sources ?? []) {
				if (!tree.bibliographyKeys.has(s)) fail(`${where}: sources ${JSON.stringify(s)} is not a bibliography key`);
			}
			const page = pages.get(l?.id);
			if (page) {
				if (!l?.description) fail(`${where}: the lesson is live, so it needs a description`);
				for (const x of l?.assumes ?? []) {
					if (!x?.lesson || !x?.section) {
						fail(
							`${where}: assumes ${x?.objective} without the lesson and section that teach it, which a live lesson needs`,
						);
					}
				}
			}
		}
		for (const c of conceptsOfArea.get(a.dir)) {
			if (!introduced.has(c))
				warnings.push(`src/data/areas/${a.dir}: no lesson introduces the concept ${c} (${conceptIds.get(c)})`);
		}
	}

	// Pages.
	for (const [id, fm] of [...pages].sort()) {
		const where = `src/content/docs/${id}.mdx`;
		if (!lessonIds.has(id)) {
			fail(
				`${where}: lesson page without a lesson file at src/data/areas/${id.split('/')[0]}/lessons/${id.split('/')[1]}.yaml`,
			);
			continue;
		}
		const owned = LESSON_OWNED_FIELDS.filter((k) => k in fm);
		if (owned.length) fail(`${where}: frontmatter sets ${owned.join(', ')}, which the lesson file owns`);
		// The plan may list a source the page doesn't cite (consulted, not quoted), so only this direction is checked.
		for (const key of citationKeys(readFileSync(join(contentDir, `${id}.mdx`), 'utf8'))) {
			if (!sourcesOf.get(id).has(key)) fail(`${where}: cites "${key}", which its plan file's sources list lacks`);
		}
	}
	for (const a of tree.areas) {
		const index = join(contentDir, a.dir, 'index.mdx');
		if (!existsSync(index)) continue;
		const owned = ['title', 'description'].filter((k) => k in frontmatter(readFileSync(index, 'utf8')));
		if (owned.length)
			fail(`src/content/docs/${a.dir}/index.mdx: frontmatter sets ${owned.join(', ')}, which area.yaml owns`);
	}

	return { errors, warnings, lessons: lessonIds.size, pages: pages.size };
}

/** Every topic id and every learning objective id under `dataDir`, for other checks. */
export function knownIds(dataDir) {
	const tree = readAreaTree(dataDir);
	return {
		topicIds: new Set(allTopics(tree).map((t) => t.id)),
		objectiveIds: new Set(
			tree.areas.flatMap((a) => a.competencies.flatMap((c) => (c.data.objectives ?? []).map((o) => o.id))),
		),
	};
}
