import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
	checkRunNames,
	nameTakenBy,
	newestRun,
	nextRunName,
	parseArgs,
	runNameSequence,
	runOf,
	withIssue,
} from '../../scripts/lib/run-names.mjs';

const NAMES_TEXT = readFileSync(new URL('../../../.claude/skills/wave/run-names.yaml', import.meta.url), 'utf8');
const SEQUENCE = runNameSequence(NAMES_TEXT);

function run(number: number, name: string, open: boolean, createdAt: string) {
	return { number, name, kind: 'lessons', open, createdAt };
}

describe('the run-names file', () => {
	it('holds two lists of 26 names, one per letter in order, and no name twice', () => {
		expect(checkRunNames(parse(NAMES_TEXT))).toEqual([]);
		expect(SEQUENCE).toHaveLength(52);
		expect(SEQUENCE.slice(0, 3)).toEqual(['Axolotl', 'Badger', 'Capybara']);
		expect(new Set(SEQUENCE).size).toBe(52);
	});
});

describe('checkRunNames', () => {
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	const good = { first: letters.map((l) => `${l}one`), second: letters.map((l) => `${l}two`) };

	it('accepts one name per letter in both lists', () => {
		expect(checkRunNames(good)).toEqual([]);
	});

	it('rejects a missing list, a short list, a wrong letter, a repeat and an unknown key', () => {
		expect(checkRunNames(null)).toEqual(['run-names: the file must hold the lists first and second']);
		expect(checkRunNames({ first: good.first })).toContain('run-names: second must be a list');
		expect(checkRunNames({ ...good, second: good.second.slice(1) }).join('\n')).toMatch(/second has 25 names/);
		const swapped = [...good.first];
		swapped[1] = 'Cone';
		expect(checkRunNames({ ...good, first: swapped })).toContain('run-names: first[1] Cone does not start with B');
		const repeated = [...good.second];
		repeated[0] = 'Aone';
		expect(checkRunNames({ ...good, second: repeated })).toContain('run-names: Aone is in the lists twice');
		expect(checkRunNames({ ...good, third: [] })).toContain('run-names: unknown key third');
		const spaced = [...good.first];
		spaced[0] = 'A one';
		expect(checkRunNames({ ...good, first: spaced }).join('\n')).toMatch(/is not one capitalized word/);
	});

	it('makes runNameSequence throw on a wrong file', () => {
		expect(() => runNameSequence('first: []\nsecond: []\n')).toThrow(/first has 0 names/);
	});
});

describe('runOf', () => {
	it('reads the name and kind from a run title', () => {
		expect(
			runOf({ number: 360, title: 'Run: Capybara (lessons)', state: 'OPEN', createdAt: '2026-09-25T08:00:00Z' }),
		).toEqual({ number: 360, name: 'Capybara', kind: 'lessons', open: true, createdAt: '2026-09-25T08:00:00Z' });
	});

	it('ignores an issue whose title is not a run title', () => {
		expect(runOf({ number: 361, title: 'Run Capybara', state: 'OPEN', createdAt: '' })).toBeNull();
		expect(runOf({ number: 362, title: 'Run: capybara (lessons)', state: 'OPEN', createdAt: '' })).toBeNull();
	});
});

