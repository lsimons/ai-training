/**
 * The one DOM lookup the page scripts share: an element the component's own
 * template always renders. A missing one means the markup and the script
 * drifted apart, so the lookup throws with the selector instead of letting a
 * later `null` access fail without context.
 */
export function requiredElement<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
	const el = root.querySelector<T>(selector);
	if (!el) throw new Error(`missing ${selector}: the component markup and its script disagree`);
	return el;
}

/** A `data-*` value the component's template always sets; throws with the attribute name when it is absent. */
export function requiredData(el: HTMLElement, key: string): string {
	const value = el.dataset[key];
	if (value === undefined)
		throw new Error(`missing data-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} on the component root`);
	return value;
}
