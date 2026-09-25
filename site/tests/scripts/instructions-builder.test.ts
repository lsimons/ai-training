/**
 * Mounts `instructions-builder.ts` on the markup the component renders (Astro
 * Container API), so a class the script looks up and the template dropped
 * fails here. The Container API renders `.astro` files only in Vitest's Node
 * environment, so the markup goes into a `happy-dom` window made here instead
 * of the `happy-dom` test environment. The file text itself is tested in
 * `instructions-builder-logic.test.ts`.
 */
import InstructionsBuilder from '@components/widgets/InstructionsBuilder.astro';
import {
	COPY_LABEL_MS,
	mountInstructionsBuilder,
	mountInstructionsBuilders,
	ROOT_SELECTOR,
} from '@scripts/instructions-builder';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const window = new Window();
// The script is typed against the DOM lib, and happy-dom's classes implement it.
const document = window.document as unknown as Document;
let markup: string;
beforeAll(async () => {
	const container = await AstroContainer.create();
	markup = await container.renderToString(InstructionsBuilder);
});
afterAll(async () => {
	await window.happyDOM.close();
});

beforeEach(() => {
	document.body.innerHTML = markup;
});
afterEach(() => {
	vi.useRealTimers();
});

function builder(): HTMLElement {
	return document.querySelector(ROOT_SELECTOR) as HTMLElement;
}

function field(selector: string): HTMLInputElement {
	return builder().querySelector(selector) as HTMLInputElement;
}

function code(): string {
	return builder().querySelector('.ib-code')?.textContent ?? '';
}

function count(): string {
	return builder().querySelector('.ib-count')?.textContent ?? '';
}

/** Sets a text field, or ticks or unticks a box, and fires the input event the form listens for. */
function type(selector: string, value: string | boolean): void {
	const el = field(selector);
	if (typeof value === 'boolean') el.checked = value;
	else el.value = value;
	el.dispatchEvent(new window.Event('input', { bubbles: true }) as unknown as Event);
}

describe('mountInstructionsBuilders', () => {
	it('draws the first file from the default ticks, with the rule fields disabled', () => {
		expect(mountInstructionsBuilders(document)).toBe(1);
		expect(code()).toBe(
			'# my-project\n\n## Commands\n\n- Runtime: <language and version>\n- Test: `<test command>`\n- Lint and format: `<lint command>`\n',
		);
		expect(count()).toBe('5 non-empty lines');
		expect(field('.ib-runtime').disabled).toBe(false);
		expect(field('.ib-branch').disabled).toBe(true);
		expect(field('.ib-notouch').disabled).toBe(true);
		expect(field('.ib-mistake').disabled).toBe(true);
	});
	it('mounts every instance on the page, each drawing from its own form, and returns 0 on a page without one', () => {
		document.body.innerHTML = markup + markup;
		expect(mountInstructionsBuilders(document)).toBe(2);
		const [first, second] = document.querySelectorAll(ROOT_SELECTOR);
		const firstCode = first?.querySelector('.ib-code');
		const before = firstCode?.textContent;
		expect(before).toContain('# my-project');
		const name = second?.querySelector('.ib-name') as HTMLInputElement;
		name.value = 'second-project';
		name.dispatchEvent(new window.Event('input', { bubbles: true }) as unknown as Event);
		expect(second?.querySelector('.ib-code')?.textContent).toContain('# second-project');
		expect(firstCode?.textContent).toBe(before);
		document.body.innerHTML = '<p>no builder</p>';
		expect(mountInstructionsBuilders(document)).toBe(0);
	});
	it('throws with the selector when the markup lacks a part the script needs', () => {
		builder().querySelector('.ib-count')?.remove();
		expect(() => mountInstructionsBuilders(document)).toThrow('missing .ib-count');
	});
});

describe('mountInstructionsBuilder', () => {
	it('redraws the file on input, trimming the fields', () => {
		mountInstructionsBuilder(builder());
		type('.ib-name', '  invoice-mailer ');
		type('.ib-purpose', 'Sends invoices.');
		type('.ib-test', 'uv run pytest');
		expect(code()).toContain('# invoice-mailer\n\nSends invoices.\n');
		expect(code()).toContain('- Test: `uv run pytest`');
	});
	it('enables a field when its box is ticked and drops its line when unticked', () => {
		mountInstructionsBuilder(builder());
		type('.ib-has-branch', true);
		expect(field('.ib-branch').disabled).toBe(false);
		expect(code()).toContain('## Rules\n\n- <branch rule>\n');
		type('.ib-has-runtime', false);
		type('.ib-has-test', false);
		type('.ib-has-lint', false);
		expect(field('.ib-runtime').disabled).toBe(true);
		expect(code()).toBe('# my-project\n\n## Rules\n\n- <branch rule>\n');
		expect(count()).toBe('3 non-empty lines');
	});
	it('does not submit the form', () => {
		mountInstructionsBuilder(builder());
		const ev = new window.Event('submit', { cancelable: true }) as unknown as Event;
		builder().querySelector('form')?.dispatchEvent(ev);
		expect(ev.defaultPrevented).toBe(true);
	});
	it('copies the file, says so, and restores the button label', async () => {
		vi.useFakeTimers();
		const writeText = vi.fn(async (_text: string) => {});
		mountInstructionsBuilder(builder(), writeText);
		type('.ib-name', 'invoice-mailer');
		const copy = builder().querySelector('.ib-copy') as HTMLButtonElement;
		copy.click();
		await vi.waitFor(() => expect(copy.textContent).toBe('Copied'));
		expect(writeText).toHaveBeenCalledWith(code());
		vi.advanceTimersByTime(COPY_LABEL_MS);
		expect(copy.textContent).toBe('Copy');
	});
	it('asks the learner to select and copy when the clipboard refuses, then restores the label', async () => {
		vi.useFakeTimers();
		const writeText = vi.fn(async (_text: string) => {
			throw new Error('denied');
		});
		mountInstructionsBuilder(builder(), writeText);
		const copy = builder().querySelector('.ib-copy') as HTMLButtonElement;
		copy.click();
		await vi.waitFor(() => expect(copy.textContent).toBe('Select and copy'));
		vi.advanceTimersByTime(COPY_LABEL_MS);
		expect(copy.textContent).toBe('Copy');
	});
	it('uses the browser clipboard by default', async () => {
		const writeText = vi.fn(async (_text: string) => {});
		vi.stubGlobal('navigator', { clipboard: { writeText } });
		try {
			mountInstructionsBuilders(document);
			(builder().querySelector('.ib-copy') as HTMLButtonElement).click();
			await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(code()));
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
