/**
 * The DOM-free part of the course page graph (spec S02 "Course page as lesson
 * graph"): node state and ring from the progress record, milestone stops and
 * the edge paths from box positions. `course-graph.ts` draws from these.
 */
import type { LessonEntry, ProgressRecord, ReviewableCheckpoint } from './progress-model';

/** A live lesson node as the component passes it in `data-nodes`. */
export interface GraphNode {
	id: string;
	checkpoints: { id: string; reviewable: boolean; revision: number }[];
}

/** The node color: `read` shows as in progress, anything unknown as untouched. */
export type NodeState = 'finished' | 'skipped' | 'in-progress' | 'untouched';

export function nodeState(entry: LessonEntry | undefined): NodeState {
	if (entry?.state === 'finished') return 'finished';
	if (entry?.state === 'skipped') return 'skipped';
	if (entry?.state === 'read') return 'in-progress';
	return 'untouched';
}

/** Within-lesson detail on a node, which is not a progress unit: passed over this lesson's checkpoints. */
export interface NodeProgress {
	/** Whole percent for the node ring; 0 for a lesson without checkpoints. */
	ring: number;
	/** "2/3 checkpoints", or empty for a lesson without checkpoints. */
	count: string;
}

export function nodeProgress(node: GraphNode, rec: ProgressRecord): NodeProgress {
	const total = node.checkpoints.length;
	if (!total) return { ring: 0, count: '' };
	const passed = node.checkpoints.filter((c) => rec.checkpoints[`${node.id}#${c.id}`]?.state === 'passed').length;
	return { ring: Math.round((passed / total) * 100), count: `${passed}/${total} checkpoints` };
}

/** Whether a milestone stop is reached. At 0% only the "getting started" stop (0) is lit. */
export function stopReached(percent: number, stop: number): boolean {
	return percent >= stop && (percent > 0 || stop === 0);
}

/** The reviewable checkpoints of the graph with their revisions, for `progress.resetOutdatedReviews`. */
export function reviewableItems(nodes: readonly GraphNode[]): ReviewableCheckpoint[] {
	return nodes.flatMap((n) =>
		n.checkpoints.filter((c) => c.reviewable).map((c) => ({ id: `${n.id}#${c.id}`, revision: c.revision })),
	);
}

/** The part of a `DOMRect` the edge paths read. */
export interface Box {
	left: number;
	top: number;
	width: number;
	height: number;
	right: number;
	bottom: number;
}

/** A dotted curve from the bottom center of `from` to the top center of `to`, relative to `graph`. */
export function courseEdgePath(from: Box, to: Box, graph: Box): string {
	const x1 = from.left + from.width / 2 - graph.left;
	const y1 = from.bottom - graph.top;
	const x2 = to.left + to.width / 2 - graph.left;
	const y2 = to.top - graph.top;
	const my = (y1 + y2) / 2;
	return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
}
