import { buildCheckpointExport } from '@lib/checkpoint-items';
import type { APIRoute } from 'astro';

/**
 * The checkpoint export (spec S03 "Checkpoint export"), one file site-wide,
 * built from the content collections at build time and served under the
 * base path as `/ai-training/data/checkpoints.json`. Nothing in the browser
 * reads it; `mise run checkpoints` checks it against the lesson pages after
 * `site-build`, and the tutor skill is its first consumer.
 */
export const GET: APIRoute = async () => {
	const data = await buildCheckpointExport();
	return new Response(`${JSON.stringify(data, null, 2)}\n`, {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
