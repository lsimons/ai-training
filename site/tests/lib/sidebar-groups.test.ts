/** The linked-group logic behind overrides/SidebarSublist.astro (issue #228). */

import type { SidebarEntry, SidebarGroup, SidebarLink } from '@lib/sidebar-groups';
import { GROUP_LINK_ATTR, hasCurrent, isGroupLink, linkedGroup, startsOpen } from '@lib/sidebar-groups';
import { describe, expect, it } from 'vitest';

function link(label: string, opts: { current?: boolean; heading?: boolean } = {}): SidebarLink {
	return {
		type: 'link',
		label,
		href: `/ai-training/${label}/`,
		isCurrent: opts.current ?? false,
		badge: undefined,
		attrs: opts.heading ? { [GROUP_LINK_ATTR]: '' } : {},
	};
}

function group(label: string, entries: SidebarEntry[], collapsed = false): SidebarGroup {
	return { type: 'group', label, entries, collapsed, badge: undefined };
}

describe('isGroupLink', () => {
	it('matches only a link with the data-group-link attribute', () => {
		expect(isGroupLink(link('a', { heading: true }))).toBe(true);
		expect(isGroupLink(link('a'))).toBe(false);
		expect(isGroupLink(group('g', [link('a', { heading: true })]))).toBe(false);
	});
});

describe('linkedGroup', () => {
	it('splits the heading link from the rest', () => {
		const heading = link('concepts', { heading: true });
		const part = group('Prompting', [link('concepts/prompting')]);
		expect(linkedGroup(group('Concepts', [heading, part]))).toEqual({ link: heading, entries: [part] });
	});
	it('is undefined for a plain group, an empty group, or a group-link that is not first', () => {
		expect(linkedGroup(group('g', [link('a'), link('b', { heading: true })]))).toBeUndefined();
		expect(linkedGroup(group('g', []))).toBeUndefined();
	});
});

describe('hasCurrent and startsOpen', () => {
	it('finds the current page at any depth', () => {
		expect(hasCurrent([group('g', [group('h', [link('a', { current: true })])])])).toBe(true);
		expect(hasCurrent([group('g', [link('a')]), link('b')])).toBe(false);
	});
	it('opens a group that holds the current page or is not collapsed', () => {
		expect(startsOpen(group('g', [link('a', { current: true })], true))).toBe(true);
		expect(startsOpen(group('g', [link('a')], true))).toBe(false);
		expect(startsOpen(group('g', [link('a')], false))).toBe(true);
	});
});
