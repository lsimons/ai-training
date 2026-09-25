/**
 * The file the instructions builder (`widgets/InstructionsBuilder.astro`)
 * shows: an AGENTS.md drawn from the facts the learner ticked and the short
 * fields they filled in. Pure functions, no DOM, so they run under Node in
 * the unit tests. The DOM half is `instructions-builder.ts`.
 */

/** Every optional line of the file, in the order the form shows them. Each has a checkbox and a text field. */
export const OPTIONAL_LINES = ['runtime', 'test', 'lint', 'branch', 'notouch', 'mistake'] as const;

/** One optional line. */
export type OptionalLine = (typeof OPTIONAL_LINES)[number];

/** One optional line as the form holds it: whether it is ticked, and its trimmed text. */
export interface LineInput {
	on: boolean;
	text: string;
}

/** What the form holds, with every text already trimmed. */
export interface BuilderInput {
	name: string;
	purpose: string;
	lines: Record<OptionalLine, LineInput>;
}

/** The text of a ticked line, or its placeholder when the field is empty. */
function valueOr(line: LineInput, placeholder: string): string {
	return line.text || placeholder;
}

/** The AGENTS.md text for `input`, ending in one newline. A section with no ticked line is left out. */
export function buildInstructions(input: BuilderInput): string {
	const { lines: l } = input;
	const out: string[] = [`# ${input.name || 'my-project'}`];
	if (input.purpose) out.push('', input.purpose);

	const commands: string[] = [];
	if (l.runtime.on) commands.push(`- Runtime: ${valueOr(l.runtime, '<language and version>')}`);
	if (l.test.on) commands.push(`- Test: \`${valueOr(l.test, '<test command>')}\``);
	if (l.lint.on) commands.push(`- Lint and format: \`${valueOr(l.lint, '<lint command>')}\``);
	if (commands.length > 0) out.push('', '## Commands', '', ...commands);

	const rules: string[] = [];
	if (l.branch.on) rules.push(`- ${valueOr(l.branch, '<branch rule>')}`);
	if (l.notouch.on) rules.push(`- Never edit: ${valueOr(l.notouch, '<paths>')}`);
	if (l.mistake.on) rules.push(`- ${valueOr(l.mistake, '<the mistake to stop, and what to do instead>')}`);
	if (rules.length > 0) out.push('', '## Rules', '', ...rules);

	return `${out.join('\n')}\n`;
}

/** The line count next to the file name, counting only lines with text: `1 non-empty line`, `7 non-empty lines`. */
export function lineCountText(file: string): string {
	const n = file.split('\n').filter((line) => line.trim().length > 0).length;
	return `${n} non-empty line${n === 1 ? '' : 's'}`;
}
