/**
 * The lesson bundle format version (spec S08), in a module of its own with
 * no `astro:content` import, so the dist-layer check under `scripts/` can
 * read it too. `lesson-bundles.ts` re-exports it.
 */

/** Bumped when a field changes meaning; equal to the tutor instruction file's `version` (S08). */
export const BUNDLE_VERSION = 1;
