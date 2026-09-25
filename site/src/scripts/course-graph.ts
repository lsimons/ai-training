/**
 * The course page graph in the browser: node state and rings, the milestone
 * bar, the completion ring and the review card from the progress record,
 * redrawn on every progress write, and the `assumes` edges redrawn on resize.
 * The rules are in `course-graph-model.ts`.
 */
import {
	courseEdgePath,
	type GraphNode,
	nodeProgress,
	nodeState,
	reviewableItems,
	stopReached,
} from './course-graph-model';
import { progressPercent } from './overview';
import * as progress from './progress';
import { reviewDueLabel } from './progress-overview-model';
import { requiredData } from './required-element';

function bindCourse(root: HTMLElement) {
	const area = requiredData(root, 'course');
	const nodes: GraphNode[] = JSON.parse(requiredData(root, 'nodes'));
	// Items whose answer changed since they were scheduled restart at stage 1 (spec S05 "Content changes").
	progress.resetOutdatedReviews(reviewableItems(nodes));

	function draw() {
		const rec = progress.load();
		for (const n of nodes) {
			const el = root.querySelector<HTMLElement>(`[data-node="${n.id}"]`);
			if (!el) continue;
			el.dataset.state = nodeState(rec.lessons[n.id]);
			const { ring, count } = nodeProgress(n, rec);
			el.querySelector<HTMLElement>('[data-node-ring]')?.style.setProperty('--pct', String(ring));
			const countEl = el.querySelector<HTMLElement>('[data-node-count]');
			if (countEl) countEl.textContent = count;
		}
		// Milestone bar and completion ring show the one figure from spec S04 "Progress display":
		// finished / (all − skipped) lessons. The ring is the compact form of the same number.
		const { percent, skipped } = progressPercent(
			nodes.map((n) => n.id),
			rec,
		);
		const fill = root.querySelector<HTMLElement>('[data-milestone-fill]');
		if (fill) fill.style.width = `${percent}%`;
		for (const s of root.querySelectorAll<HTMLElement>('[data-stop]')) {
			s.dataset.reached = String(stopReached(percent, Number(s.dataset.stop)));
		}
		root.querySelector<HTMLElement>('[data-ring]')?.style.setProperty('--pct', String(percent));
		const label = root.querySelector<HTMLElement>('[data-ring-label]');
		if (label) label.textContent = `${percent}%`;
		const skippedEl = root.querySelector<HTMLElement>('[data-skipped]');
		if (skippedEl) {
			skippedEl.textContent = `${skipped} skipped`;
			skippedEl.hidden = skipped === 0;
		}
		// Review card: always linked; counts every due item, not just one session's worth.
		const due = progress.dueReviewIds(rec, `${area}/`);
		const card = root.querySelector<HTMLElement>('[data-review-card]');
		if (card) card.dataset.due = String(due.length > 0);
		const reviewLabel = root.querySelector<HTMLElement>('[data-review-label]');
		if (reviewLabel) reviewLabel.textContent = reviewDueLabel(due.length);
	}

	/** Dotted edges from the lesson that teaches an assumed objective to the lesson assuming it. */
	function drawEdges() {
		const svg = root.querySelector<SVGSVGElement>('.course-edges');
		const graph = root.querySelector<HTMLElement>('[data-graph]');
		const raw = root.querySelector('[data-edges]')?.textContent;
		if (!svg || !graph || !raw) return;
		const edges: { from: string; to: string }[] = JSON.parse(raw);
		const box = graph.getBoundingClientRect();
		svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
		svg.innerHTML = edges
			.map((e) => {
				const a = root.querySelector(`[data-node="${e.from}"]`)?.getBoundingClientRect();
				const b = root.querySelector(`[data-node="${e.to}"]`)?.getBoundingClientRect();
				return a && b ? `<path d="${courseEdgePath(a, b, box)}" />` : '';
			})
			.join('');
	}

	draw();
	drawEdges();
	document.addEventListener(progress.EVENT, draw);
	window.addEventListener('resize', drawEdges);
}

/** Binds every course graph under `doc`; returns how many it bound. */
export function mountCourseGraph(doc: ParentNode = document): number {
	const roots = doc.querySelectorAll<HTMLElement>('.course[data-course]');
	for (const root of roots) bindCourse(root);
	return roots.length;
}
