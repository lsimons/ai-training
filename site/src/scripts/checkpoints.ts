/**
 * Client behavior for checkpoints (spec S01 "Interaction types", S03
 * "Checkpoints") in lessons and on review pages (spec S05).
 *
 * The components render the markup; this module binds it. A checkpoint is a
 * `<section data-checkpoint data-kind=...>` whose progress key is
 * `data-progress-id` (`<lesson id>#<checkpoint id>`). The grading rules and
 * feedback texts are in `checkpoint-logic.ts`.
 */

import type { CheckpointKind } from '@lib/checkpoint-rules';
import {
	answersMatch,
	choiceFeedback,
	dropPlacement,
	type Feedback,
	matchVerdict,
	multiChoiceVerdict,
	orderFeedback,
	predictFeedback,
	rotateIfSolved,
	selfGradeFeedback,
	shuffle,
	sortFeedback,
	stageDisplay,
} from './checkpoint-logic';
import * as progress from './progress';

export interface BindOptions {
	/** Review mode adds Give Up, stage pills and the frequency control, and records to `reviews`. */
	review?: boolean;
	onResult?: (el: HTMLElement, passed: boolean) => void;
}

function $<T extends Element = HTMLElement>(root: ParentNode, sel: string): T | null {
	return root.querySelector<T>(sel);
}

function announce(el: HTMLElement, fb: Feedback) {
	const f = $(el, '.cp-feedback');
	if (!f) return;
	f.textContent = fb.text;
	f.className = `cp-feedback ${fb.kind}`;
}

const note = (text: string): Feedback => ({ kind: 'note', text });

/** Each kind returns a grader: () => passed | null (null = nothing to grade yet). */
type Grader = () => boolean | null;

function bindChoice(el: HTMLElement): Grader {
	return () => {
		const picked = $<HTMLInputElement>(el, 'input[type=radio]:checked');
		const label = picked?.closest('label');
		if (!label) {
			announce(el, note('Pick an answer first.'));
			return null;
		}
		const ok = label.dataset.correct === 'true';
		announce(el, choiceFeedback(ok, label.dataset.why, label.dataset.consequence));
		return ok;
	};
}

function bindPredict(el: HTMLElement): Grader {
	const answer = $(el, '.cp-predict')?.dataset.answer;
	const ta = $<HTMLTextAreaElement>(el, 'textarea');
	if (answer === undefined) {
		// Honor-system variant: the learner ran it and grades themselves.
		return () => {
			const grade = $<HTMLInputElement>(el, 'input[name$="-selfgrade"]:checked');
			if (!grade) {
				announce(el, note('Run it, then say how your prediction held up.'));
				return null;
			}
			const ok = grade.value === 'pass';
			announce(el, selfGradeFeedback(ok, 'predict'));
			return ok;
		};
	}
	return () => {
		if (!ta?.value.trim()) {
			announce(el, note('Type your prediction first.'));
			return null;
		}
		const ok = answersMatch(ta.value, answer);
		announce(el, predictFeedback(ok));
		if (ok) {
			const reveal = $(el, '.cp-reveal');
			if (reveal) reveal.hidden = false;
		}
		return ok;
	};
}

const posOf = (li: Element) => Number((li as HTMLElement).dataset.pos);

/**
 * Native HTML drag wiring shared by `order` and `sort`. The dragged element is
 * kept in a closure, so a same-page move needs no `dataTransfer` payload
 * (Firefox still wants `setData` called before it starts a drag). Every
 * `dragover` inside a target calls `preventDefault()`, which is what allows
 * the drop, and then `onOver`. `.cp-dragging` marks the moving item and
 * `.cp-drop-hover` the target under the pointer. `onCancel` runs on a
 * `dragend` without a drop (Escape, or a release outside every target). Drag
 * events don't fire on most touch browsers, so each kind keeps its click path
 * as the fallback. The `draggable="true"` attribute is the component's
 * (Sort.astro, Order.astro), next to the aria attributes, so the rendered
 * markup says what it does; this module only listens.
 */
