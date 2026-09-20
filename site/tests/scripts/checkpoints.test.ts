// @vitest-environment happy-dom
/**
 * Binds `checkpoints.ts` to hand-written copies of the markup the lesson
 * components render (see src/components/lesson/*.astro). If a component's
 * markup changes, the fixture here changes with it, and the e2e suite is the
 * check that the two still agree.
 */
import { bindAll, bindCheckpoint, copyForSkillsCheck } from '@scripts/checkpoints';
import * as progress from '@scripts/progress';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const LESSON = 'concepts/how-models-work';

function shell(kind: string, id: string, body: string, extra = ''): HTMLElement {
	document.body.innerHTML = `
		<section class="checkpoint" id="${id}" data-checkpoint data-kind="${kind}" data-progress-id="${LESSON}#${id}" ${extra}>
			<header class="cp-head"><span class="cp-state"></span></header>
			<div class="cp-body">${body}</div>
			<div class="cp-controls">
				<button type="button" class="cp-check">Check</button>
				<button type="button" class="cp-hint-btn">Hint</button>
				<button type="button" class="cp-skip">Skip</button>
				<button type="button" class="cp-giveup" hidden>Give up</button>
			</div>
			<p class="cp-hint" hidden>A hint.</p>
			<p class="cp-feedback"></p>
			<div class="cp-after" hidden>
				<span class="cp-stage" hidden>
					<span></span><span></span><span></span><span></span><span></span>
					<em class="cp-stage-label"></em>
				</span>
			</div>
		</section>`;
	const el = document.querySelector<HTMLElement>('[data-checkpoint]');
	if (!el) throw new Error('fixture did not render');
	return el;
}

const choiceBody = `
	<div class="cp-options">
		<label data-why="Search is separate."><input type="radio" name="q-choice" /><span>It searches</span></label>
		<label data-correct="true" data-consequence="It predicts tokens."><input type="radio" name="q-choice" /><span>It predicts</span></label>
	</div>`;

const q = <T extends Element = HTMLElement>(sel: string) => {
	const el = document.querySelector<T>(sel);
	if (!el) throw new Error(`missing ${sel}`);
	return el;
};
const click = (sel: string) => q<HTMLElement>(sel).click();
const feedback = () => q('.cp-feedback').textContent;
const state = () => q('[data-checkpoint]').dataset.state;

beforeEach(() => {
	localStorage.clear();
});

describe('bindCheckpoint', () => {
	it('binds once and ignores unknown kinds', () => {
		const el = shell('mystery', 'm', '');
		bindCheckpoint(el);
		expect(el.dataset.bound).toBe('true');
		bindCheckpoint(el);
		click('.cp-check');
		expect(feedback()).toBe('');
	});
	it('bindAll returns every checkpoint under the root', () => {
		shell('choice', 'c', choiceBody);
		expect(bindAll(document.body)).toHaveLength(1);
	});
	it('the hint toggles', () => {
		bindCheckpoint(shell('choice', 'c', choiceBody));
		expect(q('.cp-hint').hidden).toBe(true);
		click('.cp-hint-btn');
		expect(q('.cp-hint').hidden).toBe(false);
		click('.cp-hint-btn');
		expect(q('.cp-hint').hidden).toBe(true);
	});
	it('skip records a skip and reports', () => {
		const onResult = vi.fn();
		bindCheckpoint(shell('choice', 'c', choiceBody), { onResult });
		click('.cp-skip');
		expect(state()).toBe('skipped');
		expect(feedback()).toContain('Skipped');
		expect(onResult).toHaveBeenCalledWith(expect.anything(), false);
		expect(progress.load().checkpoints[`${LESSON}#c`]).toEqual({ state: 'skipped', attempts: 1 });
	});
	it('draws a stored state on bind', () => {
		progress.recordCheckpoint(`${LESSON}#c`, true);
		bindCheckpoint(shell('choice', 'c', choiceBody));
		expect(state()).toBe('passed');
		expect(q('.cp-state').textContent).toBe('passed');
	});
});

