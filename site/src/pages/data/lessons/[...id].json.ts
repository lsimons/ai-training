import { buildLessonBundles } from '@lib/lesson-bundles';
import type { APIRoute, GetStaticPaths } from 'astro';

/**
 * The lesson bundles (spec S08 "Lesson bundles"), one JSON file per live
 * lesson, served under the base path as
 * `/ai-training/data/lessons/<area>/<lesson>.json`. Course pages, guides and
 * reference pages get none: `buildLessonBundles` reads the lesson pages
 * only. The tutor skill is the consumer, and nothing in the browser reads
 * them.
 */
export const getStaticPaths: GetStaticPaths = async () => {
	// `site` and `base` from astro.config.mjs; the bundle's links are absolute, so `site` is required.
	const site: string | undefined = import.meta.env.SITE;
	if (!site) throw new Error('lesson bundles need `site` in astro.config.mjs for absolute URLs');
	const bundles = await buildLessonBundles({
		site: new URL(site).origin,
		base: import.meta.env.BASE_URL.replace(/\/$/, ''),
	});
	return bundles.map((bundle) => ({ params: { id: bundle.id }, props: { bundle } }));
};

export const GET: APIRoute = ({ props }) => {
	return new Response(`${JSON.stringify(props.bundle, null, 2)}\n`, {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
