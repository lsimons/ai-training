/**
 * The post-render step of `mise run site-slides`: turn off the reveal.js
 * postMessage API in a Quarto-rendered deck.
 *
 * reveal.js (which Quarto inlines) listens for `message` events from any
 * origin by default (`postMessage: true`) and calls the named API method.
 * `initialize` is not on its blacklist, and its `dependencies` option loads
 * a script by URL, so a page on another origin that iframes the published
 * deck could run its own script on the site origin. Quarto 1.10 has no
 * front-matter key for the option, so `disablePostMessage` adds
 * `postMessage: false` to the generated `Reveal.initialize({...})` call
 * instead. `scripts/render-slides.mjs` is the command-line entry; tests
 * import this.
 */

/** The start of the call Quarto generates. It occurs once per deck; the vendored library never contains it. */
export const MARKER = 'Reveal.initialize({';

/** The lines inserted after the marker. The comment says who added them so a reader of the HTML does not look for them in the .qmd. */
export const INSERTED = [
	'        // Added by site/scripts/render-slides.mjs (not Quarto): the cross-window',
	'        // postMessage API checks no origin, so it stays off.',
	'        postMessage: false,',
].join('\n');

/** How many times `MARKER` occurs in `html`. */
export function countMarkers(html) {
	return html.split(MARKER).length - 1;
}

/**
 * Return `html` with `postMessage: false` added to its one `Reveal.initialize({` call.
 * Throws when the marker occurs zero or several times, so a Quarto template
 * change shows up as a failed render rather than a silently unpatched deck.
 */
export function disablePostMessage(html) {
	const occurrences = countMarkers(html);
	if (occurrences !== 1) {
		throw new Error(`expected exactly one "${MARKER}", found ${occurrences}`);
	}
	return html.replace(MARKER, `${MARKER}\n${INSERTED}`);
}
