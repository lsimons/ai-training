import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

/** Lesson frontmatter per spec S03 "Frontmatter". All optional: only lessons carry them. */
const lessonFields = z.object({
	mode: z.enum(['tutorial', 'explanation']).optional(),
	covers: z.array(z.string()).optional(),
	serves: z.array(z.string()).optional(),
	assumes: z
		.array(z.object({ objective: z.string(), lesson: z.string(), section: z.string() }))
		.optional(),
	'extends-to': z.array(z.object({ label: z.string(), href: z.string() })).optional(),
	sources: z.array(z.string()).optional(),
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
							behaviors: z
								.array(z.object({ claim: z.string(), why: z.string(), example: z.string() }))
								.default([]),
						})
					),
					alignment: z
						.array(
							z.object({
								framework: z.string(),
								code: z.string(),
								asks: z.string(),
								objectives: z.array(z.string()).default([]),
							})
						)
						.default([]),
				})
			),
		}),
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
