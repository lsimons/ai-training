import { parseMdx } from '@lib/checkpoint-tags';
import { assumedSectionError, headingSlugs, sectionSlugs } from '@lib/section-slugs';
import { describe, expect, it } from 'vitest';

const slugs = (src: string) => sectionSlugs(parseMdx(src));

describe('sectionSlugs', () => {
	it('slugs the ## headings as the build does, dropping straight and curly apostrophes', () => {
		expect(slugs("## Grounding and what it doesn't fix\n\n## When instructions aren’t enough\n")).toEqual([
			'grounding-and-what-it-doesnt-fix',
			'when-instructions-arent-enough',
		]);
	});
	it('reads code spans and inline tags in a heading, and skips other depths', () => {
		expect(slugs('# Title\n\n## Run `git diff` <abbr>now</abbr>\n\n### Detail\n')).toEqual(['run-git-diff-now']);
	});
	it('numbers a repeated heading across all depths, as one slugger per page does', () => {
		expect(slugs('## Recap\n\n### Recap\n\n## Recap\n')).toEqual(['recap', 'recap-2']);
	});
	it('slugs dashes after smart punctuation, as a site build showed: a lone -- becomes an em dash, --- stays', () => {
		expect(slugs('## Plan -- then act\n\n## A --- b\n\n## x--y\n\n## Run `a -- b`\n')).toEqual([
			'plan--then-act',
			'a-----b',
			'xy',
			'run-a----b',
		]);
	});
	it('ignores a heading inside a fence', () => {
		expect(slugs('```markdown\n## Not a heading\n```\n\n## Real\n')).toEqual(['real']);
	});
});

describe('headingSlugs', () => {
	const all = (src: string) => headingSlugs(parseMdx(src));
	it('slugs the headings at every depth, in page order', () => {
		expect(all('# Title\n\n## One two\n\n### Three\n\nText\n\n## Four')).toEqual(['title', 'one-two', 'three', 'four']);
	});
	it('numbers a repeated heading, maps each space to a hyphen and slugs the link text only', () => {
		expect(all('## Review\n\n### Review\n\n## A  b\n\n## See [docs](https://example.com/x)\n')).toEqual([
			'review',
			'review-1',
			'a--b',
			'see-docs',
		]);
	});
	it('applies the smart punctuation dash rule, as sectionSlugs does', () => {
		expect(all('### Plan -- then act\n')).toEqual(['plan--then-act']);
	});
	it('agrees with sectionSlugs on the ## headings', () => {
		const src = '## Recap\n\n### Recap\n\n## Recap\n\n#### Recap\n';
		expect(all(src)).toEqual(['recap', 'recap-1', 'recap-2', 'recap-3']);
		expect(slugs(src)).toEqual(['recap', 'recap-2']);
	});
});

describe('assumedSectionError', () => {
	const where = 'src/data/areas/a/lessons/x.yaml';
	it('passes a section that is one of the slugs', () => {
		expect(assumedSectionError(where, 'a/p', 'blast-radius', ['intro', 'blast-radius'])).toBeNull();
	});
	it('fails a section that is not, naming the file, the lesson and its sections', () => {
		expect(assumedSectionError(where, 'a/p', "doesn't-fix", ['intro', 'doesnt-fix'])).toBe(
			`${where}: assumes section "doesn't-fix", which is not a "## " heading of a/p; its sections are: intro, doesnt-fix`,
		);
	});
});
