import {
	attrsOf,
	checkpointTagsOfSource,
	childrenSource,
	isJsxElement,
	jsxElements,
	literalOf,
	parseMdx,
} from '@lib/checkpoint-tags';
import { describe, expect, it } from 'vitest';

/** The ESTree of one JavaScript expression, as the MDX parser attaches it to a `{...}` prop. */
function estree(expr: string) {
	const tree = parseMdx(`<X a={${expr}} />`);
	const [node] = jsxElements(tree);
	const attr = node?.attributes[0];
	if (!attr || typeof attr.value !== 'object' || attr.value === null) throw new Error('no expression');
	return attr.value.data?.estree?.body[0]?.expression;
}

describe('literalOf', () => {
	it('reads strings, numbers, booleans, null, templates, arrays, objects and negative numbers', () => {
		expect(literalOf(estree("'s'"))).toBe('s');
		expect(literalOf(estree('2'))).toBe(2);
		expect(literalOf(estree('-2'))).toBe(-2);
		expect(literalOf(estree('true'))).toBe(true);
		expect(literalOf(estree('null'))).toBe(null);
		expect(literalOf(estree('`a > b`'))).toBe('a > b');
		expect(literalOf(estree("[{ text: 'x', correct: true, 'why': 1 }, ['n']]"))).toEqual([
			{ text: 'x', correct: true, why: 1 },
			['n'],
		]);
	});
	it('rejects anything that is not a literal, naming the construct', () => {
		expect(() => literalOf(estree('name'))).toThrow(/Identifier/);
		expect(() => literalOf(estree('f()'))).toThrow(/CallExpression/);
		expect(() => literalOf(estree('`a ${'.concat('b}`')))).toThrow(/template literal with placeholders/);
		expect(() => literalOf(estree('[1, , 2]'))).toThrow(/hole in an array/);
		expect(() => literalOf(estree('{ ...rest }'))).toThrow(/SpreadElement in an object literal/);
		expect(() => literalOf(estree('{ [k]: 1 }'))).toThrow(/in an object literal/);
		expect(() => literalOf(estree('!true'))).toThrow(/! expression/);
		expect(() => literalOf(null)).toThrow(/hole/);
		expect(() => literalOf(undefined)).toThrow(/an empty expression/);
		expect(() => literalOf(estree('/a/'))).toThrow(/a RegExp literal/);
		expect(() => literalOf(estree('1n'))).toThrow(/a BigInt literal/);
	});
});

describe('attrsOf and childrenSource', () => {
	it('reads string, literal and bare props, and the children as source', () => {
		const src = '<Choice id="a" review={false} honor>\n\nStem *here*.\n\n</Choice>\n';
		const [node] = jsxElements(parseMdx(src));
		if (!node) throw new Error('no element');
		expect(isJsxElement(node)).toBe(true);
		expect([...attrsOf(node, 'x').entries()]).toEqual([
			['id', { value: 'a', expr: false }],
			['review', { value: false, expr: true }],
			['honor', { value: true, expr: false }],
		]);
		expect(childrenSource(node, src)).toBe('Stem *here*.');
	});
	it('rejects a spread prop', () => {
		const [node] = jsxElements(parseMdx('<Choice {...rest} />'));
		if (!node) throw new Error('no element');
		expect(() => attrsOf(node, 'x')).toThrow(/x: <Choice> has a spread prop/);
	});
});

describe('checkpointTagsOfSource', () => {
	it('ignores components that are not checkpoints and reads nested ones', () => {
		const src = '<Aside>\n<Choice id="in" concepts={["c"]} options={[]}>\nS\n</Choice>\n</Aside>\n';
		expect(checkpointTagsOfSource(src, 'x').map((t) => [t.tag, t.stem])).toEqual([['Choice', 'S']]);
	});
	it('names the lesson in a parse error', () => {
		expect(() => checkpointTagsOfSource('<Choice id="a>', 'x/y')).toThrow(/^x\/y: Unexpected end of file/);
	});
	it('leaves a stray expression child in the stem source rather than failing', () => {
		const src = '<Choice id="a">\n{/* note */}\n\nStem.\n</Choice>';
		expect(checkpointTagsOfSource(src, 'x')[0]?.stem).toBe('{/* note */}\n\nStem.');
	});
});
