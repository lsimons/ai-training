/**
 * The `href` of an `extends-to` entry (spec S03 "Frontmatter", S11 "Lesson
 * file"). Two forms are allowed: a root-relative path to a page of this
 * site, and an `https://` URL that starts with the `url` of an entry in
 * `site/src/data/bibliography.yaml`, so the "You are ahead" card can only
 * name a source the project already lists. The MarkdownContent override
 * fails the build on any other value. The same rule serves other fields
 * that name a source by URL; `field` names the field in the error.
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

/** A root-relative path: one leading slash. `//host/...` is protocol-relative and is not accepted. */
export function isRootRelative(href: string): boolean {
	return href.startsWith('/') && !href.startsWith('//');
}

/**
 * True when `href` is `url` itself or a path, query or fragment under it.
 * Both sides are normalized with `URL`, so `../` segments cannot leave the
 * prefix, and `https://a.example` does not match `https://a.example.evil`.
 * An unparsable side is false.
 */
export function isUnderUrl(href: string, url: string): boolean {
	let a: URL;
	let b: URL;
	try {
		a = new URL(href);
		b = new URL(url);
	} catch {
		return false;
	}
	if (a.protocol !== b.protocol || a.host !== b.host) return false;
	const prefix = b.pathname.replace(/\/$/, '');
	const path = a.pathname.replace(/\/$/, '');
	return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Classify `href` against the bibliography. `sources` maps a bibliography
 * key to its `url`, which may be missing for a source without one.
 */
export function checkExtendsToHref(
	href: string,
	sources: Iterable<[string, string | null | undefined]>,
	field = 'extends-to',
): ExtendsToHref {
	if (isRootRelative(href)) return { kind: 'internal' };
	if (!isExternalHref(href)) {
		return { kind: 'invalid', reason: `${field} href must be a root-relative path or an https:// URL, got ${href}` };
	}
	for (const [key, url] of sources) {
		if (url && isUnderUrl(href, url)) return { kind: 'external', source: key };
	}
	return {
		kind: 'invalid',
		reason: `${field} href ${href} does not start with the url of any entry in bibliography.yaml`,
	};
}
