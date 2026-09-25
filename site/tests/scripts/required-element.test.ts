// @vitest-environment happy-dom
import { requiredData, requiredElement } from '@scripts/required-element';
import { describe, expect, it } from 'vitest';

describe('requiredElement', () => {
	it('returns the element the selector finds', () => {
		const root = document.createElement('div');
		root.innerHTML = '<p data-x>here</p>';
		expect(requiredElement(root, '[data-x]').textContent).toBe('here');
	});
	it('throws with the selector when nothing matches', () => {
		expect(() => requiredElement(document.createElement('div'), '[data-x]')).toThrow('missing [data-x]');
	});
});

describe('requiredData', () => {
	it('returns the data value, empty string included', () => {
		const el = document.createElement('div');
		el.dataset.nodeList = '';
		expect(requiredData(el, 'nodeList')).toBe('');
	});
	it('throws with the attribute name in markup form', () => {
		expect(() => requiredData(document.createElement('div'), 'nodeList')).toThrow('missing data-node-list');
	});
});
