#!/usr/bin/env bun
/**
 * Lesson plan (`mise run lesson-plan`): what the wave picker
 * (scripts/next_wave.py, `mise run next-wave`) needs to know about the
 * lessons of this checkout, as JSON on stdout. It is the picker's one
 * boundary with the site (#492): the picker reads this JSON and nothing
 * else from the site's source tree. The format and the logic are in
 * scripts/lib/lesson-plan.mjs; this file reads the tree and prints.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAreaTree } from './lib/area-tree.mjs';
import { lessonPages } from './lib/data.mjs';
import { lessonPlan } from './lib/lesson-plan.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const tree = readAreaTree(join(root, 'src/data'));
const livePageIds = lessonPages(join(root, 'src/content/docs'), new Set(tree.areas.map((a) => a.dir))).keys();
process.stdout.write(`${JSON.stringify(lessonPlan(tree, livePageIds), null, 2)}\n`);
