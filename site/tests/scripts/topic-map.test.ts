// @vitest-environment happy-dom
/**
 * Binds `topic-map.ts` to a hand-written copy of the markup `TopicMap.astro`
 * renders. If the component's markup changes, the fixture here changes with
 * it, and the e2e suite checks that the two still agree. happy-dom has no
 * layout, so the edge test checks the paths it writes and
 * `topic-map-model.test.ts` checks the geometry.
 */
import * as progress from '@scripts/progress';
import { mountTopicMap } from '@scripts/topic-map';
import type { TopicCoverage } from '@scripts/topic-map-model';
import { beforeEach, describe, expect, it } from 'vitest';

const coverage: TopicCoverage[] = [
	{ id: 'concepts/tokens', lessons: ['concepts/a'] },
	{ id: 'concepts/gone', lessons: ['concepts/b'] },
];

function render(
	edges = '[{"from":"concepts/tokens","to":"concepts/next","cross":false},{"from":"concepts/tokens","to":"safety/x","cross":true}]',
) {
	document.body.innerHTML = `
	<div class="topic-map" data-topic-map data-coverage='${JSON.stringify(coverage)}'>
		<svg class="topic-map-edges"></svg>
		<a data-topic="concepts/tokens" data-state="untouched"></a>
		<a data-topic="concepts/next" data-state="untouched"></a>
		<a data-topic="safety/x" data-state="untouched"></a>
		<script type="application/json" data-edges>${edges}</script>
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

describe('mountTopicMap', () => {
	it('does nothing on a page without the map', () => {
		expect(mountTopicMap()).toBe(false);
	});

	it('colors topics from the record and redraws on a progress write', () => {
		render();
		expect(mountTopicMap()).toBe(true);
		expect(q('[data-topic="concepts/tokens"]').dataset.state).toBe('untouched');
		progress.markLessonRead('concepts/a');
		expect(q('[data-topic="concepts/tokens"]').dataset.state).toBe('in-progress');
		progress.finishLesson('concepts/a', []);
		expect(q('[data-topic="concepts/tokens"]').dataset.state).toBe('finished');
	});

	it('draws one path per edge and marks the cross-area ones', () => {
		render();
		mountTopicMap();
		const paths = [...q('.topic-map-edges').querySelectorAll('path')];
		expect(paths.map((p) => p.getAttribute('data-cross'))).toEqual(['false', 'true']);
	});

	it('skips the edges when the edge data is missing', () => {
		render('');
		mountTopicMap();
		expect(q('.topic-map-edges').getAttribute('viewBox')).toBeNull();
	});
});