describe('choice', () => {
	it('needs a pick, then grades wrong and right', () => {
		const onResult = vi.fn();
		bindCheckpoint(shell('choice', 'c', choiceBody), { onResult });
		click('.cp-check');
		expect(feedback()).toBe('Pick an answer first.');
		expect(onResult).not.toHaveBeenCalled();
		q<HTMLInputElement>('label:not([data-correct]) input').checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Search is separate.');
		expect(state()).toBe('attempted');
		q<HTMLInputElement>('label[data-correct] input').checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Correct. It predicts tokens.');
		expect(q('.cp-feedback').className).toBe('cp-feedback ok');
		expect(state()).toBe('passed');
		expect(progress.load().checkpoints[`${LESSON}#c`]).toEqual({ state: 'passed', attempts: 2 });
		expect(onResult).toHaveBeenLastCalledWith(expect.anything(), true);
	});
});

describe('predict', () => {
	const body = (answer?: string) => `
		<div class="cp-predict" ${answer === undefined ? '' : `data-answer="${answer}"`}>
			<textarea></textarea>
			${
				answer === undefined
					? `<fieldset class="cp-selfgrade">
						<label><input type="radio" name="p-selfgrade" value="pass" /></label>
						<label><input type="radio" name="p-selfgrade" value="partial" /></label>
					</fieldset>`
					: `<pre class="cp-reveal" hidden>${answer}</pre>`
			}
		</div>`;
	it('compares normalized text and reveals the answer on a pass', () => {
		bindCheckpoint(shell('predict', 'p', body('27°C, sun')));
		click('.cp-check');
		expect(feedback()).toBe('Type your prediction first.');
		q<HTMLTextAreaElement>('textarea').value = '27°C, rain';
		click('.cp-check');
		expect(feedback()).toBe('Not quite. Trace it once more.');
		expect(q('.cp-reveal').hidden).toBe(true);
		q<HTMLTextAreaElement>('textarea').value = '  27°c,   SUN ';
		click('.cp-check');
		expect(feedback()).toBe('Correct. That is exactly the output.');
		expect(q('.cp-reveal').hidden).toBe(false);
		expect(state()).toBe('passed');
	});
	it('honor system: self-grade, only pass counts', () => {
		bindCheckpoint(shell('predict', 'p', body()));
		click('.cp-check');
		expect(feedback()).toBe('Run it, then say how your prediction held up.');
		q<HTMLInputElement>('input[value=partial]').checked = true;
		click('.cp-check');
		expect(feedback()).toContain('Adjust your prediction');
		expect(state()).toBe('attempted');
		q<HTMLInputElement>('input[value=pass]').checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Recorded as a pass.');
		expect(state()).toBe('passed');
	});
});

describe('order', () => {
	const body = `
		<ol class="cp-order">
			<li data-pos="1"><span>one</span><button data-move="up">↑</button><button data-move="down">↓</button></li>
			<li data-pos="2"><span>two</span><button data-move="up">↑</button><button data-move="down">↓</button></li>
			<li data-pos="3"><span>three</span><button data-move="up">↑</button><button data-move="down">↓</button></li>
		</ol>`;
	const positions = () => [...q('ol').children].map((li) => Number((li as HTMLElement).dataset.pos));

	it('never opens solved, and the move buttons reorder', () => {
		bindCheckpoint(shell('order', 'o', body));
		expect(positions()).not.toEqual([1, 2, 3]);
		click('.cp-check');
		expect(feedback()).toBe('Not the right order yet.');
		expect(state()).toBe('attempted');
		// Sort by moving each item up until it sits at its position.
		for (let pos = 1; pos <= 3; pos++) {
			for (let k = 0; k < 3; k++) {
				const idx = positions().indexOf(pos);
				if (idx > pos - 1) q<HTMLElement>(`ol li:nth-child(${idx + 1}) [data-move=up]`).click();
			}
		}
		expect(positions()).toEqual([1, 2, 3]);
		click('.cp-check');
		expect(feedback()).toBe('Correct order.');
		expect(state()).toBe('passed');
	});
	it('down moves an item later; edges are no-ops', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.999);
		bindCheckpoint(shell('order', 'o', body));
		// A no-op shuffle lands on the solved order, so the rotation applies: 2, 3, 1.
		expect(positions()).toEqual([2, 3, 1]);
		q<HTMLElement>('ol li:nth-child(1) [data-move=down]').click();
		expect(positions()).toEqual([3, 2, 1]);
		q<HTMLElement>('ol li:nth-child(3) [data-move=down]').click();
		q<HTMLElement>('ol li:nth-child(1) [data-move=up]').click();
		expect(positions()).toEqual([3, 2, 1]);
		vi.restoreAllMocks();
	});
});

