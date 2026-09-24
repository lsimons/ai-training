/**
 * Names for dispatcher runs (`mise run run-name`, #353). A run is a GitHub
 * issue with the `dispatcher-run` label, titled `Run: <Name> (<kind>)`. The
 * names come from .claude/skills/wave/run-names.yaml: two lists of 26
 * animals, one per letter. The sequence is the first list, then the second,
 * and then the first again. The next run takes the name after the newest
 * run's name, so the names show which run started later, and it skips a
 * name that an open run still holds.
 *
 * Pure functions over the file's text and the run issues that
 * scripts/run-name.mjs fetches, so tests/scripts/run-names.test.ts can feed
 * them planted runs.
 */
import { parse } from 'yaml';

/** The label on every run issue. */
export const RUN_LABEL = 'dispatcher-run';

/** `Run: Capybara (lessons)`: a capitalized name and a lowercase kind. */
const RUN_TITLE = /^Run: ([A-Z][a-z]+) \(([a-z]+)\)$/;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * @typedef {{ number: number, title: string, state: 'OPEN' | 'CLOSED', createdAt: string }} RunIssue
 * @typedef {{ number: number, name: string, kind: string, open: boolean, createdAt: string }} Run
 */

/**
 * What is wrong with the run-names file, as messages. Empty when it holds
 * the two lists `first` and `second`, each with one name per letter from A
 * to Z in order, and no name twice.
 * @param {unknown} doc the parsed YAML
 * @returns {string[]}
 */
export function checkRunNames(doc) {
	if (typeof doc !== 'object' || doc === null) return ['run-names: the file must hold the lists first and second'];
	const errors = [];
	const record = /** @type {Record<string, unknown>} */ (doc);
	const seen = new Set();
	for (const key of ['first', 'second']) {
		const list = record[key];
		if (!Array.isArray(list)) {
			errors.push(`run-names: ${key} must be a list`);
			continue;
		}
		if (list.length !== LETTERS.length) errors.push(`run-names: ${key} has ${list.length} names, not 26`);
		list.forEach((name, i) => {
			const letter = LETTERS[i];
			if (typeof name !== 'string' || !/^[A-Z][a-z]+$/.test(name)) {
				errors.push(`run-names: ${key}[${i}] ${JSON.stringify(name)} is not one capitalized word`);
			} else if (letter !== undefined && !name.startsWith(letter)) {
				errors.push(`run-names: ${key}[${i}] ${name} does not start with ${letter}`);
			} else if (seen.has(name)) {
				errors.push(`run-names: ${name} is in the lists twice`);
			}
			seen.add(name);
		});
	}
	for (const key of Object.keys(record)) {
		if (key !== 'first' && key !== 'second') errors.push(`run-names: unknown key ${key}`);
	}
	return errors;
}

/**
 * The 52 names in order, from the text of run-names.yaml. Throws with the
 * messages of checkRunNames when the file is wrong.
 * @param {string} text
 * @returns {string[]}
 */
export function runNameSequence(text) {
	const doc = parse(text);
	const errors = checkRunNames(doc);
	if (errors.length > 0) throw new Error(errors.join('\n'));
	return [...doc.first, ...doc.second];
}

/**
 * The run a `dispatcher-run` issue records, or null when its title isn't a
 * run title.
 * @param {RunIssue} issue
 * @returns {Run | null}
 */
export function runOf(issue) {
	const match = RUN_TITLE.exec(issue.title);
	if (!match?.[1] || !match[2]) return null;
	return {
		number: issue.number,
		name: match[1],
		kind: match[2],
		open: issue.state === 'OPEN',
		createdAt: issue.createdAt,
	};
}

/**
 * The newest run: the one whose issue was opened last. Ties go to the
 * higher issue number.
 * @param {Run[]} runs
 * @returns {Run | null}
 */
export function newestRun(runs) {
	let newest = null;
	for (const run of runs) {
		if (
			newest === null ||
			run.createdAt > newest.createdAt ||
			(run.createdAt === newest.createdAt && run.number > newest.number)
		) {
			newest = run;
		}
	}
	return newest;
}

/**
 * The name for a new run: the one after the newest run's name in the
 * sequence (the first name when there is no run yet, or when the newest
 * name isn't in the sequence), skipping every name an open run holds.
 * Throws when every name is held.
 * @param {string[]} sequence
 * @param {Run[]} runs every run issue, open and closed
 * @returns {string}
 */
export function nextRunName(sequence, runs) {
	const held = new Set(runs.filter((r) => r.open).map((r) => r.name));
	const newest = newestRun(runs);
	const start = newest === null ? 0 : sequence.indexOf(newest.name) + 1;
	for (let step = 0; step < sequence.length; step++) {
		const name = /** @type {string} */ (sequence[(start + step) % sequence.length]);
		if (!held.has(name)) return name;
	}
	throw new Error(`run-name: all ${sequence.length} names are held by open runs`);
}

/**
 * For a run issue this dispatcher just opened: the older open run that
 * holds the same name, or null when the name is its own. The dispatcher
 * that loses closes its issue and takes the next name.
 * @param {Run[]} runs
 * @param {number} own the number of the issue this dispatcher opened
 * @returns {Run | null}
 */
export function nameTakenBy(runs, own) {
	const mine = runs.find((r) => r.number === own);
	if (!mine) throw new Error(`run-name: issue #${own} is not a run issue`);
	const isOlder = (/** @type {Run} */ r) =>
		r.createdAt < mine.createdAt || (r.createdAt === mine.createdAt && r.number < own);
	const rivals = runs.filter((r) => r.open && r.name === mine.name && r.number !== own && isOlder(r));
	if (rivals.length === 0) return null;
	return rivals.reduce((a, b) => (a.number < b.number ? a : b));
}

/**
 * The run issues with `issue` added when the list lacks it. `gh issue list`
 * with a label can miss an issue for a few seconds after it is created (the
 * #353 dry run hit this), so `--check N` fetches issue N on its own and
 * merges it in. An older rival has had those seconds, so the list shows it.
 * @param {RunIssue[]} issues
 * @param {RunIssue} issue
 * @returns {RunIssue[]}
 */
export function withIssue(issues, issue) {
	return issues.some((i) => i.number === issue.number) ? issues : [...issues, issue];
}

/**
 * `[--check N]` from the command line, or an error message.
 * @param {string[]} argv
 * @returns {{ check: number | null } | { error: string }}
 */
export function parseArgs(argv) {
	if (argv.length === 0) return { check: null };
	const [flag, raw, ...rest] = argv;
	if (flag !== '--check' || rest.length > 0) return { error: `run-name: unknown arguments ${argv.join(' ')}` };
	const number = (raw ?? '').replace(/^#/, '');
	if (!/^[1-9][0-9]*$/.test(number))
		return { error: `run-name: --check needs an issue number, got ${JSON.stringify(raw)}` };
	return { check: Number(number) };
}
