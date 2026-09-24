/**
 * Reads the content data tree under site/src/data (specs S09, S10, S11) as
 * parsed YAML, without validating it:
 *
 *   groups.yaml
 *   bibliography.yaml
 *   alignment/<framework>.yaml
 *   areas/<area>/area.yaml
 *   areas/<area>/topics/<topic>.yaml
 *   areas/<area>/competencies/<competency>.yaml
 *   areas/<area>/courses/<course>.yaml
 *   areas/<area>/lessons/<lesson>.yaml
 *
 * The content collections in src/content.config.ts validate the shape of
 * each file, and scripts/lib/data.mjs checks the references between them.
 * astro.config.mjs and the lesson docs loader read the tree through this
 * module so there is one reader.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';

/**
 * @typedef {{ file: string, stem: string, data: any }} YamlFile One parsed file, with its path and file stem.
 * @typedef {{ dir: string, area: any, topics: YamlFile[], competencies: YamlFile[], courses: YamlFile[], lessons: YamlFile[] }} AreaDir
 * @typedef {{ groups: any[], areas: AreaDir[], alignment: YamlFile[], bibliographyKeys: Set<string>, bibliographySources: Map<string, string | null | undefined> }} AreaTree
 */

/**
 * The `.yaml` files directly under `dir`, sorted by name; none when the directory is absent.
 * @param {string} dir
 * @returns {string[]}
 */
export function yamlFilesIn(dir) {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith('.yaml'))
		.sort()
		.map((f) => join(dir, f));
}

/**
 * One parsed YAML file with the path it came from and its file stem.
 * @param {string} file
 * @returns {YamlFile}
 */
function readYaml(file) {
	return { file, stem: basename(file, '.yaml'), data: parse(readFileSync(file, 'utf8')) };
}

/**
 * The whole tree. Groups are sorted by their `order` field. Areas are in the
 * order the groups list them, then any area directory no group names, in
 * name order, so a forgotten group entry still shows up (and fails the check).
 * @param {string} dataDir
 * @returns {AreaTree}
 */
export function readAreaTree(dataDir) {
	const groupsFile = join(dataDir, 'groups.yaml');
	const parsed = existsSync(groupsFile) ? parse(readFileSync(groupsFile, 'utf8')) : [];
	/** @type {any[]} */
	const groups = Array.isArray(parsed) ? [...parsed].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0)) : [];
	const areasDir = join(dataDir, 'areas');
	const dirs = existsSync(areasDir)
		? readdirSync(areasDir, { withFileTypes: true })
				.filter((d) => d.isDirectory())
				.map((d) => d.name)
				.sort()
		: [];
	/** @type {string[]} */
	const listed = groups.flatMap((g) => g?.areas ?? []);
	const order = [...listed.filter((a) => dirs.includes(a)), ...dirs.filter((a) => !listed.includes(a))];
	const areas = order.map((/** @type {string} */ name) => {
		const dir = join(areasDir, name);
		const areaFile = join(dir, 'area.yaml');
		return {
			dir: name,
			area: existsSync(areaFile) ? parse(readFileSync(areaFile, 'utf8')) : null,
			topics: yamlFilesIn(join(dir, 'topics')).map(readYaml),
			competencies: yamlFilesIn(join(dir, 'competencies')).map(readYaml),
			courses: yamlFilesIn(join(dir, 'courses')).map(readYaml),
			lessons: yamlFilesIn(join(dir, 'lessons')).map(readYaml),
		};
	});
	const bibliographyFile = join(dataDir, 'bibliography.yaml');
	const bibliography = existsSync(bibliographyFile) ? parse(readFileSync(bibliographyFile, 'utf8')) : {};
	return {
		groups,
		areas,
		alignment: yamlFilesIn(join(dataDir, 'alignment')).map(readYaml),
		bibliographyKeys: new Set(Object.keys(bibliography ?? {})),
		// Key -> `url`, the form `checkExtendsToHref` takes. `url` is missing for a source without one.
		bibliographySources: new Map(Object.entries(bibliography ?? {}).map(([k, v]) => [k, v?.url])),
	};
}

/**
 * Every lesson plan across areas, in area order then file order.
 * @param {AreaTree} tree
 * @returns {any[]}
 */
export function allLessons(tree) {
	return tree.areas.flatMap((a) => a.lessons.map((l) => l.data));
}

/**
 * Every topic across areas.
 * @param {AreaTree} tree
 * @returns {any[]}
 */
export function allTopics(tree) {
	return tree.areas.flatMap((a) => a.topics.map((t) => t.data));
}

/**
 * The lesson ids of a course in course order: the flat `lessons` list, or
 * the `parts` lists joined. A course with neither yields nothing.
 * @param {any} course
 * @returns {string[]}
 */
export function courseLessonIds(course) {
	if (Array.isArray(course?.lessons)) return course.lessons;
	if (Array.isArray(course?.parts)) return course.parts.flatMap((p) => p?.lessons ?? []);
	return [];
}
