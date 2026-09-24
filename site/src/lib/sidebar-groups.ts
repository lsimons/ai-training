/**
 * The sidebar's linked groups (issue #228). Starlight's sidebar model gives a
 * group a label and no link, so an overview page (a course page, the topic
 * map) would sit as a leaf next to its children. `astro.config.mjs` marks the
 * overview link with a `data-group-link` attribute and puts it first in the group.
 * `overrides/SidebarSublist.astro` then renders that link as the group's
 * heading and the rest of the entries under it. The logic is here, without
 * DOM access, so Vitest covers it.
 */
import type { StarlightRouteData } from '@astrojs/starlight/route-data';

export type SidebarEntry = StarlightRouteData['sidebar'][number];
export type SidebarLink = Extract<SidebarEntry, { type: 'link' }>;
export type SidebarGroup = Extract<SidebarEntry, { type: 'group' }>;

/** The attribute `astro.config.mjs` puts on the first link of a group whose heading is that link. */
export const GROUP_LINK_ATTR = 'data-group-link';

/** A group split into its heading link and the entries under it. */
export interface LinkedGroup {
	link: SidebarLink;
	entries: SidebarEntry[];
}

/** True when the link carries the `data-group-link` attribute. */
export function isGroupLink(entry: SidebarEntry): entry is SidebarLink {
	return entry.type === 'link' && GROUP_LINK_ATTR in entry.attrs;
}

/**
 * Splits a group whose first entry is a group link into the link and the
 * remaining entries. Returns undefined for a plain group, so the caller
 * renders Starlight's label heading instead.
 */
export function linkedGroup(group: SidebarGroup): LinkedGroup | undefined {
	const [first, ...rest] = group.entries;
	if (!first || !isGroupLink(first)) return undefined;
	return { link: first, entries: rest };
}

/** True when the current page is one of the entries, at any depth. */
export function hasCurrent(entries: SidebarEntry[]): boolean {
	return entries.some((e) => (e.type === 'link' ? e.isCurrent : hasCurrent(e.entries)));
}

/**
 * Whether a group's `<details>` starts open: when the current page is inside
 * it, or when it isn't collapsed. For a linked group the heading link counts
 * as inside, so the course page shows its own parts.
 */
export function startsOpen(group: SidebarGroup): boolean {
	return hasCurrent(group.entries) || !group.collapsed;
}
