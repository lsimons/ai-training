import {
	type BuilderInput,
	buildInstructions,
	lineCountText,
	OPTIONAL_LINES,
	type OptionalLine,
} from '@scripts/instructions-builder-logic';
import { describe, expect, it } from 'vitest';

/** An input with every optional line in `on` ticked and empty, and no name or purpose. */
function form(on: OptionalLine[] = [], texts: Partial<Record<OptionalLine, string>> = {}): BuilderInput {
	const lines = {} as BuilderInput['lines'];
	for (const key of OPTIONAL_LINES) lines[key] = { on: on.includes(key), text: texts[key] ?? '' };
	return { name: '', purpose: '', lines };
}

describe('buildInstructions', () => {
	it('writes only the default heading when nothing is filled in or ticked', () => {
		expect(buildInstructions(form())).toBe('# my-project\n');
	});
	it('writes the name and the purpose paragraph', () => {
		expect(buildInstructions({ ...form(), name: 'invoice-mailer', purpose: 'Sends invoices.' })).toBe(
			'# invoice-mailer\n\nSends invoices.\n',
		);
	});
	it('writes a placeholder for each ticked line with an empty field', () => {
		expect(buildInstructions(form([...OPTIONAL_LINES]))).toBe(
			[
				'# my-project',
				'',
				'## Commands',
				'',
				'- Runtime: <language and version>',
				'- Test: `<test command>`',
				'- Lint and format: `<lint command>`',
				'',
				'## Rules',
				'',
				'- <branch rule>',
				'- Never edit: <paths>',
				'- <the mistake to stop, and what to do instead>',
				'',
			].join('\n'),
		);
	});
	it('writes the field text of each ticked line and leaves out unticked ones and empty sections', () => {
		const out = buildInstructions(
			form(['test', 'notouch'], { test: 'uv run pytest', notouch: 'uv.lock', runtime: 'Python 3.13' }),
		);
		expect(out).toBe('# my-project\n\n## Commands\n\n- Test: `uv run pytest`\n\n## Rules\n\n- Never edit: uv.lock\n');
		expect(out).not.toContain('Python');
	});
	it('leaves out the Commands section when only rules are ticked, and the Rules section when only commands are', () => {
		expect(buildInstructions(form(['branch'], { branch: 'Never commit to main' }))).toBe(
			'# my-project\n\n## Rules\n\n- Never commit to main\n',
		);
		expect(buildInstructions(form(['lint', 'runtime'], { lint: 'ruff check .' }))).toBe(
			'# my-project\n\n## Commands\n\n- Runtime: <language and version>\n- Lint and format: `ruff check .`\n',
		);
	});
	it('writes the mistake line as given', () => {
		expect(buildInstructions(form(['mistake'], { mistake: 'Do not add retries.' }))).toContain(
			'## Rules\n\n- Do not add retries.\n',
		);
	});
});

describe('lineCountText', () => {
	it('counts only lines with text', () => {
		expect(lineCountText('# a\n\n  \nb\n')).toBe('2 non-empty lines');
	});
	it('uses the singular for one line and the plural for none', () => {
		expect(lineCountText('# my-project\n')).toBe('1 non-empty line');
		expect(lineCountText('\n')).toBe('0 non-empty lines');
	});
});
