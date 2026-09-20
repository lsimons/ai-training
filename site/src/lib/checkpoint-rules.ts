/**
 * Which checkpoints become review items (spec S05 "What is reviewed"). The
 * one source of truth for both the rendered `data-reviewable` attribute
 * (CheckpointShell) and the build-time catalog (`checkpointsOf`).
 */

/**
 * Component name (the MDX tag) to checkpoint kind (the `data-kind` value).
 * `CheckpointKind` is derived from it, so a new kind must enter here first
 * and the lesson catalog's tag scanner picks it up at the same time.
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

/** Default `revision` for a checkpoint that does not declare one. */
export const DEFAULT_REVISION = 1;

export interface ReviewRuleInput {
	kind: CheckpointKind;
	/** The author's `review` prop; `false` opts a checkpoint out of review. Default true. */
	review?: boolean;
	/** A `predict` without an `answer`: the learner runs it and self-grades. Not gradable in review. */
	honor?: boolean;
}

/**
 * `repair` is never reviewed (self-graded, too long). An honor-system
 * `predict` has no answer to check or reveal, so it is not reviewed either.
 * Everything else is, unless the author says `review={false}`.
 */
export function isReviewable({ kind, review = true, honor = false }: ReviewRuleInput): boolean {
	if (review === false) return false;
	if (kind === 'repair') return false;
	if (kind === 'predict' && honor) return false;
	return true;
}
