import { areaOf, getAreas, getGroups, isEngineering } from '@lib/areas';
import { describe, expect, it, vi } from 'vitest';

vi.mock('astro:content', async () => (await import('./content')).mockContent());

describe('areas', () => {
	it('lists the groups in file order and the areas in group order', async () => {
		expect((await getGroups()).map((g) => g.id)).toEqual(['foundations', 'engineering']);
		const areas = await getAreas();
		expect(areas.map((a) => a.slug)).toEqual([
			'concepts',
			'safety',
			'using-agents',
			'coding-with-agents',
			'customizing-agents',
			'building-agents',
		]);
		expect(areas[0]).toEqual({ slug: 'concepts', name: 'Concepts', group: 'foundations', description: 'Concepts.' });
	});
	it('areaOf finds an area or throws, and isEngineering follows the group', async () => {
		const areas = await getAreas();
		expect(areaOf(areas, 'safety').name).toBe('Safety');
		expect(() => areaOf(areas, 'nope')).toThrow('Unknown area: nope');
		expect(isEngineering(areas, 'building-agents')).toBe(true);
		expect(isEngineering(areas, 'safety')).toBe(false);
		expect(isEngineering(areas, 'nope')).toBe(false);
	});
	it('rejects a group naming an area without a file, a mismatched group, and an area file in no group', async () => {
		const { areas, groups, mockContent } = await import('./content');
		const run = async (over: { groups?: unknown[]; areas?: unknown[] }) => {
			const mock = mockContent();
			const collections: Record<string, unknown[]> = { groups: over.groups ?? groups, areas: over.areas ?? areas };
			mock.getCollection.mockImplementation(async (name: string) => collections[name] ?? []);
			vi.doMock('astro:content', () => mock);
			vi.resetModules();
			const fresh = await import('@lib/areas');
			return fresh.getAreas();
		};
		await expect(run({ areas: areas.slice(1) })).rejects.toThrow(
			/names area concepts, but .*area\.yaml does not exist/,
		);
		await expect(
			run({ areas: [{ ...areas[0], data: { ...areas[0]?.data, group: 'engineering' } }, ...areas.slice(1)] }),
		).rejects.toThrow(/says group engineering, but groups\.yaml lists it under foundations/);
		await expect(
			run({ groups: [{ ...groups[0], data: { ...groups[0]?.data, areas: ['concepts', 'safety'] } }, groups[1]] }),
		).rejects.toThrow(/using-agents\/area\.yaml exists, but no group/);
		vi.doUnmock('astro:content');
		vi.resetModules();
	});
});
