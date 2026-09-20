import { chooseSkillsCheck, openSkillsCheck } from '@lib/skills-check';
import { describe, expect, it } from 'vitest';

const cps = [
	{ id: 'a-honor', objective: 'o1', reviewable: false },
	{ id: 'a-graded', objective: 'o1', reviewable: true },
	{ id: 'b-only', objective: 'o2', reviewable: false },
	{ id: 'c-first', objective: 'o3', reviewable: true },
	{ id: 'c-second', objective: 'o3', reviewable: true },
];

describe('chooseSkillsCheck', () => {
	it('takes the first reviewable checkpoint per served objective, in serves order', () => {
		expect(chooseSkillsCheck(['o3', 'o1'], cps)).toEqual(['c-first', 'a-graded']);
	});
	it('falls back to the first checkpoint when none for the objective is reviewable', () => {
		expect(chooseSkillsCheck(['o2'], cps)).toEqual(['b-only']);
	});
	it('leaves out an objective without a checkpoint and never repeats an id', () => {
		expect(chooseSkillsCheck(['o9', 'o1', 'o1'], cps)).toEqual(['a-graded']);
		expect(chooseSkillsCheck([], cps)).toEqual([]);
	});
});

describe('openSkillsCheck', () => {
	const chosen = [{ progressId: 'l#a' }, { progressId: 'l#b' }, { progressId: 'l#c' }];
	it('drops the checkpoints already passed', () => {
		const states = { 'l#a': { state: 'passed' }, 'l#b': { state: 'attempted' } };
		expect(openSkillsCheck(chosen, states)).toEqual([{ progressId: 'l#b' }, { progressId: 'l#c' }]);
	});
	it('is empty when every chosen checkpoint is passed', () => {
		const states = { 'l#a': { state: 'passed' }, 'l#b': { state: 'passed' }, 'l#c': { state: 'passed' } };
		expect(openSkillsCheck(chosen, states)).toEqual([]);
	});
});
