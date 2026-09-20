import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Lesson frontmatter per spec S03 "Frontmatter". All optional: only lessons carry them. */
const lessonFields = z.object({
	mode: z.enum(['tutorial', 'explanation']).optional(),
	covers: z.array(z.string()).optional(),
	serves: z.array(z.string()).optional(),
	assumes: z.array(z.object({ objective: z.string(), lesson: z.string(), section: z.string() })).optional(),
	'extends-to': z.array(z.object({ label: z.string(), href: z.string() })).optional(),
});

const conceptSchema = z.object({ id: z.string(), name: z.string(), definition: z.string() });

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: lessonFields }) }),
	/**
	 * Starlight reads this collection for UI-string overrides on every page. Declaring it (even
	 * empty) stops Astro warning that it "does not exist or is empty". Files go in src/content/i18n/.
	 */
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
	/** site/src/data/topics/<area>/<topic>.yaml, per spec S02 "Storage". */
	topics: defineCollection({
		loader: glob({ pattern: '**/*.yaml', base: './src/data/topics' }),
		schema: z.object({
			id: z.string(),
			area: z.string(),
			name: z.string(),
			definition: z.string(),
			concepts: z.array(conceptSchema),
			links: z.object({
				prerequisites: z.array(z.string()).default([]),
				related: z.array(z.string()).default([]),
				specializations: z.array(z.string()).default([]),
			}),
			sources: z.array(z.string()).default([]),
		}),
	}),
	/** site/src/data/competencies/<area>.yaml */
	competencies: defineCollection({
		loader: glob({ pattern: '*.yaml', base: './src/data/competencies' }),
		schema: z.object({
			area: z.string(),
			competencies: z.array(
				z.object({
					id: z.string(),
					statement: z.string(),
					topics: z.array(z.string()).default([]),
					objectives: z.array(
						z.object({
							id: z.string(),
							statement: z.string(),
							level: z.enum(['base', 'expert']),
							behaviors: z.array(z.object({ claim: z.string(), why: z.string(), example: z.string() })).default([]),
						}),
					),
					alignment: z
						.array(
							z.object({
								framework: z.string(),
								code: z.string(),
								asks: z.string(),
								objectives: z.array(z.string()).default([]),
							}),
						)
						.default([]),
				}),
			),
		}),
	}),
	/** site/src/data/courses/<area>.yaml: the ordered lesson plan per area, per spec S02 "Storage". */
	courses: defineCollection({
		loader: glob({ pattern: '*.yaml', base: './src/data/courses' }),
		// `.strict()`: a misspelled key (`afterr`, `isue`) fails here instead of being dropped.
		schema: z
			.object({
				area: z.string(),
				lessons: z.array(
					z
						.object({
							/** Equals the page route (`<area>/<lesson>`) once the lesson is live. */
							id: z.string(),
							/** Must equal the page title once live; `mise run courses` checks. */
							title: z.string(),
							/** One topic id: a lesson covers one topic. */
							covers: z.string(),
							/** Learning objective ids the lesson teaches toward. */
							serves: z.array(z.string()).default([]),
							status: z.enum(['planned', 'drafting', 'live']),
							/** The lesson's GitHub issue number, until live. */
							issue: z.number().int().positive().optional(),
							/** Target length; keep lessons short. */
							minutes: z.number().int().positive(),
							/**
							 * Lesson ids in the same plan that this lesson will assume, for its place
							 * in the lesson graph before it is live. A live lesson takes its place
							 * from the `assumes` in its page frontmatter instead.
							 */
							after: z.array(z.string()).default([]),
						})
						.strict(),
				),
			})
			.strict(),
	}),
	/** site/src/data/bibliography.yaml, keyed by citation key. */
	bibliography: defineCollection({
		loader: file('./src/data/bibliography.yaml'),
		schema: z.object({
			title: z.string(),
			container: z.string().nullable().optional(),
			author: z.string().nullable().optional(),
			license: z.string().nullable().optional(),
			url: z.string().nullable().optional(),
		}),
	}),
};