describe('sort', () => {
	const body = `
		<div class="cp-sort">
			<button class="cp-pool-target">Unplaced</button>
			<div class="cp-pool">
				<button class="cp-chip" data-bucket="0" aria-pressed="false">a</button>
				<button class="cp-chip" data-bucket="1" aria-pressed="false">b</button>
			</div>
			<div class="cp-bucket" data-bucket="0"><button class="cp-bucket-target">Left</button><div class="cp-bucket-items"></div></div>
			<div class="cp-bucket" data-bucket="1"><button class="cp-bucket-target">Right</button><div class="cp-bucket-items"></div></div>
		</div>`;
	const chip = (text: string) => {
		const c = [...document.querySelectorAll<HTMLElement>('.cp-chip')].find((x) => x.textContent === text);
		if (!c) throw new Error(`no chip ${text}`);
		return c;
	};
	const bucketTarget = (n: number) => q<HTMLElement>(`.cp-bucket[data-bucket="${n}"] .cp-bucket-target`);

	it('select then place, with unplaced and wrong-bucket feedback', () => {
		bindCheckpoint(shell('sort', 's', body));
		bucketTarget(0).click();
		expect(feedback()).toBe('Select an item first, then a bucket.');
		click('.cp-check');
		expect(feedback()).toBe('2 items still to place.');
		expect(state()).toBe('untouched');
		chip('a').click();
		expect(chip('a').getAttribute('aria-pressed')).toBe('true');
		chip('a').click();
		expect(chip('a').getAttribute('aria-pressed')).toBe('false');
		chip('a').click();
		bucketTarget(1).click();
		chip('b').click();
		bucketTarget(0).click();
		click('.cp-check');
		expect(feedback()).toBe('Some items are in the wrong bucket.');
		expect(state()).toBe('attempted');
		// Take one back to the pool, then place both correctly.
		chip('a').click();
		click('.cp-pool-target');
		expect(q('.cp-pool').children).toHaveLength(1);
		click('.cp-pool-target');
		chip('a').click();
		bucketTarget(0).click();
		chip('b').click();
		bucketTarget(1).click();
		click('.cp-check');
		expect(feedback()).toBe('All placed correctly.');
		expect(state()).toBe('passed');
	});
});

describe('repair', () => {
	const body = `
		<div class="cp-repair">
			<textarea>broken</textarea>
			<button class="cp-reveal-btn">Reveal</button>
			<div class="cp-model" hidden><pre>fixed</pre></div>
			<fieldset class="cp-selfgrade" hidden>
				<label><input type="radio" name="r-selfgrade" value="pass" /></label>
				<label><input type="radio" name="r-selfgrade" value="partial" /></label>
				<label><input type="radio" name="r-selfgrade" value="retry" /></label>
			</fieldset>
		</div>`;
	it('reveal first, then grade; retry and partial do not pass', () => {
		bindCheckpoint(shell('repair', 'r', body));
		click('.cp-check');
		expect(feedback()).toBe('Write your fix, then reveal the model answer and compare.');
		click('.cp-reveal-btn');
		expect(q('.cp-model').hidden).toBe(false);
		expect(q('.cp-selfgrade').hidden).toBe(false);
		expect(q<HTMLButtonElement>('.cp-reveal-btn').disabled).toBe(true);
		click('.cp-check');
		expect(feedback()).toBe('Compare with the model answer and grade yourself.');
		q<HTMLInputElement>('input[value=retry]').checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Edit your version and grade again.');
		expect(state()).toBe('untouched');
		q<HTMLInputElement>('input[value=partial]').checked = true;
		click('.cp-check');
		expect(feedback()).toContain('Recorded as partial');
		expect(state()).toBe('attempted');
		q<HTMLInputElement>('input[value=pass]').checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Recorded as a pass.');
		expect(state()).toBe('passed');
	});
});

