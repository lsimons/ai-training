import { parseMdx } from '@lib/checkpoint-tags';
import { assumedSectionError, sectionSlugs } from '@lib/section-slugs';
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
	it('ignores a heading inside a fence', () => {
		expect(slugs('```markdown\n## Not a heading\n```\n\n## Real\n')).toEqual(['real']);
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
