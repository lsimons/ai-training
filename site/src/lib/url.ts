/**
 * Component-rendered links do not pass through the rehype base plugin (it
 * only sees Markdown), so components build hrefs with this helper.
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: string): string {
	if (!path.startsWith('/')) throw new Error(`href() takes a root-relative path, got ${path}`);
	return `${base}${path}`;
}