describe('nextRunName', () => {
	it('starts at the first name when there is no run yet', () => {
		expect(nextRunName(SEQUENCE, [])).toBe('Axolotl');
	});

	it('takes the letter after the newest run, open or closed', () => {
		const runs = [run(1, 'Axolotl', false, '2026-09-25T08:00:00Z'), run(2, 'Badger', false, '2026-09-25T09:00:00Z')];
		expect(nextRunName(SEQUENCE, runs)).toBe('Capybara');
	});

	it('goes by when the run started, not by the letter', () => {
		const runs = [run(5, 'Zebu', false, '2026-09-20T08:00:00Z'), run(9, 'Badger', true, '2026-09-25T08:00:00Z')];
		expect(nextRunName(SEQUENCE, runs)).toBe('Capybara');
	});

	it('wraps from Z in the first list to A in the second, and from the second back to the first', () => {
		expect(nextRunName(SEQUENCE, [run(1, 'Zebra', false, '2026-09-25T08:00:00Z')])).toBe('Alpaca');
		expect(nextRunName(SEQUENCE, [run(1, 'Zebu', false, '2026-09-25T08:00:00Z')])).toBe('Axolotl');
	});

	it('skips a name an open run still holds, and reuses one a closed run held', () => {
		const runs = [
			run(1, 'Capybara', true, '2026-09-01T08:00:00Z'),
			run(2, 'Dingo', false, '2026-09-02T08:00:00Z'),
			run(3, 'Badger', false, '2026-09-25T08:00:00Z'),
		];
		expect(nextRunName(SEQUENCE, runs)).toBe('Dingo');
	});

	it('starts at the first name when the newest name is not in the lists', () => {
		expect(nextRunName(SEQUENCE, [run(1, 'Unicorn', false, '2026-09-25T08:00:00Z')])).toBe('Axolotl');
	});

	it('throws when every name is held', () => {
		const runs = SEQUENCE.map((name, i) => run(i + 1, name, true, `2026-09-25T08:00:${String(i).padStart(2, '0')}Z`));
		expect(() => nextRunName(SEQUENCE, runs)).toThrow(/all 52 names are held/);
	});
});

describe('newestRun', () => {
	it('breaks a tie in the start time by the higher issue number', () => {
		const at = '2026-09-25T08:00:00Z';
		expect(newestRun([run(4, 'Emu', true, at), run(7, 'Ferret', true, at)])?.name).toBe('Ferret');
		expect(newestRun([])).toBeNull();
	});
});

describe('nameTakenBy', () => {
	it('names the older open run with the same name, so this one takes the next letter', () => {
		const runs = [run(10, 'Capybara', true, '2026-09-25T08:00:00Z'), run(11, 'Capybara', true, '2026-09-25T08:00:05Z')];
		expect(nameTakenBy(runs, 11)?.number).toBe(10);
		expect(nameTakenBy(runs, 10)).toBeNull();
	});

	it('ignores a closed run with the same name and a run with another name', () => {
		const runs = [
			run(10, 'Capybara', false, '2026-09-20T08:00:00Z'),
			run(11, 'Badger', true, '2026-09-24T08:00:00Z'),
			run(12, 'Capybara', true, '2026-09-25T08:00:00Z'),
		];
		expect(nameTakenBy(runs, 12)).toBeNull();
	});

	it('breaks a tie in the start time by the lower issue number', () => {
		const at = '2026-09-25T08:00:00Z';
		expect(nameTakenBy([run(10, 'Dingo', true, at), run(11, 'Dingo', true, at)], 11)?.number).toBe(10);
	});

	it('throws for an issue that is not a run', () => {
		expect(() => nameTakenBy([], 12)).toThrow(/#12 is not a run issue/);
	});
});

describe('parseArgs', () => {
	it('takes no arguments or --check with an issue number', () => {
		expect(parseArgs([])).toEqual({ check: null });
		expect(parseArgs(['--check', '#360'])).toEqual({ check: 360 });
	});

	it('rejects anything else', () => {
		expect(parseArgs(['--check'])).toEqual({ error: 'run-name: --check needs an issue number, got undefined' });
		expect(parseArgs(['--check', 'x'])).toHaveProperty('error');
		expect(parseArgs(['--resume', 'Capybara'])).toHaveProperty('error');
		expect(parseArgs(['--check', '1', '2'])).toHaveProperty('error');
	});
});

describe('withIssue', () => {
	const listed = {
		number: 10,
		title: 'Run: Axolotl (lessons)',
		state: 'OPEN' as const,
		createdAt: '2026-09-25T08:00:00Z',
	};
	const fresh = {
		number: 11,
		title: 'Run: Badger (lessons)',
		state: 'OPEN' as const,
		createdAt: '2026-09-25T08:00:05Z',
	};

	it('adds an issue the label listing has not shown yet', () => {
		expect(withIssue([listed], fresh)).toEqual([listed, fresh]);
	});

	it('keeps the list as it is when the issue is in it', () => {
		expect(withIssue([listed, fresh], fresh)).toEqual([listed, fresh]);
	});
});
