/**
 * The topic map in the browser: each topic box colored by the state of its
 * lessons, redrawn on every progress write, and the prerequisite edges
 * redrawn on resize. The rules are in `topic-map-model.ts`.
 */
import * as progress from './progress';
import { requiredData } from './required-element';
import { type TopicCoverage, topicEdgePath, topicState } from './topic-map-model';

function bindTopicMap(root: HTMLElement) {
	const coverage: TopicCoverage[] = JSON.parse(requiredData(root, 'coverage'));

	function draw() {
		const rec = progress.load();
		for (const c of coverage) {
			const el = root.querySelector<HTMLElement>(`[data-topic="${c.id}"]`);
			if (el) el.dataset.state = topicState(c.lessons, rec);
		}
	}

	function drawEdges() {
		const svg = root.querySelector<SVGSVGElement>('.topic-map-edges');
		const raw = root.querySelector('[data-edges]')?.textContent;
		if (!svg || !raw) return;
		const edges: { from: string; to: string; cross: boolean }[] = JSON.parse(raw);
		const box = root.getBoundingClientRect();
		svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
		svg.innerHTML = edges
			.map((e) => {
				const a = root.querySelector(`[data-topic="${e.from}"]`)?.getBoundingClientRect();
				const b = root.querySelector(`[data-topic="${e.to}"]`)?.getBoundingClientRect();
				return a && b ? `<path d="${topicEdgePath(a, b, box)}" data-cross="${e.cross}" />` : '';
			})
			.join('');
	}

	draw();
	drawEdges();
	document.addEventListener(progress.EVENT, draw);
	window.addEventListener('resize', drawEdges);
}

/** Binds the topic map under `doc`; returns false when the page has no map. */
export function mountTopicMap(doc: ParentNode = document): boolean {
	const root = doc.querySelector<HTMLElement>('[data-topic-map]');
	if (!root) return false;
	bindTopicMap(root);
	return true;
}
