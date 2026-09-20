import { getCollection } from 'astro:content';

/**
 * Root-relative paths of pages the site builds that content may point at
 * with `extends-to`: every docs page (`/<id>/`) and every topic page
 * (`/topics/<id>/`). Shared by MarkdownContent and Recap so both agree.
 */
export async function knownPagePaths(): Promise<Set<string>> {
	const docs = await getCollection('docs');
	const topics = await getCollection('topics');
	const paths = new Set<string>();
	for (const d of docs) paths.add(`/${d.id}/`);
	for (const t of topics) paths.add(`/topics/${t.data.id}/`);
	return paths;
}
