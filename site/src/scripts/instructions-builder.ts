/**
 * The instructions builder script (`widgets/InstructionsBuilder.astro`): on
 * each input it disables the text field of every unticked line, redraws the
 * AGENTS.md preview and its line count, and the Copy button puts the file
 * on the clipboard. The file text is `instructions-builder-logic.ts`. No DOM
 * access at import time, so it runs under Node in the unit tests with a
 * `happy-dom` document.
 */
import { type BuilderInput, buildInstructions, lineCountText, OPTIONAL_LINES } from './instructions-builder-logic';
import { requiredElement } from './required-element';

/** The selector of the element the component renders, once per instance. */
export const ROOT_SELECTOR = '.instructions-builder';

/** How long the Copy button shows its result before it reads "Copy" again. */
export const COPY_LABEL_MS = 1500;

/** Writes text to the clipboard. A parameter of the mount functions so tests pass their own. */
export type WriteText = (text: string) => Promise<void>;

const clipboardWrite: WriteText = (text) => navigator.clipboard.writeText(text);

function input(root: Element, selector: string): HTMLInputElement {
	return requiredElement<HTMLInputElement>(root, selector);
}

/** What the form under `root` holds, with every text trimmed. */
function readForm(root: Element): BuilderInput {
	const lines = {} as BuilderInput['lines'];
	for (const key of OPTIONAL_LINES) {
		lines[key] = { on: input(root, `.ib-has-${key}`).checked, text: input(root, `.ib-${key}`).value.trim() };
	}
	return {
		name: input(root, '.ib-name').value.trim(),
		purpose: input(root, '.ib-purpose').value.trim(),
		lines,
	};
}

/** Disables the text field of each unticked line, then redraws the file and its line count. */
function update(root: Element): void {
	for (const key of OPTIONAL_LINES) {
		input(root, `.ib-${key}`).disabled = !input(root, `.ib-has-${key}`).checked;
	}
	const file = buildInstructions(readForm(root));
	requiredElement(root, '.ib-code').textContent = file;
	requiredElement(root, '.ib-count').textContent = lineCountText(file);
}

/**
 * Binds one builder instance and draws its first file. A part the template
 * always renders throws when it is missing.
 */
export function mountInstructionsBuilder(root: Element, writeText: WriteText = clipboardWrite): void {
	const form = requiredElement<HTMLFormElement>(root, '.ib-form');
	const copy = requiredElement<HTMLButtonElement>(root, '.ib-copy');

	form.addEventListener('input', () => update(root));
	form.addEventListener('submit', (ev) => ev.preventDefault());

	copy.addEventListener('click', async () => {
		const label = copy.textContent;
		try {
			await writeText(buildInstructions(readForm(root)));
			copy.textContent = 'Copied';
		} catch {
			copy.textContent = 'Select and copy';
		}
		setTimeout(() => {
			copy.textContent = label;
		}, COPY_LABEL_MS);
	});

	update(root);
}

/** Mounts every builder instance under `root`. Returns how many it mounted. */
export function mountInstructionsBuilders(root: ParentNode, writeText: WriteText = clipboardWrite): number {
	const builders = root.querySelectorAll(ROOT_SELECTOR);
	for (const builder of builders) mountInstructionsBuilder(builder, writeText);
	return builders.length;
}