interface DragHandlers {
	onStart?: (item: HTMLElement) => void;
	onOver?: (target: HTMLElement, item: HTMLElement, ev: DragEvent) => void;
	onDrop?: (target: HTMLElement, item: HTMLElement) => void;
	onCancel?: (item: HTMLElement) => void;
}
function bindDrag(items: Iterable<HTMLElement>, targets: Iterable<HTMLElement>, handlers: DragHandlers): void {
	let dragged: HTMLElement | null = null;
	const targetList = [...targets];
	const clearHover = () => {
		for (const t of targetList) t.classList.remove('cp-drop-hover');
	};
	for (const item of items) {
		item.addEventListener('dragstart', (ev) => {
			dragged = item;
			item.classList.add('cp-dragging');
			ev.dataTransfer?.setData('text/plain', item.textContent ?? '');
			if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
			handlers.onStart?.(item);
		});
		item.addEventListener('dragend', (ev) => {
			item.classList.remove('cp-dragging');
			clearHover();
			if (ev.dataTransfer?.dropEffect === 'none') handlers.onCancel?.(item);
			dragged = null;
		});
	}
	for (const target of targetList) {
		target.addEventListener('dragover', (ev) => {
			if (!dragged) return;
			ev.preventDefault();
			if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
			clearHover();
			target.classList.add('cp-drop-hover');
			handlers.onOver?.(target, dragged, ev);
		});
		target.addEventListener('dragleave', (ev) => {
			// Moving between a target's children fires leave and over in turn, so only a real exit clears it.
			if (ev.relatedTarget instanceof Node && target.contains(ev.relatedTarget)) return;
			target.classList.remove('cp-drop-hover');
		});
		target.addEventListener('drop', (ev) => {
			if (!dragged) return;
			ev.preventDefault();
			clearHover();
			handlers.onDrop?.(target, dragged);
		});
	}
}

