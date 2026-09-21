import { getCollection } from 'astro:content';

/**
 * Groups and areas (spec S09): `site/src/data/groups.yaml` names the two
 * sidebar groups and the order of their areas, and each area's facts are in
 * `site/src/data/areas/<area>/area.yaml`. Everything that lists areas reads
 * them from here, in group order.
 */
export interface Group {
	id: string;
	order: number;
	name: string;
	audience: string;
	description: string;
	/** Area slugs in display order. */
	areas: string[];
}

export interface Area {
	slug: string;
	name: string;
	group: string;
	description: string;
}

/** The groups by their `order` field. A collection comes back in no fixed order, so the file says it. */
export async function getGroups(): Promise<Group[]> {
	return (await getCollection('groups')).map((g) => ({ ...g.data })).sort((a, b) => a.order - b.order);
}

/**
 * The areas in group order: the first group's areas, then the second's. An
 * area file no group names is an error, and so is a group naming an area
 * with no file.
 */
export async function getAreas(): Promise<Area[]> {
	const groups = await getGroups();
	const files = new Map((await getCollection('areas')).map((a) => [a.data.id, a.data]));
	const out: Area[] = [];
	for (const g of groups) {
		for (const slug of g.areas) {
			const a = files.get(slug);
			if (!a) throw new Error(`groups.yaml names area ${slug}, but src/data/areas/${slug}/area.yaml does not exist`);
			if (a.group !== g.id)
				throw new Error(`area ${slug} says group ${a.group}, but groups.yaml lists it under ${g.id}`);
			out.push({ slug: a.id, name: a.name, group: a.group, description: a.description });
		}
	}
	const orphan = [...files.keys()].find((slug) => !out.some((a) => a.slug === slug));
	if (orphan) throw new Error(`src/data/areas/${orphan}/area.yaml exists, but no group in groups.yaml names it`);
	return out;
}

/** The area with `slug`, or an error naming it. */
export function areaOf(areas: Area[], slug: string): Area {
	const a = areas.find((x) => x.slug === slug);
	if (!a) throw new Error(`Unknown area: ${slug}`);
	return a;
}

/** True for an area in the `engineering` group, which has comfort levels (spec S01 "Comfort level"). */
export function isEngineering(areas: Area[], slug: string): boolean {
	return areas.find((x) => x.slug === slug)?.group === 'engineering';
}
