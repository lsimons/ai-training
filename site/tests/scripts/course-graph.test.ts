// @vitest-environment happy-dom
/**
 * Binds `course-graph.ts` to a hand-written copy of the markup
 * `CourseGraph.astro` renders. If the component's markup changes, the
 * fixture here changes with it, and the e2e suite checks that the two still
 * agree. happy-dom has no layout, so the edge test checks the path count and
 * `course-graph-model.test.ts` checks the geometry.
 */
import { mountCourseGraph } from '@scripts/course-graph';
import type { GraphNode } from '@scripts/course-graph-model';
import * as progress from '@scripts/progress';
import { beforeEach, describe, expect, it } from 'vitest';

const nodes: GraphNode[] = [
	{ id: 'concepts/a', checkpoints: [{ id: 'c1', reviewable: true, revision: 2 }] },
	{ id: 'concepts/b', checkpoints: [] },
	{ id: 'concepts/missing', checkpoints: [] },
];

function render(edges = '[{"from":"concepts/a","to":"concepts/b"},{"from":"concepts/a","to":"concepts/coming"}]') {
	document.body.innerHTML = `
	<div class="course" data-course="concepts" data-nodes='${JSON.stringify(nodes)}'>
		<div data-ring><span data-ring-label>0%</span></div>
		<div data-milestone-fill></div>
		<ol><li data-stop="0"></li><li data-stop="50"></li><li data-stop="100"></li></ol>
		<p data-skipped hidden></p>
		<div data-graph>
			<svg class="course-edges"></svg>
			<a data-node="concepts/a"><span data-node-ring></span><span data-node-count></span></a>
			<a data-node="concepts/b"><span data-node-ring></span><span data-node-count></span></a>
			<script type="application/json" data-edges>${edges}</script>
		</div>
		<aside data-review-card data-due="false"><a data-review-label>Review: nothing due yet</a></aside>
	</div>`;
}

const q = <T extends Element = HTMLElement>(sel: string) => {
	const el = document.querySelector<T>(sel);
	if (!el) throw new Error(`missing ${sel}`);
	return el;
};

beforeEach(() => {
	localStorage.clear();
	document.body.replaceChildren();
});

describe('mountCourseGraph', () => {
	it('binds nothing on a page without a course graph', () => {
		expect(mountCourseGraph()).toBe(0);
	});

	it('draws an untouched course and one path per edge whose ends exist', () => {
		render();
		expect(mountCourseGraph()).toBe(1);
		expect(q('[data-node="concepts/a"]').dataset.state).toBe('untouched');
		expect(q('[data-node="concepts/a"] [data-node-count]').textContent).toBe('0/1 checkpoints');
		expect(q('[data-node="concepts/b"] [data-node-count]').textContent).toBe('');
		expect([...document.querySelectorAll<HTMLElement>('[data-stop]')].map((s) => s.dataset.reached)).toEqual([
			'true',
			'false',
			'false',
		]);
		expect(q('.course-edges').querySelectorAll('path')).toHaveLength(1);
		expect(q('.course-edges').getAttribute('viewBox')).toMatch(/^0 0 /);
	});

	it('restarts a review item whose answer changed, then redraws on progress writes', () => {
		progress.finishLesson('concepts/a', [{ id: 'concepts/a#c1', revision: 1 }]);
		progress.update((r) => {
			const item = r.reviews['concepts/a#c1'];
			if (item) item.stage = 3;
		});
		render();
		mountCourseGraph();
		expect(progress.load().reviews['concepts/a#c1']?.stage).toBe(1);
		progress.recordCheckpoint('concepts/a#c1', true);
		progress.skipLesson('concepts/b');
		progress.update((r) => {
			const item = r.reviews['concepts/a#c1'];
			if (item) item.due = progress.today();
		});
		expect(q('[data-node="concepts/a"]').dataset.state).toBe('finished');
		expect(q('[data-node="concepts/b"]').dataset.state).toBe('skipped');
		expect(q('[data-node="concepts/a"] [data-node-ring]').style.getPropertyValue('--pct')).toBe('100');
		// Two known lessons plus one the markup lacks: 1 finished of 3 minus 1 skipped.
		expect(q('[data-ring-label]').textContent).toBe('50%');
		expect(q('[data-milestone-fill]').style.width).toBe('50%');
		expect(q('[data-skipped]').hidden).toBe(false);
		expect(q('[data-skipped]').textContent).toBe('1 skipped');
		expect(q('[data-review-card]').dataset.due).toBe('true');
		expect(q('[data-review-label]').textContent).toBe('Review due: 1 item');
	});

	it('skips the edges when the edge data is missing', () => {
		render('');
		mountCourseGraph();
		expect(q('.course-edges').getAttribute('viewBox')).toBeNull();
	});
});
