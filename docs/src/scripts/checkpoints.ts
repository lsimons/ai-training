/**
 * Client behaviour for checkpoints (spec S01 "Interaction types", S03
 * "Checkpoints") in lessons and on review pages (spec S05).
 *
 * The components render the markup; this module binds it. A checkpoint is a
 * `<section data-checkpoint data-kind=...>` whose progress key is
 * `data-progress-id` (`<lesson id>#<checkpoint id>`).
 */
import * as progress from './progress';

export interface BindOptions {
	/** Review mode adds Give Up, stage pills and the frequency control, and records to `reviews`. */
	review?: boolean;
	onResult?: (el: HTMLElement, passed: boolean) => void;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

function $<T extends Element = HTMLElement>(root: ParentNode, sel: string): T | null {
	return root.querySelector<T>(sel);
}

function announce(el: HTMLElement, kind: 'ok' | 'nope' | 'note', text: string) {
	const f = $(el, '.cp-feedback');
	if (!f) return;
	f.textContent = text;
	f.className = `cp-feedback ${kind}`;
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/** Each kind returns a grader: () => passed | null (null = nothing to grade yet). */
type Grader = () => boolean | null;

function bindChoice(el: HTMLElement): Grader {
	return () => {
		const picked = $<HTMLInputElement>(el, 'input[type=radio]:checked');
		if (!picked) {
			announce(el, 'note', 'Pick an answer first.');
			return null;
		}
		const label = picked.closest('label')!;
		const ok = label.dataset.correct === 'true';
		const why = label.dataset.why;
		const consequence = label.dataset.consequence;
		if (ok) announce(el, 'ok', consequence ? `Correct. ${consequence}` : 'Correct.');
		else announce(el, 'nope', consequence ?? why ?? 'Not quite. Try again.');
		return ok;
	};
}

function bindPredict(el: HTMLElement): Grader {
	const answer = $(el, '.cp-predict')?.dataset.answer;
	const ta = $<HTMLTextAreaElement>(el, 'textarea')!;
	if (answer === undefined) {
		// Honour-system variant: the learner ran it and grades themselves.
		return () => {
			const grade = $<HTMLInputElement>(el, 'input[name$="-selfgrade"]:checked');
			if (!grade) {
				announce(el, 'note', 'Run it, then say how your prediction held up.');
				return null;
			}
			const ok = grade.value === 'pass';
			announce(el, ok ? 'ok' : 'nope', ok ? 'Recorded as a pass.' : 'Recorded. Adjust your prediction and try once more when you are ready.');
			return ok;
		};
	}
	return () => {
		if (!ta.value.trim()) {
			announce(el, 'note', 'Type your prediction first.');
			return null;
		}
		const ok = norm(ta.value) === norm(answer);
		announce(el, ok ? 'ok' : 'nope', ok ? 'Correct. That is exactly the output.' : 'Not quite. Trace it once more.');
		if (ok) {
			const reveal = $(el, '.cp-reveal');
			if (reveal) reveal.hidden = false;
		}
		return ok;
	};
}

function bindOrder(el: HTMLElement): Grader {
	const list = $<HTMLOListElement>(el, 'ol.cp-order')!;
	const items = shuffle([...list.children] as HTMLLIElement[]);
	// Never present the already-correct order.
	if (items.length > 1 && items.every((li, i) => Number(li.dataset.pos) === i + 1)) items.push(items.shift()!);
	items.forEach((li) => list.appendChild(li));
	list.querySelectorAll<HTMLButtonElement>('button[data-move]').forEach((btn) => {
		btn.addEventListener('click', () => {
			const li = btn.closest('li')!;
			if (btn.dataset.move === 'up' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
			if (btn.dataset.move === 'down' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
			btn.focus();
		});
	});
	return () => {
		const ok = [...list.children].every((li, i) => Number((li as HTMLElement).dataset.pos) === i + 1);
		announce(el, ok ? 'ok' : 'nope', ok ? 'Correct order.' : 'Not the right order yet.');
		return ok;
	};
}

/** Click a chip to select it, then click a bucket to place it. Keyboard: both are buttons. */
function bindSort(el: HTMLElement): Grader {
	const pool = $(el, '.cp-pool')!;
	const chips = shuffle([...pool.querySelectorAll<HTMLButtonElement>('.cp-chip')]);
	chips.forEach((c) => pool.appendChild(c));
	let selected: HTMLButtonElement | null = null;
	const select = (chip: HTMLButtonElement | null) => {
		el.querySelectorAll('.cp-chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
		selected = chip;
		if (chip) chip.setAttribute('aria-pressed', 'true');
	};
	el.querySelectorAll<HTMLButtonElement>('.cp-chip').forEach((chip) => {
		chip.addEventListener('click', () => select(selected === chip ? null : chip));
	});
	el.querySelectorAll<HTMLElement>('.cp-bucket').forEach((bucket) => {
		const drop = $(bucket, '.cp-bucket-items')!;
		const target = $<HTMLButtonElement>(bucket, '.cp-bucket-target')!;
		target.addEventListener('click', () => {
			if (!selected) {
				announce(el, 'note', 'Select an item first, then a bucket.');
				return;
			}
			drop.appendChild(selected);
			select(null);
		});
	});
	const backTarget = $<HTMLButtonElement>(el, '.cp-pool-target');
	backTarget?.addEventListener('click', () => {
		if (selected) {
			pool.appendChild(selected);
			select(null);
		}
	});
	return () => {
		const left = pool.querySelectorAll('.cp-chip').length;
		if (left) {
			announce(el, 'note', `${left} item${left === 1 ? '' : 's'} still to place.`);
			return null;
		}
		let ok = true;
		el.querySelectorAll<HTMLElement>('.cp-bucket').forEach((bucket) => {
			bucket.querySelectorAll<HTMLElement>('.cp-chip').forEach((chip) => {
				if (chip.dataset.bucket !== bucket.dataset.bucket) ok = false;
			});
		});
		announce(el, ok ? 'ok' : 'nope', ok ? 'All placed correctly.' : 'Some items are in the wrong bucket.');
		return ok;
	};
}

/** Repair: edit, reveal the model answer, then self-grade. Only pass counts. */
function bindRepair(el: HTMLElement): Grader {
	const reveal = $<HTMLButtonElement>(el, '.cp-reveal-btn')!;
	const model = $(el, '.cp-model')!;
	const grade = $(el, '.cp-selfgrade')!;
	reveal.addEventListener('click', () => {
		model.hidden = false;
		grade.hidden = false;
		reveal.disabled = true;
	});
	return () => {
		const picked = $<HTMLInputElement>(el, 'input[name$="-selfgrade"]:checked');
		if (model.hidden) {
			announce(el, 'note', 'Write your fix, then reveal the model answer and compare.');
			return null;
		}
		if (!picked) {
			announce(el, 'note', 'Compare with the model answer and grade yourself.');
			return null;
		}
		if (picked.value === 'retry') {
			announce(el, 'note', 'Edit your version and grade again.');
			return null;
		}
		const ok = picked.value === 'pass';
		announce(el, ok ? 'ok' : 'nope', ok ? 'Recorded as a pass.' : 'Recorded as partial. Only a pass counts; improve it and grade again.');
		return ok;
	};
}

const binders: Record<string, (el: HTMLElement) => Grader> = {
	choice: bindChoice,
	scenario: bindChoice,
	predict: bindPredict,
	order: bindOrder,
	sort: bindSort,
	repair: bindRepair,
};

function drawState(el: HTMLElement) {
	const id = el.dataset.progressId!;
	const c = progress.load().checkpoints[id];
	const s = $(el, '.cp-state');
	if (s) s.textContent = c ? c.state : '';
	el.dataset.state = c?.state ?? 'untouched';
}

function drawStage(el: HTMLElement) {
	const pills = $(el, '.cp-stage');
	if (!pills) return;
	const item = progress.load().reviews[el.dataset.progressId!];
	pills.hidden = false;
	pills.querySelectorAll<HTMLElement>('span').forEach((p, i) => {
		const stage = item?.stage === 'done' ? 5 : Number(item?.stage ?? 0);
		p.dataset.on = String(i < stage);
	});
	const label = $(pills, '.cp-stage-label');
	if (label) label.textContent = item?.stage === 'done' ? 'retired' : `stage ${item?.stage ?? '-'} of 5`;
}

export function bindCheckpoint(el: HTMLElement, opts: BindOptions = {}): void {
	if (el.dataset.bound) return;
	el.dataset.bound = 'true';
	const kind = el.dataset.kind ?? '';
	const binder = binders[kind];
	if (!binder) return;
	const grade = binder(el);
	const id = el.dataset.progressId!;

	const giveUp = $<HTMLButtonElement>(el, '.cp-giveup');
	if (giveUp) giveUp.disabled = true;

	/**
	 * Review mode records one result per item (spec S05 "The review page"): a
	 * pass on Check, or a fail on Give Up. A wrong Check does not record; it
	 * enables Give Up and the learner may try again. After the one result,
	 * Give Up is disabled so an answer can never record two fails.
	 */
	let reviewRecorded = false;
	function recordReviewOnce(passed: boolean) {
		if (reviewRecorded) return;
		reviewRecorded = true;
		progress.recordReview(id, passed);
		if (giveUp) giveUp.disabled = true;
		drawStage(el);
		const after = $(el, '.cp-after');
		if (after) after.hidden = false;
		drawState(el);
		opts.onResult?.(el, passed);
	}

	$(el, '.cp-check')?.addEventListener('click', () => {
		const result = grade();
		if (result === null) return;
		if (opts.review) {
			if (result) {
				recordReviewOnce(true);
			} else if (giveUp && !reviewRecorded) {
				giveUp.disabled = false;
			}
			return;
		}
		progress.recordCheckpoint(id, result);
		drawState(el);
		opts.onResult?.(el, result);
	});

	$(el, '.cp-hint-btn')?.addEventListener('click', () => {
		const h = $(el, '.cp-hint');
		if (h) h.hidden = !h.hidden;
	});

	$(el, '.cp-skip')?.addEventListener('click', () => {
		progress.skipCheckpoint(id);
		announce(el, 'note', 'Skipped. It stays available, and comes back in review.');
		drawState(el);
		opts.onResult?.(el, false);
	});

	// Review-only: Give Up shows the answer and records the fail (once).
	giveUp?.addEventListener('click', () => {
		if (giveUp.disabled || reviewRecorded) return;
		revealAnswer(el);
		recordReviewOnce(false);
	});
	$(el, '.cp-sooner')?.addEventListener('click', () => {
		progress.adjustReviewStage(id, -1);
		drawStage(el);
	});
	$(el, '.cp-later')?.addEventListener('click', () => {
		progress.adjustReviewStage(id, +1);
		drawStage(el);
	});

	drawState(el);
	if (opts.review) drawStage(el);
}

/** Give Up: show the answer and its rationale. Exists only in reviews (spec S05). */
function revealAnswer(el: HTMLElement) {
	const kind = el.dataset.kind;
	if (kind === 'choice' || kind === 'scenario') {
		const right = $<HTMLElement>(el, 'label[data-correct=true]');
		right?.classList.add('cp-answer');
		announce(el, 'note', `The answer is marked. ${right?.dataset.consequence ?? ''}`.trim());
	} else if (kind === 'predict') {
		const reveal = $(el, '.cp-reveal');
		if (reveal) reveal.hidden = false;
		announce(el, 'note', 'The output is shown below.');
	} else if (kind === 'order') {
		const list = $<HTMLOListElement>(el, 'ol.cp-order')!;
		[...list.children]
			.sort((a, b) => Number((a as HTMLElement).dataset.pos) - Number((b as HTMLElement).dataset.pos))
			.forEach((li) => list.appendChild(li));
		announce(el, 'note', 'The steps are now in the right order.');
	} else if (kind === 'sort') {
		el.querySelectorAll<HTMLElement>('.cp-chip').forEach((chip) => {
			const bucket = el.querySelector<HTMLElement>(`.cp-bucket[data-bucket="${chip.dataset.bucket}"] .cp-bucket-items`);
			bucket?.appendChild(chip);
		});
		announce(el, 'note', 'Every item is now in its bucket.');
	}
}

export function bindAll(root: ParentNode, opts: BindOptions = {}): HTMLElement[] {
	const els = [...root.querySelectorAll<HTMLElement>('[data-checkpoint]')];
	els.forEach((el) => bindCheckpoint(el, opts));
	return els;
}
