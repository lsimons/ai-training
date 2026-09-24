/**
 * The `href` of an `extends-to` entry (spec S03 "Frontmatter", S11 "Lesson
 * file"). Two forms are allowed: a root-relative path to a page of this
 * site, and an `https://` URL that starts with the `url` of an entry in
 * `site/src/data/bibliography.yaml`, so the "You are ahead" card can only
 * name a source the project already lists. The MarkdownContent override
 * fails the build on any other value.
 */

export type ExtendsToHref =
	| { kind: 'internal' }
	/** `source` is the bibliography key whose `url` the href starts with. */
	| { kind: 'external'; source: string }
	| { kind: 'invalid'; reason: string };

/** An `https://` URL, as opposed to a root-relative path. */
export function isExternalHref(href: string): boolean {
	return href.startsWith('https://');
}

/**
 * True when `href` is `url` itself or a path, query or fragment under it.
 * `https://a.example` does not match `https://a.example.evil`.
 */
export function isUnderUrl(href: string, url: string): boolean {
	const prefix = url.replace(/\/$/, '');
	if (prefix === '' || !href.startsWith(prefix)) return false;
	const rest = href.slice(prefix.length);
	return rest === '' || rest === '/' || /^[/?#]/.test(rest);
}

/**
 * Classify `href` against the bibliography. `sources` maps a bibliography
 * key to its `url`, which may be missing for a source without one.
 */
export function checkExtendsToHref(
	href: string,
	sources: Iterable<[string, string | null | undefined]>,
): ExtendsToHref {
	if (href.startsWith('/')) return { kind: 'internal' };
	if (!isExternalHref(href)) {
		return { kind: 'invalid', reason: `extends-to href must be a root-relative path or an https:// URL, got ${href}` };
	}
	for (const [key, url] of sources) {
		if (url && isUnderUrl(href, url)) return { kind: 'external', source: key };
	}
	return {
		kind: 'invalid',
		reason: `extends-to href ${href} does not start with the url of any entry in bibliography.yaml`,
	};
}