function bindOrder(el: HTMLElement): Grader {
	const list = $<HTMLOListElement>(el, 'ol.cp-order');
	if (!list) return () => null;
	// Never present the already-correct order.
	for (const li of rotateIfSolved(shuffle([...list.children]), posOf)) list.appendChild(li);
	for (const btn of list.querySelectorAll<HTMLButtonElement>('button[data-move]')) {
		btn.addEventListener('click', () => {
			const li = btn.closest('li');
			if (!li) return;
			if (btn.dataset.move === 'up' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
			if (btn.dataset.move === 'down' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
			btn.focus();
		});
	}
	// Drag a row over another and the list reflows as you go. The arrows stay as the keyboard and touch path.
	// The other rows keep their relative order during a drag, so the row that followed the dragged one at the
	// start is enough to put it back when the drag is cancelled.
	const rows = list.querySelectorAll<HTMLElement>('li');
	let followedBy: Node | null = null;
	bindDrag(rows, rows, {
		onStart: (row) => {
			followedBy = row.nextSibling;
		},
		onOver: (over, dragged, ev) => {
			if (over === dragged) return;
			const placement = dropPlacement(ev.clientY, over.getBoundingClientRect());
			list.insertBefore(dragged, placement === 'before' ? over : over.nextSibling);
		},
		onCancel: (row) => list.insertBefore(row, followedBy),
	});
	return () => {
		const ok = [...list.children].every((li, i) => posOf(li) === i + 1);
		announce(el, orderFeedback(ok));
		return ok;
	};
}

/** Drag a chip to a bucket, or click it to select it and then click the bucket. Keyboard: chips and titles are buttons. */
function bindSort(el: HTMLElement): Grader {
	const pool = $(el, '.cp-pool');
	if (!pool) return () => null;
	for (const c of shuffle([...pool.querySelectorAll<HTMLButtonElement>('.cp-chip')])) pool.appendChild(c);
	let selected: HTMLButtonElement | null = null;
	const select = (chip: HTMLButtonElement | null) => {
		for (const c of el.querySelectorAll('.cp-chip')) c.setAttribute('aria-pressed', 'false');
		selected = chip;
		if (chip) chip.setAttribute('aria-pressed', 'true');
	};
	const chips = el.querySelectorAll<HTMLButtonElement>('.cp-chip');
	for (const chip of chips) {
		chip.addEventListener('click', () => select(selected === chip ? null : chip));
	}
	// A drop zone is a whole bucket (title button and the dashed area under it) or the pool wrapper.
	// A chip lands in the zone's items container, which is also what the grader reads.
	const zones = [...el.querySelectorAll<HTMLElement>('.cp-bucket, .cp-pool-wrap')];
	const containerOf = (zone: HTMLElement) => (zone.matches('.cp-bucket') ? $(zone, '.cp-bucket-items') : pool);
	for (const zone of zones) {
		zone.addEventListener('click', (ev) => {
			if (ev.target instanceof Element && ev.target.closest('.cp-chip')) return;
			if (!selected) {
				announce(el, note('Select an item first, then a bucket.'));
				return;
			}
			containerOf(zone)?.appendChild(selected);
			select(null);
		});
	}
	bindDrag(chips, zones, {
		onStart: (chip) => select(chip as HTMLButtonElement),
		onDrop: (zone, chip) => {
			containerOf(zone)?.appendChild(chip);
			select(null);
		},
	});
	return () => {
		const left = pool.querySelectorAll('.cp-chip').length;
		let ok = true;
		for (const bucket of el.querySelectorAll<HTMLElement>('.cp-bucket')) {
			for (const chip of bucket.querySelectorAll<HTMLElement>('.cp-chip')) {
				if (chip.dataset.bucket !== bucket.dataset.bucket) ok = false;
			}
		}
		announce(el, sortFeedback(left, ok));
		return left ? null : ok;
	};
}

/** Repair: edit, reveal the model answer, then self-grade. Only pass counts. */
function bindRepair(el: HTMLElement): Grader {
	const reveal = $<HTMLButtonElement>(el, '.cp-reveal-btn');
	const model = $(el, '.cp-model');
	const grade = $(el, '.cp-selfgrade');
	reveal?.addEventListener('click', () => {
		if (model) model.hidden = false;
		if (grade) grade.hidden = false;
		reveal.disabled = true;
	});
	return () => {
		const picked = $<HTMLInputElement>(el, 'input[name$="-selfgrade"]:checked');
		if (!model || model.hidden) {
			announce(el, note('Write your fix, then reveal the model answer and compare.'));
			return null;
		}
		if (!picked) {
			announce(el, note('Compare with the model answer and grade yourself.'));
			return null;
		}
		if (picked.value === 'retry') {
			announce(el, note('Edit your version and grade again.'));
			return null;
		}
		const ok = picked.value === 'pass';
		announce(el, selfGradeFeedback(ok, 'repair'));
		return ok;
	};
}

/** Exactly the N correct boxes and nothing else. A wrong pick shows its `why`; a missed item is only counted. */
function bindMultiChoice(el: HTMLElement): Grader {
	const wanted = Number($(el, '.cp-multi')?.dataset.count ?? 0);
	return () => {
		const picked = [...el.querySelectorAll<HTMLInputElement>('input[type=checkbox]:checked')]
			.map((i) => i.closest('label'))
			.filter((l): l is HTMLLabelElement => l !== null);
		const wrong = picked.filter((l) => l.dataset.correct !== 'true');
		const verdict = multiChoiceVerdict(wanted, picked.length, wrong.length, wrong[0]?.dataset.why);
		announce(el, verdict.feedback);
		return verdict.ok;
	};
}

/** One `<select>` per row. Each row gets its own mark; the rationale shows only when every row is right. */
function bindMatch(el: HTMLElement): Grader {
	const matchRows = [...el.querySelectorAll<HTMLElement>('.cp-match-row')];
	const rationale = $(el, '.cp-match')?.dataset.rationale ?? '';
	return () => {
		const empty = matchRows.filter((r) => !$<HTMLSelectElement>(r, 'select')?.value).length;
		let wrong = 0;
		if (empty === 0) {
			for (const r of matchRows) {
				const ok = $<HTMLSelectElement>(r, 'select')?.value === r.dataset.option;
				r.dataset.state = ok ? 'right' : 'wrong';
				const fb = $(r, '.cp-row-feedback');
				if (fb) fb.textContent = ok ? 'Right.' : (r.dataset.why ?? 'Not this one.');
				if (!ok) wrong++;
			}
		}
		const verdict = matchVerdict(empty, wrong, rationale);
		announce(el, verdict.feedback);
		return verdict.ok;
	};
}

const binders: Record<CheckpointKind, (el: HTMLElement) => Grader> = {
	choice: bindChoice,
	'multi-choice': bindMultiChoice,
	match: bindMatch,
	scenario: bindChoice,
	predict: bindPredict,
	order: bindOrder,
	sort: bindSort,
	repair: bindRepair,
};

function drawState(el: HTMLElement) {
	const id = el.dataset.progressId ?? '';
	const c = progress.load().checkpoints[id];
	const s = $(el, '.cp-state');
	if (s) s.textContent = c ? c.state : '';
	el.dataset.state = c?.state ?? 'untouched';
}

function drawStage(el: HTMLElement) {
	const pills = $(el, '.cp-stage');
	if (!pills) return;
	const item = progress.load().reviews[el.dataset.progressId ?? ''];
	const { lit, label } = stageDisplay(item?.stage);
	pills.hidden = false;
	pills.querySelectorAll<HTMLElement>('span').forEach((p, i) => {
		p.dataset.on = String(i < lit);
	});
	const labelEl = $(pills, '.cp-stage-label');
	if (labelEl) labelEl.textContent = label;
}

export function bindCheckpoint(el: HTMLElement, opts: BindOptions = {}): void {
	if (el.dataset.bound) return;
	el.dataset.bound = 'true';
	// `data-kind` is rendered from a `CheckpointKind`, so the cast only narrows the DOM string.
	const binder: ((el: HTMLElement) => Grader) | undefined = binders[el.dataset.kind as CheckpointKind];
	if (!binder) return;
	const grade = binder(el);
	const id = el.dataset.progressId ?? '';

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
		announce(el, note('Skipped. It stays available, and comes back in review.'));
		drawState(el);
		opts.onResult?.(el, false);
	});

	// Review-only: Give Up shows the answer and records the fail (once).
	giveUp?.addEventListener('click', () => {
		if (giveUp.disabled || reviewRecorded) return;
		revealAnswer(el);
		recordReviewOnce(false);
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
		announce(el, note(`The answer is marked. ${right?.dataset.consequence ?? ''}`.trim()));
	} else if (kind === 'multi-choice') {
		for (const l of el.querySelectorAll<HTMLElement>('label[data-correct=true]')) l.classList.add('cp-answer');
		announce(el, note('The correct items are marked.'));
	} else if (kind === 'match') {
		for (const r of el.querySelectorAll<HTMLElement>('.cp-match-row')) {
			const select = $<HTMLSelectElement>(r, 'select');
			if (select) select.value = r.dataset.option ?? '';
			// Neutral, so a reveal after Give Up never looks like a pass.
			r.dataset.state = 'revealed';
			const fb = $(r, '.cp-row-feedback');
			if (fb) fb.textContent = '';
		}
		announce(el, note(`Each row now shows its answer. ${$(el, '.cp-match')?.dataset.rationale ?? ''}`.trim()));
	} else if (kind === 'predict') {
		const reveal = $(el, '.cp-reveal');
		if (reveal) reveal.hidden = false;
		announce(el, note('The output is shown below.'));
	} else if (kind === 'order') {
		const list = $<HTMLOListElement>(el, 'ol.cp-order');
		if (!list) return;
		for (const li of [...list.children].sort((a, b) => posOf(a) - posOf(b))) list.appendChild(li);
		announce(el, note('The steps are now in the right order.'));
	} else if (kind === 'sort') {
		for (const chip of el.querySelectorAll<HTMLElement>('.cp-chip')) {
			const bucket = el.querySelector<HTMLElement>(`.cp-bucket[data-bucket="${chip.dataset.bucket}"] .cp-bucket-items`);
			bucket?.appendChild(chip);
		}
		announce(el, note('Every item is now in its bucket.'));
	}
}

export function bindAll(root: ParentNode, opts: BindOptions = {}): HTMLElement[] {
	const els = [...root.querySelectorAll<HTMLElement>('[data-checkpoint]')];
	for (const el of els) bindCheckpoint(el, opts);
	return els;
}
