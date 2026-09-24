/**
 * Component-rendered links do not pass through the rehype base plugin (it
 * only sees Markdown), so components build hrefs with this helper.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: string): string {
	if (!path.startsWith('/')) throw new Error(`href() takes a root-relative path, got ${path}`);
	return `${base}${path}`;
}

/**
 * A root-relative path as an absolute URL on `site` (Astro's `site`, an
 * origin such as `https://lsimons.github.io`), for text that leaves the
 * page: the lesson bundles (spec S08). A path that already carries the base
 * keeps it, as the rehype plugin does, and a URL with a scheme is returned
 * as is.
 */
export function absoluteUrl(path: string, site: string): string {
	if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
	const origin = site.replace(/\/$/, '');
	if (path === base || path.startsWith(`${base}/`)) return `${origin}${path}`;
	return `${origin}${href(path)}`;
}
