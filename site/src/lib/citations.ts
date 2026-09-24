/**
 * `(@key)` citations in text the data tree holds (competency behaviors, spec
 * S10), rendered the way remark-citations.mjs renders them in a lesson page:
 * a numbered `[N]` link by first appearance, and a References list at the
 * end of the page. The text between citations is the inline Markdown
 * `renderInline` knows (code spans, strong, emphasis, links). An unknown key
 * throws, so the build fails the same way it does for a lesson page.
 */
import { createNumbering, referenceParts, splitCitations } from '../../plugins/citation-syntax.mjs';
import { escapeHtml, renderInline } from './reference';

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
	/** `text` as HTML: inline Markdown via `renderInline`, each citation as a numbered link. */
	render(text: string): string;
	/** The cited entries, numbered by first appearance, for the References list. */
	references(): Reference[];
}

/** A code span, so a `(@key)` inside one stays literal text. */
const CODE_SPAN = /`[^`]+`/g;

type Part = ReturnType<typeof splitCitations>[number];

/**
 * `text` as text runs and citation tokens. A code span is its own text run,
 * so a token inside one is not a citation and `renderInline` shows it as code.
 */
function splitOutsideCode(text: string): Part[] {
	const out: Part[] = [];
	let last = 0;
	for (const m of text.matchAll(CODE_SPAN)) {
		out.push(...splitCitations(text.slice(last, m.index)));
		out.push({ type: 'text', value: m[0] });
		last = m.index + m[0].length;
	}
	out.push(...splitCitations(text.slice(last)));
	return out;
}

/**
 * One reference entry as HTML, in the entry format `referenceParts` gives,
 * so `References.astro` and a lesson page's References list read the same.
 */
export function referenceHtml(key: string, entry: BibliographyEntry): string {
	return referenceParts(key, entry)
		.map((part) => {
			if (part.type === 'code') return `<code>${escapeHtml(part.value)}</code>`;
			if (part.type === 'text') return escapeHtml(part.value);
			const title = `<em>${escapeHtml(part.value)}</em>`;
			return part.url ? `<a href="${escapeHtml(part.url)}">${title}</a>` : title;
		})
		.join('');
}

export function createCitations(bibliography: Record<string, BibliographyEntry>, where: string): Citations {
	const { numberOf, order } = createNumbering(bibliography, where);
	return {
		render(text) {
			// Each run renders on its own, so a strong or link span cannot cross a citation or a code span.
			return splitOutsideCode(text)
				.map((part) => {
					if (part.type === 'text') return renderInline(part.value);
					const n = numberOf(part.key);
					const key = escapeHtml(part.key);
					return `<a class="citation" data-key="${key}" href="#ref-${n}" title="${key}">[${n}]</a>`;
				})
				.join('');
		},
		references() {
			return order.map((key, i) => ({ n: i + 1, key, entry: bibliography[key] as BibliographyEntry }));
		},
	};
}

export interface Behavior {
	claim: string;
	why: string;
	example: string;
}
export interface Objective {
	id: string;
	statement: string;
	level: string;
	behaviors: Behavior[];
}

/** The objectives with every behavior cell rendered through `citations`, in page order, so numbering follows the page. */
export function renderObjectives(objectives: Objective[], citations: Citations): Objective[] {
	return objectives.map((o) => ({
		...o,
		behaviors: o.behaviors.map((b) => ({
			claim: citations.render(b.claim),
			why: citations.render(b.why),
			example: citations.render(b.example),
		})),
	}));
}

export interface Heading {
	depth: number;
	slug: string;
	text: string;
}

/**
 * The competency page outline, in the order the page renders its sections:
 * objectives, then alignment when there are rows, then references when a
 * rendered behavior cited (a token inside a code span does not count).
 */
export function competencyHeadings(alignmentRows: number, references: number): Heading[] {
	return [
		{ depth: 2, slug: 'objectives', text: 'Learning objectives' },
		...(alignmentRows > 0 ? [{ depth: 2, slug: 'alignment', text: 'Alignment' }] : []),
		...(references > 0 ? [{ depth: 2, slug: 'references', text: 'References' }] : []),
	];
}
