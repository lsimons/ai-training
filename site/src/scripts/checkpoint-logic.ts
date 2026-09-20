import type { ReviewTrace } from './progress-model';
/**
 * The parts of checkpoint grading that need no DOM: answer comparison, the
 * shuffle rules, and the feedback texts. `checkpoints.ts` binds these to the
 * rendered markup.
 */

/** A feedback line and how it is styled. */
export interface Feedback {
	kind: 'ok' | 'nope' | 'note';
	text: string;
}

/** `predict` compares answers with whitespace collapsed and case folded. */
export function normalizeAnswer(s: string): string {
	return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function answersMatch(given: string, expected: string): boolean {
	return normalizeAnswer(given) === normalizeAnswer(expected);
}

/** Fisher-Yates over a copy. `random` is injectable so a test can fix the order. */
export function shuffle<T>(arr: readonly T[], random: () => number = Math.random): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const ai = a[i] as T;
		a[i] = a[j] as T;
		a[j] = ai;
	}
	return a;
}

/** Whether `positions` reads 1, 2, 3, ... in order. */
export function isSequential(positions: readonly number[]): boolean {
	return positions.every((p, i) => p === i + 1);
}

/**
 * An `order` checkpoint never opens in the solved order: when the shuffle
 * lands on it, the first item moves to the end. Returns a copy.
 */
export function rotateIfSolved<T>(items: readonly T[], positionOf: (item: T) => number): T[] {
	const out = [...items];
	if (out.length > 1 && isSequential(out.map(positionOf))) {
		const first = out.shift() as T;
		out.push(first);
	}
	return out;
}

/** The `choice` and `scenario` verdict (spec S01 `choice`: a wrong pick shows its own `why`). */
export function choiceFeedback(ok: boolean, why: string | undefined, consequence: string | undefined): Feedback {
	if (ok) return { kind: 'ok', text: consequence ? `Correct. ${consequence}` : 'Correct.' };
	return { kind: 'nope', text: consequence ?? why ?? 'Not quite. Try again.' };
}

export function predictFeedback(ok: boolean): Feedback {
	return ok
		? { kind: 'ok', text: 'Correct. That is exactly the output.' }
		: { kind: 'nope', text: 'Not quite. Trace it once more.' };
}

/** The honor-system `predict` and `repair` self-grade; only `pass` counts (spec S01 `self-grade`). */
export function selfGradeFeedback(ok: boolean, kind: 'predict' | 'repair'): Feedback {
	if (ok) return { kind: 'ok', text: 'Recorded as a pass.' };
	return kind === 'predict'
		? { kind: 'nope', text: 'Recorded. Adjust your prediction and try once more when you are ready.' }
		: { kind: 'nope', text: 'Recorded as partial. Only a pass counts; improve it and grade again.' };
}

export function orderFeedback(ok: boolean): Feedback {
	return ok ? { kind: 'ok', text: 'Correct order.' } : { kind: 'nope', text: 'Not the right order yet.' };
}

/** `sort`: items still in the pool block grading; otherwise every chip must sit in its own bucket. */
export function sortFeedback(unplaced: number, allCorrect: boolean): Feedback {
	if (unplaced > 0) return { kind: 'note', text: `${unplaced} item${unplaced === 1 ? '' : 's'} still to place.` };
	return allCorrect
		? { kind: 'ok', text: 'All placed correctly.' }
		: { kind: 'nope', text: 'Some items are in the wrong bucket.' };
}

/**
 * `multi-choice` (spec S01): exactly `wanted` correct boxes and nothing else.
 * `picked` is the number of boxes ticked, `wrong` how many of those are wrong,
 * and `firstWrongWhy` the `why` of the first wrong pick. A wrong pick shows
 * its why; a missed item is only counted, never named. `null` means nothing
 * to grade yet.
 */
export function multiChoiceVerdict(
	wanted: number,
	picked: number,
	wrong: number,
	firstWrongWhy: string | undefined,
): { ok: boolean | null; feedback: Feedback } {
	if (picked === 0) return { ok: null, feedback: { kind: 'note', text: `Pick ${wanted} answers first.` } };
	if (wrong > 0)
		return { ok: false, feedback: { kind: 'nope', text: firstWrongWhy ?? 'One of your picks is not right.' } };
	const right = picked - wrong;
	if (right < wanted) {
		return {
			ok: false,
			feedback: {
				kind: 'nope',
				text: `${right} of ${wanted} so far, and nothing wrong. ${wanted - right} more to find.`,
			},
		};
	}
	return { ok: true, feedback: { kind: 'ok', text: 'Correct.' } };
}

const rows = (n: number) => `${n} row${n === 1 ? '' : 's'}`;

/** `match` (spec S01): every row filled, then every row right. The rationale shows only on a full pass. */
export function matchVerdict(
	empty: number,
	wrong: number,
	rationale: string,
): { ok: boolean | null; feedback: Feedback } {
	if (empty > 0) return { ok: null, feedback: { kind: 'note', text: `${rows(empty)} still to fill.` } };
	if (wrong > 0) return { ok: false, feedback: { kind: 'nope', text: `${rows(wrong)} wrong. Each row says which.` } };
	return { ok: true, feedback: { kind: 'ok', text: `Correct. ${rationale}`.trim() } };
}

const questions = (n: number) => `${n} question${n === 1 ? '' : 's'}`;

/** The skills check card's texts (spec S04 "Skills check"): the offer, and the note after each answer. */
export function skillsCheckOffer(open: number): string {
	return `Answer ${questions(open)}`;
}

export function skillsCheckNote(answered: number, passed: number, total: number): string {
	if (answered < total) return `Passed ${passed} of ${answered} so far.`;
	const tail =
		passed === total ? 'Every objective is covered. Go on to the recap.' : 'The ones you missed are taught below.';
	return `Passed ${passed} of ${total}. ${tail}`;
}

/** How many of the stage pills light up, and the label under them, for a review item. */
export function stageDisplay(stage: number | 'done' | undefined): { lit: number; label: string } {
	if (stage === 'done') return { lit: 5, label: 'retired' };
	return { lit: stage ?? 0, label: `stage ${stage ?? '-'} of 5` };
}

/** The settings page's one-line summary of a review item's answers, from its `history` (spec S05 "Storage"). */
export function historyDisplay(history: readonly ReviewTrace[]): string {
	const last = history[history.length - 1];
	if (!last) return 'not answered yet';
	return `${history.length} answered, last ${last.result} on ${last.at}`;
}
