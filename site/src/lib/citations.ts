/**
 * `(@key)` citations in text the data tree holds (competency behaviors, spec
 * S10), rendered the way remark-citations.mjs renders them in a lesson page:
 * a numbered `[N]` link by first appearance, and a References list at the
 * end of the page. Backtick spans render as `<code>`. An unknown key throws,
 * so the build fails the same way it does for a lesson page.
 */
import { splitCitations } from '../../plugins/citation-syntax.mjs';
import { escapeHtml } from './reference';

export interface BibliographyEntry {
	type: string;
	title: string;
	container?: string | null;
	author?: string | null;
	url?: string | null;
}

export interface Reference {
	n: number;
	key: string;
	entry: BibliographyEntry;
}

export interface Citations {
	/** `text` as HTML: escaped, code spans as `<code>`, each citation as a numbered link. */
	render(text: string): string;
	/** The cited entries, numbered by first appearance, for the References list. */
	references(): Reference[];
}

const CODE_SPAN = /`([^`]+)`/g;

export function createCitations(bibliography: Record<string, BibliographyEntry>, where: string): Citations {
	const order: string[] = [];
	const numberOf = (key: string): number => {
		let n = order.indexOf(key);
		if (n === -1) {
			if (!(key in bibliography)) {
				throw new Error(
					`${where}: unknown citation key "${key}". Keys are defined in site/src/data/bibliography.yaml.`,
				);
			}
			order.push(key);
			n = order.length - 1;
		}
		return n + 1;
	};
	const prose = (text: string): string =>
		splitCitations(text)
			.map((part) => {
				if (part.type === 'text') return escapeHtml(part.value);
				const n = numberOf(part.key);
				return `<a class="citation" data-key="${escapeHtml(part.key)}" href="#ref-${n}" title="${escapeHtml(part.key)}">[${n}]</a>`;
			})
			.join('');
	return {
		render(text) {
			const out: string[] = [];
			let last = 0;
			for (const m of text.matchAll(CODE_SPAN)) {
				out.push(prose(text.slice(last, m.index)));
				out.push(`<code>${escapeHtml(m[1] ?? '')}</code>`);
				last = m.index + m[0].length;
			}
			out.push(prose(text.slice(last)));
			return out.join('');
		},
		references() {
			return order.map((key, i) => ({ n: i + 1, key, entry: bibliography[key] as BibliographyEntry }));
		},
	};
}
