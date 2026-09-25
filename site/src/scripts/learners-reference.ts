/**
 * The `/reference/` page script (`LearnersReference.astro`, spec S02
 * "Learner's reference"): reads the progress record and draws the finished
 * lessons grouped by area, or the empty state, and redraws on every progress
 * change. The grouping is `finishedByArea` in `reference.ts`. No DOM access at
 * import time, so it runs under Node in the unit tests with a `happy-dom`
 * document.
 */
import * as progress from './progress';
import { finishedByArea, type ReferenceArea } from './reference';
import { requiredData, requiredElement } from './required-element';

/** The selector of the element the component renders. */
export const ROOT_SELECTOR = '[data-learners-reference]';

function link(base: string, path: string, text: string): HTMLAnchorElement {
	const a = document.createElement('a');
	a.href = `${base}${path}`;
	a.textContent = text;
	return a;
}

function areaSection(base: string, area: ReferenceArea): HTMLElement {
	const section = document.createElement('section');
	section.className = 'reference-area';
	section.dataset.referenceArea = area.area;
	const h = document.createElement('h2');
	h.textContent = area.title;
	section.appendChild(h);
	const ul = document.createElement('ul');
	for (const lesson of area.lessons) {
		const li = document.createElement('li');
		li.dataset.referenceFinished = lesson.id;
		li.appendChild(link(base, `/${lesson.id}/`, lesson.title));
		if (lesson.topics.length) {
			li.append(' · reference: ');
			lesson.topics.forEach((t, i) => {
				if (i > 0) li.append(', ');
				li.appendChild(link(base, `/topics/${t.id}/#reference`, t.name));
			});
		}
		ul.appendChild(li);
	}
	section.appendChild(ul);
	return section;
}

/**
 * Draws the reference list under `root` and redraws it on every progress
 * event. Returns false, and changes nothing, on a page without the component.
 * A part the component always renders throws when it is missing.
 */
export function mountLearnersReference(root: ParentNode): boolean {
	const el = root.querySelector<HTMLElement>(ROOT_SELECTOR);
	if (!el) return false;
	const catalog: ReferenceArea[] = JSON.parse(requiredData(el, 'catalog'));
	const base = requiredData(el, 'base').replace(/\/$/, '');
	const empty = requiredElement(el, '[data-reference-empty]');
	const areas = requiredElement(el, '[data-reference-areas]');
	const draw = () => {
		const finished = finishedByArea(catalog, progress.load());
		empty.hidden = finished.length > 0;
		areas.replaceChildren(...finished.map((area) => areaSection(base, area)));
	};
	draw();
	document.addEventListener(progress.EVENT, draw);
	return true;
}
