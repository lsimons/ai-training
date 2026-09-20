/**
 * Which checkpoints become review items (spec S05 "What is reviewed"). The
 * one source of truth for both the rendered `data-reviewable` attribute
 * (CheckpointShell) and the build-time catalog (`checkpointsOf`).
 */
export type CheckpointKind = 'choice' | 'scenario' | 'predict' | 'order' | 'sort' | 'repair';

export const CHECKPOINT_KINDS: CheckpointKind[] = ['choice', 'scenario', 'predict', 'order', 'sort', 'repair'];

/** Default `revision` for a checkpoint that does not declare one. */
export const DEFAULT_REVISION = 1;

export interface ReviewRuleInput {
	kind: CheckpointKind;
	/** The author's `review` prop; `false` opts a checkpoint out of review. Default true. */
	review?: boolean;
	/** A `predict` without an `answer`: the learner runs it and self-grades. Not gradable in review. */
	honour?: boolean;
}

/**
 * `repair` is never reviewed (self-graded, too long). An honour-system
 * `predict` has no answer to check or reveal, so it is not reviewed either.
 * Everything else is, unless the author says `review={false}`.
 */
export function isReviewable({ kind, review = true, honour = false }: ReviewRuleInput): boolean {
	if (review === false) return false;
	if (kind === 'repair') return false;
	if (kind === 'predict' && honour) return false;
	return true;
}
