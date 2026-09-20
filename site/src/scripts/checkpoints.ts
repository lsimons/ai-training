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
	/**
	 * Lesson mode only: replaces the default `progress.recordCheckpoint` write.
	 * The skills check uses it to record the result and schedule the review in
	 * one update (spec S04 "Skills check").
	 */
	record?: (id: string, passed: boolean) => void;
	onResult?: (el: HTMLElement, passed: boolean) => void;
}

/**
 * A copy of a checkpoint section for the skills check card (spec S04 "Skills
 * check"). Take it before the original is bound, so it carries no listeners,
 * no `data-bound` and no shuffle. The copy drops the section `id`, prefixes
 * every nested `id`, `for`, `aria-describedby` and input `name` with
 * `skills-` (so the document keeps unique ids and the copy's radio groups
 * are its own, while the `[name$="-selfgrade"]` lookups still match), and
 * has no Skip button: the card offers Dismiss instead.
 */
export function copyForSkillsCheck(body: HTMLElement): HTMLElement {
	const copy = document.importNode(body, true);
	copy.removeAttribute('id');
	copy.dataset.skillsItem = body.id;
	for (const attr of ['id', 'for', 'aria-describedby', 'name']) {
		for (const el of copy.querySelectorAll(`[${attr}]`)) el.setAttribute(attr, `skills-${el.getAttribute(attr)}`);
	}
	$(copy, '.cp-skip')?.remove();
	return copy;
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
	return () => {
		const ok = [...list.children].every((li, i) => posOf(li) === i + 1);
		announce(el, orderFeedback(ok));
		return ok;
	};
}

/** Click a chip to select it, then click a bucket to place it. Keyboard: both are buttons. */
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
	for (const chip of el.querySelectorAll<HTMLButtonElement>('.cp-chip')) {
		chip.addEventListener('click', () => select(selected === chip ? null : chip));
	}
	for (const bucket of el.querySelectorAll<HTMLElement>('.cp-bucket')) {
		const drop = $(bucket, '.cp-bucket-items');
		$<HTMLButtonElement>(bucket, '.cp-bucket-target')?.addEventListener('click', () => {
			if (!selected) {
				announce(el, note('Select an item first, then a bucket.'));
				return;
			}
			drop?.appendChild(selected);
			select(null);
		});
	}
	$<HTMLButtonElement>(el, '.cp-pool-target')?.addEventListener('click', () => {
		if (selected) {
			pool.appendChild(selected);
			select(null);
		}
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

/** Redraw the state label and `data-state` from the record. Exported so the skills check can refresh the lesson's copy of a checkpoint it answered. */
export function drawState(el: HTMLElement) {
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
		if (opts.record) opts.record(id, result);
		else progress.recordCheckpoint(id, result);
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
