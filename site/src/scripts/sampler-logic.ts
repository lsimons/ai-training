/**
 * The math behind the sampler widget (`widgets/Sampler.astro`): a softmax
 * with temperature over a tiny fixed set of next-token logits, and the pick
 * of one token from a uniform random number. No DOM access, so it runs
 * under Node in the unit tests.
 */

/** The logits of the next token after "The cat sat on the". Each token starts with its space. */
export const LOGITS: Readonly<Record<string, number>> = {
	' mat': 2.0,
	' sofa': 1.2,
	' roof': 0.6,
	' moon': -0.5,
	' spreadsheet': -1.5,
};

/** The lowest temperature the math uses. The slider's minimum is the same, and a lower value is raised to it. */
export const MIN_TEMPERATURE = 0.05;

/** The token picked when rounding leaves `r` above zero after the last token. */
export const FALLBACK_TOKEN = ' mat';

/** The probability of each token at temperature `t`, in the order of `LOGITS`. The probabilities sum to 1. */
export function probs(t: number, logits: Readonly<Record<string, number>> = LOGITS): [string, number][] {
	const temp = Math.max(t, MIN_TEMPERATURE);
	const ex = Object.entries(logits).map(([k, v]) => [k, Math.exp(v / temp)] as [string, number]);
	const z = ex.reduce((a, [, v]) => a + v, 0);
	return ex.map(([k, v]) => [k, v / z]);
}

/**
 * The token that the uniform random number `r` in [0, 1) selects: walk the
 * tokens in order and take the first one whose cumulative probability
 * reaches `r`.
 */
export function pick(distribution: [string, number][], r: number): string {
	let rest = r;
	for (const [tok, p] of distribution) {
		rest -= p;
		if (rest <= 0) return tok;
	}
	return FALLBACK_TOKEN;
}

/** A probability as the percentage text the bars show, such as `42.5%`. */
export function percent(p: number): string {
	return `${(p * 100).toFixed(1)}%`;
}

/** The sentence the widget prints for a picked token. */
export function sentence(token: string): string {
	return `The cat sat on the${token}.`;
}
