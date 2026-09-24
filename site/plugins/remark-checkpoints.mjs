// @ts-check
/**
 * Checkpoint tags checked during the page build (spec S03 "Checkpoints").
 * This plugin runs the checkpoint tag reader (`src/lib/checkpoint-tags.ts`)
 * over the tree the MDX compiler built, so a tag the reader rejects (a prop
 * that is not a literal, an id used twice) fails the build at the page, with
 * the file path in the message. It changes nothing: the review page, the
 * export and the bundles read a lesson's tags from `lib/lessons.ts`, which
 * parses the collection entry's body with the same reader.
 */
import { checkpointTagsIn } from '../src/lib/checkpoint-tags.ts';

export function remarkCheckpoints() {
	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		const where = typeof file.path === 'string' ? file.path : 'page';
		checkpointTagsIn(tree, String(file.value), where);
	};
}
