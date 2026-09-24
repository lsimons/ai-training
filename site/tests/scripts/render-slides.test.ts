import { describe, expect, it } from 'vitest';
import { countMarkers, disablePostMessage, INSERTED, MARKER } from '../../scripts/lib/render-slides.mjs';

const deck = `<script>\n${MARKER}\n        controls: true,\n});\n</script>`;

describe('disablePostMessage', () => {
	it('inserts postMessage: false with the comment right after the initialize call opens', () => {
		const out = disablePostMessage(deck);
		expect(out).toBe(`<script>\n${MARKER}\n${INSERTED}\n        controls: true,\n});\n</script>`);
		expect(out.match(/postMessage: false/g)).toHaveLength(1);
		expect(out).toContain('// Added by site/scripts/render-slides.mjs');
	});

	it('rejects a deck without the initialize call', () => {
		expect(() => disablePostMessage('<script>Reveal.configure({});</script>')).toThrow(
			`expected exactly one "${MARKER}", found 0`,
		);
	});

	it('rejects a deck with several initialize calls', () => {
		expect(() => disablePostMessage(`${deck}${deck}`)).toThrow(`expected exactly one "${MARKER}", found 2`);
	});
});

describe('countMarkers', () => {
	it('counts occurrences', () => {
		expect(countMarkers('')).toBe(0);
		expect(countMarkers(deck)).toBe(1);
		expect(countMarkers(`${deck}${deck}`)).toBe(2);
	});
});
