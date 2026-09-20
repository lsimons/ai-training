import type { AstroGlobal } from 'astro';
import type { CollectionEntry } from 'astro:content';

/** The lesson entry a component is rendered inside, from Starlight's route data. */
export function lessonEntryOf(Astro: AstroGlobal): CollectionEntry<'docs'> {
	const route = Astro.locals.starlightRoute;
	return route.entry as CollectionEntry<'docs'>;
}

/** Lesson id per spec S01: `<area>/<lesson>`, the entry id. */
export function lessonIdOf(Astro: AstroGlobal): string {
	return lessonEntryOf(Astro).id;
}
