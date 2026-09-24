/**
 * Which checkpoints become review items (spec S05 "What is reviewed"). The
 * one source of truth for both the rendered `data-reviewable` attribute
 * (CheckpointShell) and the build-time catalog (`checkpointsOf`).
 */

/**
 * Component name (the MDX tag) to checkpoint kind (the `data-kind` value).
 * `CheckpointKind` is derived from it, so a new kind must enter here first
 * and the lesson catalog's tag reader picks it up at the same time.
 */
export const KIND_OF_TAG = {
	Choice: 'choice',
	MultiChoice: 'multi-choice',
	Match: 'match',
	Scenario: 'scenario',
	Predict: 'predict',
	Order: 'order',
	Sort: 'sort',
	Repair: 'repair',
} as const;

export type CheckpointTag = keyof typeof KIND_OF_TAG;
export type CheckpointKind = (typeof KIND_OF_TAG)[CheckpointTag];

/** The form every checkpoint writes its concepts in; error messages show it. */
export const CONCEPTS_FORM = "concepts={['concept-id', ...]}";

/** Default `revision` for a checkpoint that does not declare one. */
export const DEFAULT_REVISION = 1;

/**
 * Where the learner meets a checkpoint (spec S01 "Checkpoint", S03
 * "Checkpoints"). `first` is the lesson's own checkpoint and counts toward
 * finishing it. `review` is an alternate the review page asks in place of a
 * `first` sibling (same lesson, same objective); the lesson page renders it
 * hidden. `practice` is an alternate in the lesson's "More practice"
 * section: graded and recorded, never needed and never reviewed.
 */
export const PHASES = ['first', 'review', 'practice'] as const;
export type CheckpointPhase = (typeof PHASES)[number];
export const DEFAULT_PHASE: CheckpointPhase = 'first';

export const isPhase = (v: unknown): v is CheckpointPhase => PHASES.includes(v as CheckpointPhase);

/** The component that holds a lesson's `practice` checkpoints (spec S03 "More practice"). */
export const MORE_PRACTICE_TAG = 'MorePractice';
/** How many `practice` checkpoints one `<MorePractice>` block may hold. */
export const MAX_PRACTICE = 3;

export interface ReviewRuleInput {
	kind: CheckpointKind;
	/** The author's `review` prop; `false` opts a checkpoint out of review. Default true. */
	review?: boolean;
	/** A `predict` without an `answer`: the learner runs it and self-grades. Not gradable in review. */
	honor?: boolean;
	/** Default `first`. A `practice` checkpoint is never reviewed. */
	phase?: CheckpointPhase;
}

/**
 * `repair` is never reviewed (self-graded, too long). An honor-system
 * `predict` has no answer to check or reveal, so it is not reviewed either,
 * and neither is a `practice` checkpoint. Everything else is, unless the
 * author says `review={false}`. For a `first` checkpoint the result says
 * whether finishing the lesson schedules it; for a `review` alternate it
 * says whether the review page can ask it, which `mise run checkpoints`
 * requires.
 */
export function isReviewable({ kind, review = true, honor = false, phase = DEFAULT_PHASE }: ReviewRuleInput): boolean {
	if (phase === 'practice') return false;
	if (review === false) return false;
	if (kind === 'repair') return false;
	if (kind === 'predict' && honor) return false;
	return true;
}

/** A checkpoint as far as `reviewAlternatesOf` needs it. */
export interface AlternateCandidate {
	id: string;
	objective: string;
	phase: CheckpointPhase;
	reviewable: boolean;
}

/**
 * The `review` alternates the review page may ask in place of `first`
 * (spec S05 "Which checkpoint a review asks"): the lesson's `review`
 * checkpoints with the same objective that a review can grade, in page
 * order. `checkpoints` is the whole lesson.
 */
export function reviewAlternatesOf(first: AlternateCandidate, checkpoints: readonly AlternateCandidate[]): string[] {
	return checkpoints
		.filter((c) => c.phase === 'review' && c.reviewable && c.objective === first.objective)
		.map((c) => c.id);
}
