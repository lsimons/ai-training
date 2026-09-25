import { finishView, openCount, routeView, skipView } from '@scripts/markdown-content-logic';
import type { CheckpointEntry } from '@scripts/progress-model';
import { describe, expect, it } from 'vitest';

const passed1: CheckpointEntry = { state: 'passed', attempts: 1 };
const passed2: CheckpointEntry = { state: 'passed', attempts: 2 };
const skipped: CheckpointEntry = { state: 'skipped', attempts: 1 };
const attempted: CheckpointEntry = { state: 'attempted', attempts: 1 };

describe('routeView', () => {
	it('hides both cards before any answer at the default comfort', () => {
		expect(routeView([undefined, undefined], undefined)).toEqual({ behindHidden: true, aheadHidden: true });
	});
	it('shows the behind card on a failed or skipped checkpoint', () => {
		expect(routeView([attempted], undefined).behindHidden).toBe(false);
		expect(routeView([skipped, passed1], undefined).behindHidden).toBe(false);
	});
	it('shows the ahead card only when every checkpoint passed on the first try', () => {
		expect(routeView([passed1, passed1], undefined)).toEqual({ behindHidden: true, aheadHidden: false });
		expect(routeView([passed1, passed2], undefined).aheadHidden).toBe(true);
		expect(routeView([passed1, undefined], undefined).aheadHidden).toBe(true);
	});
	it('keeps the ahead card hidden on a lesson without checkpoints, unless comfort is more', () => {
		expect(routeView([], undefined).aheadHidden).toBe(true);
		expect(routeView([], 'more').aheadHidden).toBe(false);
	});
	it('shows the behind card for comfort less whatever the answers', () => {
		expect(routeView([passed1], 'less')).toEqual({ behindHidden: false, aheadHidden: false });
	});
});

describe('openCount', () => {
	it('counts the checkpoints neither passed nor skipped', () => {
		expect(openCount([passed2, skipped, attempted, undefined])).toBe(2);
		expect(openCount([])).toBe(0);
	});
});

describe('finishView', () => {
	it('blocks finishing and names the count while checkpoints are open', () => {
		expect(finishView(undefined, 1)).toEqual({
			disabled: true,
			label: 'Mark lesson finished',
			note: 'Pass or skip 1 more checkpoint to finish this lesson.',
		});
		expect(finishView({ state: 'read', at: '2026-09-20' }, 3).note).toBe(
			'Pass or skip 3 more checkpoints to finish this lesson.',
		);
	});
	it('enables finishing when nothing is open', () => {
		expect(finishView({ state: 'read', at: '2026-09-20' }, 0)).toEqual({
			disabled: false,
			label: 'Mark lesson finished',
			note: '',
		});
	});
	it('shows the finish day and no note once finished', () => {
		expect(finishView({ state: 'finished', at: '2026-09-20' }, 2)).toEqual({
			disabled: true,
			label: 'Finished ✓ (2026-09-20)',
			note: '',
		});
	});
});

describe('skipView', () => {
	it('offers the skip until the lesson is skipped or finished', () => {
		expect(skipView(undefined)).toEqual({ disabled: false, label: 'I know this, skip it' });
		expect(skipView({ state: 'read', at: '2026-09-20' }).disabled).toBe(false);
		expect(skipView({ state: 'skipped', at: '2026-09-20' })).toEqual({ disabled: true, label: 'Skipped (2026-09-20)' });
		expect(skipView({ state: 'finished', at: '2026-09-20' })).toEqual({
			disabled: true,
			label: 'I know this, skip it',
		});
	});
});
