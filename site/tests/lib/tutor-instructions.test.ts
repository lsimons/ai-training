import { readFileSync } from 'node:fs';
import { BUNDLE_VERSION } from '@lib/lesson-bundles';
import { BUNDLE_URL_TEMPLATE, isoDate, renderTutorInstructions } from '@lib/tutor-instructions';
import { describe, expect, it } from 'vitest';

const site = 'https://lsimons.github.io';
const ROOT = 'https://lsimons.github.io/ai-training';

describe('renderTutorInstructions', () => {
	const text = renderTutorInstructions({ body: '# Tutor\n\nBody.\n', site, built: '2026-09-24' });

	it('opens with the four frontmatter fields from spec S08', () => {
		expect(text.startsWith('---\n')).toBe(true);
		const frontmatter = text.split('---\n')[1];
		expect(frontmatter).toBe(
			[
				`version: ${BUNDLE_VERSION}`,
				'built: 2026-09-24',
				`bundle_url: ${ROOT}/data/lessons/{area}/{lesson}.json`,
				`site: ${ROOT}`,
				'',
			].join('\n'),
		);
	});

	it('keeps the body unchanged after the frontmatter', () => {
		expect(text.endsWith('---\n\n# Tutor\n\nBody.\n')).toBe(true);
	});

	it('rejects a built value that is not an ISO date', () => {
		expect(() => renderTutorInstructions({ body: '', site, built: 'today' })).toThrow(/ISO date/);
	});

	it('ships the bundle URL template from the URL scheme', () => {
		expect(BUNDLE_URL_TEMPLATE).toBe('/data/lessons/{area}/{lesson}.json');
	});
});

describe('the bootstrap SKILL.md', () => {
	const skill = readFileSync(new URL('../../../.claude/skills/tutor/SKILL.md', import.meta.url), 'utf8');

	it('understands the version the build publishes', () => {
		expect(skill).toContain(`\`version: ${BUNDLE_VERSION}\``);
	});
});

describe('isoDate', () => {
	it('is the UTC date only', () => {
		expect(isoDate(new Date('2026-09-24T23:59:00Z'))).toBe('2026-09-24');
	});
});

describe('the instruction source', () => {
	const body = readFileSync(new URL('../../src/tutor/instructions.md', import.meta.url), 'utf8');

	it('has every section spec S08 lists', () => {
		for (const heading of [
			'## Ground rules',
			'## Starting a session',
			'## Verbs',
			'## Citing',
			'## Exemplar dialogues',
			'## Out of scope',
		]) {
			expect(body).toContain(heading);
		}
	});

	it('names every S01 tutor verb', () => {
		for (const verb of [
			'explain',
			'key points',
			'explain like I am five',
			'why it matters',
			'quiz me',
			'test me',
			'critique this',
		]) {
			expect(body).toMatch(new RegExp(`^\\| ${verb} +\\|`, 'm'));
		}
	});

	it('is written for a reader with the bundle, not the repo', () => {
		expect(body).not.toMatch(/localhost/);
		expect(body).not.toMatch(/site\/src|\.mdx|\.yaml/);
		for (const field of ['topics[].url', 'objectives[].competency_url', '{site}/glossary/#', 'assumes[]']) {
			expect(body).toContain(field);
		}
	});

	it('keeps the checkpoint answer from the learner', () => {
		expect(body).toContain('Never give the answer to a checkpoint');
		expect(body).toMatch(/`checkpoints\[\]\.answer`[^.]*grade/);
	});
});
