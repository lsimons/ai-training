/**
 * The skills check a comfort-level-`more` learner is offered at the start of
 * a lesson (spec S04 "Skills check"): which checkpoints it asks and which of
 * them are still open. Pure functions, used at build time by the lesson frame
 * and in the browser by the lesson script.
 */

export interface SkillsCheckCandidate {
	id: string;
	objective: string;
	reviewable: boolean;
}

/**
 * One checkpoint per served objective, in `serves` order: the lesson's first
 * reviewable checkpoint for that objective, else its first checkpoint of any
 * kind. An objective without a checkpoint contributes nothing.
 */
export function chooseSkillsCheck(serves: readonly string[], checkpoints: readonly SkillsCheckCandidate[]): string[] {
	const out: string[] = [];
	for (const objective of serves) {
		const own = checkpoints.filter((c) => c.objective === objective);
		const pick = own.find((c) => c.reviewable) ?? own[0];
		if (pick && !out.includes(pick.id)) out.push(pick.id);
	}
	return out;
}

/** The chosen checkpoints not yet `passed`; an empty result means the check is not offered. */
export function openSkillsCheck<T extends { progressId: string }>(
	chosen: readonly T[],
	checkpoints: Readonly<Record<string, { state: string }>>,
): T[] {
	return chosen.filter((c) => checkpoints[c.progressId]?.state !== 'passed');
}
