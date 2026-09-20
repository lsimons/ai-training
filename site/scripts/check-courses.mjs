#!/usr/bin/env bun
/**
 * Course plan check (`mise run courses`): the plan files under
 * site/src/data/courses/ must agree with the lesson pages, the topic YAML and
 * the competency YAML. Fails when
 *
 * - two entries share an id, or an entry's id isn't under its area;
 * - a lesson page (an MDX file with `mode`) isn't in its area's plan, or is
 *   there with a status other than `live`;
 * - an entry marked `live` has no page, or its `title`, `covers` or `serves`
 *   differ from the page frontmatter;
 * - a plan has no `lessons` list, or an entry has no `id`;
 * - a `covers` id isn't a topic, a `serves` id isn't an objective, or an
 *   `after` id isn't an entry in the same plan.
 *
 * Field types are checked by the `courses` collection schema in
 * src/content.config.ts at build; this script repeats only what it needs.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';

const root = new URL('..', import.meta.url).pathname;
const dataDir = join(root, 'src/data');
const contentDir = join(root, 'src/content/docs');

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* walk(p);
		else yield p;
	}
}

function yamlFiles(dir) {
	return [...walk(dir)].filter((p) => p.endsWith('.yaml')).sort();
}

function frontmatter(path) {
	const src = readFileSync(path, 'utf8');
	const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
	return m ? parse(m[1]) : {};
}

/** `<area>/<lesson>` for a lesson page path; null for course pages and non-lessons. */
function lessonPages() {
	const out = new Map();
	for (const p of walk(contentDir)) {
		if (!p.endsWith('.mdx')) continue;
		const fm = frontmatter(p);
		if (!fm.mode) continue;
		const id = p.slice(contentDir.length + 1).replace(/\.mdx$/, '');
		out.set(id, fm);
	}
	return out;
}

const errors = [];
const fail = (msg) => errors.push(msg);

const topicIds = new Set(yamlFiles(join(dataDir, 'topics')).map((p) => parse(readFileSync(p, 'utf8')).id));
const objectiveIds = new Set(
	yamlFiles(join(dataDir, 'competencies')).flatMap((p) =>
		parse(readFileSync(p, 'utf8')).competencies.flatMap((c) => c.objectives.map((o) => o.id))
	)
);
const pages = lessonPages();

const coursesDir = join(dataDir, 'courses');
if (!existsSync(coursesDir)) {
	console.error(`courses: ${coursesDir} does not exist`);
	process.exit(1);
}

const seen = new Map(); // id -> file
const planned = new Set();
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

for (const file of yamlFiles(coursesDir)) {
	const rel = `src/data/courses/${basename(file)}`;
	const area = basename(file, '.yaml');
	const plan = parse(readFileSync(file, 'utf8'));
	if (plan?.area !== area) fail(`${rel}: area is ${JSON.stringify(plan?.area)}, expected ${area} (the file name)`);
	if (!Array.isArray(plan?.lessons)) {
		fail(`${rel}: no lessons list`);
		continue;
	}
	const ids = new Set(plan.lessons.map((e) => e?.id));
	for (const [i, e] of plan.lessons.entries()) {
		if (typeof e?.id !== 'string' || !e.id) {
			fail(`${rel} lessons[${i}]: entry without an id`);
			continue;
		}
		const where = `${rel} ${e.id}`;
		if (seen.has(e.id)) fail(`${where}: duplicate id, also in ${seen.get(e.id)}`);
		seen.set(e.id, rel);
		planned.add(e.id);
		if (!e.id.startsWith(`${area}/`)) fail(`${where}: id must start with ${area}/`);
		if (!topicIds.has(e.covers)) fail(`${where}: covers ${JSON.stringify(e.covers)} is not a topic id`);
		for (const s of e.serves ?? []) if (!objectiveIds.has(s)) fail(`${where}: serves ${JSON.stringify(s)} is not an objective id`);
		for (const a of e.after ?? []) if (!ids.has(a)) fail(`${where}: after ${JSON.stringify(a)} is not an entry in this plan`);
		const page = pages.get(e.id);
		if (e.status === 'live') {
			if (!page) {
				fail(`${where}: status is live but src/content/docs/${e.id}.mdx has no lesson page`);
				continue;
			}
			if (e.title !== page.title) fail(`${where}: title ${JSON.stringify(e.title)} differs from the page's ${JSON.stringify(page.title)}`);
			const pageCovers = page.covers ?? [];
			if (!sameList(pageCovers, [e.covers])) fail(`${where}: covers ${JSON.stringify(e.covers)} differs from the page's ${JSON.stringify(pageCovers)}`);
			if (!sameList(e.serves ?? [], page.serves ?? [])) fail(`${where}: serves ${JSON.stringify(e.serves ?? [])} differs from the page's ${JSON.stringify(page.serves ?? [])}`);
		} else if (page) {
			fail(`${where}: status is ${e.status} but a lesson page exists; mark it live`);
		}
	}
}

for (const id of [...pages.keys()].sort()) {
	if (!planned.has(id)) fail(`src/content/docs/${id}.mdx: lesson page is not in src/data/courses/${id.split('/')[0]}.yaml`);
}

if (errors.length) {
	for (const e of errors) console.error(`courses: ${e}`);
	console.error(`courses: ${errors.length} problem${errors.length === 1 ? '' : 's'}`);
	process.exit(1);
}
console.log(`courses: ${planned.size} plan entr${planned.size === 1 ? 'y' : 'ies'}, ${pages.size} lesson page${pages.size === 1 ? '' : 's'}, all consistent`);