describe('skills check copy', () => {
	const repairBody = `
		<div class="cp-repair">
			<textarea>broken</textarea>
			<button class="cp-reveal-btn">Reveal</button>
			<div class="cp-model" hidden><pre>fixed</pre></div>
			<fieldset class="cp-selfgrade" hidden>
				<label><input type="radio" name="r-selfgrade" value="pass" /></label>
				<label><input type="radio" name="r-selfgrade" value="partial" /></label>
			</fieldset>
		</div>`;
	it('a repair copy with renamed radios still grades, and records under the original id', () => {
		const body = shell('repair', 'r', repairBody);
		const copy = copyForSkillsCheck(body);
		document.body.appendChild(copy);
		expect(copy.id).toBe('');
		expect(copy.dataset.skillsItem).toBe('r');
		expect(copy.dataset.progressId).toBe(`${LESSON}#r`);
		expect(copy.querySelector('.cp-skip')).toBeNull();
		expect(copy.querySelector<HTMLInputElement>('input[value=pass]')?.name).toBe('skills-r-selfgrade');
		const record = vi.fn();
		bindCheckpoint(copy, { record });
		copy.querySelector<HTMLElement>('.cp-reveal-btn')?.click();
		const pass = copy.querySelector<HTMLInputElement>('input[value=pass]');
		if (pass) pass.checked = true;
		copy.querySelector<HTMLElement>('.cp-check')?.click();
		expect(copy.querySelector('.cp-feedback')?.textContent).toBe('Recorded as a pass.');
		expect(record).toHaveBeenCalledWith(`${LESSON}#r`, true);
		// `record` replaces the default write, so the record is untouched here.
		expect(progress.load().checkpoints[`${LESSON}#r`]).toBeUndefined();
		// The body's own radio group is separate from the copy's.
		expect(body.querySelector<HTMLInputElement>('input[value=pass]')?.checked).toBe(false);
	});
	it('a match copy rewrites its nested ids and the attributes that point at them', () => {
		const matchBody = `
			<div class="cp-match" data-rationale="r">
				<div class="cp-match-row" data-option="0">
					<label for="m-row-0">A</label>
					<select id="m-row-0" aria-describedby="m-row-0-fb"><option value="">-</option><option value="0">x</option></select>
					<span class="cp-row-feedback" id="m-row-0-fb"></span>
				</div>
			</div>`;
		const body = shell('match', 'm', matchBody);
		const copy = copyForSkillsCheck(body);
		document.body.appendChild(copy);
		expect(copy.querySelector('label')?.getAttribute('for')).toBe('skills-m-row-0');
		expect(copy.querySelector('select')?.id).toBe('skills-m-row-0');
		expect(copy.querySelector('select')?.getAttribute('aria-describedby')).toBe('skills-m-row-0-fb');
		expect(copy.querySelector('.cp-row-feedback')?.id).toBe('skills-m-row-0-fb');
		const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('review mode', () => {
	const id = `${LESSON}#c`;
	function schedule(stage: number | 'done' = 1) {
		progress.update((r) => {
			r.reviews[id] = { stage, due: '2000-01-01', last: null, history: [], revision: 1 };
		});
	}

	it('shows the stage pills and records one pass on Check', () => {
		schedule(2);
		const onResult = vi.fn();
		bindCheckpoint(shell('choice', 'c', choiceBody), { review: true, onResult });
		expect(q('.cp-stage').hidden).toBe(false);
		expect(q('.cp-stage-label').textContent).toBe('stage 2 of 5');
		expect([...document.querySelectorAll('.cp-stage > span')].map((s) => (s as HTMLElement).dataset.on)).toEqual([
			'true',
			'true',
			'false',
			'false',
			'false',
		]);
		expect(q<HTMLButtonElement>('.cp-giveup').disabled).toBe(true);
		q<HTMLInputElement>('label[data-correct] input').checked = true;
		click('.cp-check');
		expect(q('.cp-stage-label').textContent).toBe('stage 3 of 5');
		expect(q('.cp-after').hidden).toBe(false);
		const pass = [{ at: progress.today(), result: 'pass' }];
		expect(progress.load().reviews[id]?.history).toEqual(pass);
		// A second Check records nothing more, and lesson progress is untouched.
		click('.cp-check');
		expect(progress.load().reviews[id]?.history).toEqual(pass);
		expect(progress.load().checkpoints[id]).toBeUndefined();
		expect(onResult).toHaveBeenCalledTimes(1);
	});
	it('a wrong answer enables Give Up, which reveals and records one fail', () => {
		schedule(3);
		bindCheckpoint(shell('choice', 'c', choiceBody), { review: true });
		q<HTMLInputElement>('label:not([data-correct]) input').checked = true;
		click('.cp-check');
		expect(progress.load().reviews[id]?.history).toEqual([]);
		expect(q<HTMLButtonElement>('.cp-giveup').disabled).toBe(false);
		click('.cp-giveup');
		expect(q('label[data-correct]').classList.contains('cp-answer')).toBe(true);
		expect(feedback()).toBe('The answer is marked. It predicts tokens.');
		expect(q('.cp-stage-label').textContent).toBe('stage 1 of 5');
		expect(q<HTMLButtonElement>('.cp-giveup').disabled).toBe(true);
		click('.cp-giveup');
		expect(progress.load().reviews[id]?.history).toEqual([{ at: progress.today(), result: 'fail' }]);
	});
	it('a retired item shows every pill lit', () => {
		schedule('done');
		bindCheckpoint(shell('choice', 'c', choiceBody), { review: true });
		expect(q('.cp-stage-label').textContent).toBe('retired');
	});
	it('give up reveals a predict answer', () => {
		progress.update((r) => {
			r.reviews[`${LESSON}#p`] = { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 };
		});
		bindCheckpoint(
			shell(
				'predict',
				'p',
				'<div class="cp-predict" data-answer="x"><textarea></textarea><pre class="cp-reveal" hidden>x</pre></div>',
			),
			{ review: true },
		);
		q<HTMLTextAreaElement>('textarea').value = 'y';
		click('.cp-check');
		click('.cp-giveup');
		expect(q('.cp-reveal').hidden).toBe(false);
		expect(feedback()).toBe('The output is shown below.');
	});
	it('give up solves an order and fills a sort', () => {
		progress.update((r) => {
			r.reviews[`${LESSON}#o`] = { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 };
			r.reviews[`${LESSON}#s`] = { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 };
		});
		bindCheckpoint(
			shell(
				'order',
				'o',
				'<ol class="cp-order"><li data-pos="1"></li><li data-pos="2"></li><li data-pos="3"></li></ol>',
			),
			{ review: true },
		);
		click('.cp-check');
		click('.cp-giveup');
		expect([...q('ol').children].map((li) => (li as HTMLElement).dataset.pos)).toEqual(['1', '2', '3']);
		expect(feedback()).toBe('The steps are now in the right order.');

		bindCheckpoint(
			shell(
				'sort',
				's',
				`<div class="cp-pool"><button class="cp-chip" data-bucket="0">a</button></div>
				<div class="cp-bucket" data-bucket="0"><button class="cp-bucket-target"></button><div class="cp-bucket-items"></div></div>
				<div class="cp-bucket" data-bucket="1"><button class="cp-bucket-target"></button><div class="cp-bucket-items"></div></div>`,
			),
			{ review: true },
		);
		// Place the chip wrong, check, then give up.
		q<HTMLElement>('.cp-chip').click();
		q<HTMLElement>('.cp-bucket[data-bucket="1"] .cp-bucket-target').click();
		click('.cp-check');
		click('.cp-giveup');
		expect(q('.cp-bucket[data-bucket="0"] .cp-bucket-items').children).toHaveLength(1);
		expect(feedback()).toBe('Every item is now in its bucket.');
	});
});

describe('multi-choice', () => {
	const body = `
		<fieldset class="cp-options cp-multi" data-count="2">
			<label data-correct="true"><input type="checkbox" name="m-multi" /><span>a</span></label>
			<label data-why="Clear to whom?"><input type="checkbox" name="m-multi" /><span>b</span></label>
			<label data-correct="true"><input type="checkbox" name="m-multi" /><span>c</span></label>
		</fieldset>`;
	const box = (n: number) => q<HTMLInputElement>(`.cp-multi label:nth-of-type(${n}) input`);

	it('needs picks, names a wrong pick, counts the missing ones, then passes', () => {
		bindCheckpoint(shell('multi-choice', 'm', body));
		click('.cp-check');
		expect(feedback()).toBe('Pick 2 answers first.');
		expect(state()).toBe('untouched');
		box(1).checked = true;
		click('.cp-check');
		expect(feedback()).toBe('1 of 2 so far, and nothing wrong. 1 more to find.');
		expect(state()).toBe('attempted');
		box(2).checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Clear to whom?');
		box(2).checked = false;
		box(3).checked = true;
		click('.cp-check');
		expect(feedback()).toBe('Correct.');
		expect(state()).toBe('passed');
	});
	it('give up marks the correct items', () => {
		progress.update((r) => {
			r.reviews[`${LESSON}#m`] = { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 };
		});
		bindCheckpoint(shell('multi-choice', 'm', body), { review: true });
		box(2).checked = true;
		click('.cp-check');
		click('.cp-giveup');
		expect(document.querySelectorAll('label.cp-answer')).toHaveLength(2);
		expect(feedback()).toBe('The correct items are marked.');
	});
});

describe('match', () => {
	const body = `
		<div class="cp-match" data-rationale="Smaller is safer.">
			<div class="cp-match-row" data-option="0" data-why="Keep the send step.">
				<select><option value="">Choose…</option><option value="0">Drafts</option><option value="1">Copy</option></select>
				<span class="cp-row-feedback"></span>
			</div>
			<div class="cp-match-row" data-option="1">
				<select><option value="">Choose…</option><option value="0">Drafts</option><option value="1">Copy</option></select>
				<span class="cp-row-feedback"></span>
			</div>
		</div>`;
	const select = (n: number) => q<HTMLSelectElement>(`.cp-match-row:nth-child(${n}) select`);
	const row = (n: number) => q(`.cp-match-row:nth-child(${n})`);

	it('needs every row filled, marks each row, and shows the rationale on a full pass', () => {
		bindCheckpoint(shell('match', 'x', body));
		click('.cp-check');
		expect(feedback()).toBe('2 rows still to fill.');
		select(1).value = '1';
		click('.cp-check');
		expect(feedback()).toBe('1 row still to fill.');
		expect(state()).toBe('untouched');
		select(2).value = '0';
		click('.cp-check');
		expect(feedback()).toBe('2 rows wrong. Each row says which.');
		expect(row(1).dataset.state).toBe('wrong');
		expect(row(1).querySelector('.cp-row-feedback')?.textContent).toBe('Keep the send step.');
		expect(row(2).querySelector('.cp-row-feedback')?.textContent).toBe('Not this one.');
		select(1).value = '0';
		select(2).value = '1';
		click('.cp-check');
		expect(feedback()).toBe('Correct. Smaller is safer.');
		expect(row(1).dataset.state).toBe('right');
		expect(row(1).querySelector('.cp-row-feedback')?.textContent).toBe('Right.');
		expect(state()).toBe('passed');
	});
	it('give up fills every row neutrally and shows the rationale', () => {
		progress.update((r) => {
			r.reviews[`${LESSON}#x`] = { stage: 1, due: '2000-01-01', last: null, history: [], revision: 1 };
		});
		bindCheckpoint(shell('match', 'x', body), { review: true });
		select(1).value = '1';
		select(2).value = '0';
		click('.cp-check');
		click('.cp-giveup');
		expect(select(1).value).toBe('0');
		expect(select(2).value).toBe('1');
		expect(row(1).dataset.state).toBe('revealed');
		expect(row(1).querySelector('.cp-row-feedback')?.textContent).toBe('');
		expect(feedback()).toBe('Each row now shows its answer. Smaller is safer.');
	});
});
