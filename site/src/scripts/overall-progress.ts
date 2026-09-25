/**
 * The overall progress bar in the browser: the percent, the skipped count,
 * the due-review lines and the continue button, redrawn on every progress
 * write. Each `[data-overall]` block on the page is bound on its own.
 */
import { dueByCourse, dueLine } from './due-counts';
import { continueLink, overallText } from './overall-progress-model';
import { type CatalogCourse, overall } from './overview';
import * as progress from './progress';
import { requiredData, requiredElement } from './required-element';

function bindOverall(root: HTMLElement) {
	const catalog: CatalogCourse[] = JSON.parse(requiredData(root, 'catalog'));
	const base = requiredData(root, 'base').replace(/\/$/, '');
	const bar = requiredElement(root, '[data-bar]');
	const fillChild = bar.firstElementChild;
	if (!(fillChild instanceof HTMLElement)) throw new Error('missing the fill element inside [data-bar]');
	const fill: HTMLElement = fillChild;
	const pct = requiredElement(root, '[data-percent]');
	const skippedEl = requiredElement(root, '[data-skipped]');
	const text = root.querySelector<HTMLElement>('[data-text]');
	const cont = requiredElement<HTMLAnchorElement>(root, '[data-continue]');
	const dueLines = requiredElement(root, '[data-due-lines]');

	/** One line per course with items due, each linking to that course's review page. Hidden when none. */
	function drawDue(rec: progress.ProgressRecord) {
		const due = dueByCourse(catalog, rec, progress.today());
		dueLines.hidden = due.length === 0;
		dueLines.replaceChildren(
			...due.map((c) => {
				const li = document.createElement('li');
				const a = document.createElement('a');
				a.href = `${base}/${c.area}/review/`;
				a.dataset.dueLine = c.area;
				a.textContent = dueLine(c);
				li.appendChild(a);
				return li;
			}),
		);
	}

	function draw() {
		const rec = progress.load();
		const o = overall(catalog, rec);
		drawDue(rec);
		fill.style.width = `${o.percent}%`;
		bar.setAttribute('aria-valuenow', String(o.percent));
		pct.textContent = `${o.percent}%`;
		// Spec S04 "Progress display": skipped is out of the percent and shown as its own count.
		skippedEl.textContent = `${o.skipped} skipped`;
		skippedEl.hidden = o.skipped === 0;
		if (text) text.textContent = overallText(o);
		const link = continueLink(o, base);
		if (link) {
			cont.href = link.href;
			cont.textContent = link.text;
		}
	}
	draw();
	document.addEventListener(progress.EVENT, draw);
}

/** Binds every overall progress block under `doc`; returns how many it bound. */
export function mountOverallProgress(doc: ParentNode = document): number {
	const roots = doc.querySelectorAll<HTMLElement>('[data-overall]');
	for (const root of roots) bindOverall(root);
	return roots.length;
}
