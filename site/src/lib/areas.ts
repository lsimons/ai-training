/** The six areas per spec S02 "Areas", in path order. */
export interface Area {
	slug: string;
	name: string;
	group: 'Foundations' | 'Engineering';
	description: string;
}

export const AREAS: Area[] = [
	{ slug: 'concepts', name: 'Concepts', group: 'Foundations', description: 'What AI models are and how they behave.' },
	{ slug: 'safety', name: 'Safety', group: 'Foundations', description: 'Using AI safely, and judging the risk of letting an agent act.' },
	{ slug: 'using-agents', name: 'Using agents', group: 'Foundations', description: 'Delegating work to an agent and checking what comes back.' },
	{ slug: 'coding-with-agents', name: 'Coding with agents', group: 'Engineering', description: 'Shipping software changes with a coding agent.' },
	{ slug: 'customizing-agents', name: 'Customizing agents', group: 'Engineering', description: 'Configuring an agent for a project.' },
	{ slug: 'building-agents', name: 'Building agents', group: 'Engineering', description: 'Building an agent from a model, a loop and tools.' },
];

export const ENGINEERING_AREAS = AREAS.filter((a) => a.group === 'Engineering').map((a) => a.slug);

export function areaOf(slug: string): Area {
	const a = AREAS.find((x) => x.slug === slug);
	if (!a) throw new Error(`Unknown area: ${slug}`);
	return a;
}
