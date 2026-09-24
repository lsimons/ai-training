// @ts-check
/**
 * Checkpoint props from the MDX tree (spec S03 "Checkpoints"). During the
 * page build this plugin runs the checkpoint tag reader
 * (`src/lib/checkpoint-tags.ts`) over the tree the MDX compiler built, so a
 * tag the reader rejects (a prop that is not a literal, an id used twice)
 * fails the build at the page, with the file path in the message. The tags
 * it read go into the page's frontmatter as `checkpoints`, one entry per
 * graded tag with its `tag`, `kind`, `props` and `stem`, where
 * `render(entry)` exposes them as `remarkPluginFrontmatter.checkpoints`.
 *
 * `lib/lessons.ts` reads a collection entry's body with the same reader,
 * because a collection entry has no rendered frontmatter until `render()`
 * and `checkpointsOf` is synchronous.
 */
import { checkpointTagsIn } from '../src/lib/checkpoint-tags.ts';

export function remarkCheckpoints() {
	return (/** @type {any} */ tree, /** @type {any} */ file) => {
		const where = typeof file.path === 'string' ? file.path : 'page';
		const tags = checkpointTagsIn(tree, String(file.value), where);
		file.data.astro ??= {};
		file.data.astro.frontmatter ??= {};
		file.data.astro.frontmatter.checkpoints = tags.map((t) => ({
			tag: t.tag,
			kind: t.kind,
			props: Object.fromEntries([...t.attrs].map(([name, a]) => [name, a.value])),
			stem: t.stem,
		}));
	};
}
