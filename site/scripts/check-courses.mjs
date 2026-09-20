#!/usr/bin/env bun
/**
 * Course plan check (`mise run courses`): the plan files under
 * site/src/data/courses/ must agree with the lesson pages, the topic YAML and
 * the competency YAML. The logic and the list of what it rejects are in
 * scripts/lib/courses.mjs, which tests/scripts/courses.test.ts covers; this
 * file only reports.
 */
import { join } from 'node:path';
import { checkCourses } from './lib/courses.mjs';

const root = new URL('..', import.meta.url).pathname;
const { errors, entries, pages } = checkCourses(join(root, 'src/data'), join(root, 'src/content/docs'));

if (errors.length) {
	for (const e of errors) console.error(`courses: ${e}`);
	console.error(`courses: ${errors.length} problem${errors.length === 1 ? '' : 's'}`);
	process.exit(1);
}
console.log(
	`courses: ${entries} plan entr${entries === 1 ? 'y' : 'ies'}, ${pages} lesson page${pages === 1 ? '' : 's'}, all consistent`,
);
