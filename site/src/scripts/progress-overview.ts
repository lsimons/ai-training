/**
 * The progress page in the browser: one card per course from the progress
 * record, the export, import and reset buttons, and the raw record. Redraws
 * on every progress write. The labels are in `progress-overview-model.ts`.
 */
import { reviewDueLabel } from './due-counts';
import { activeHabits, habitSummary } from './overview';
import * as progress from './progress';
import { type CatalogCourse, type CatalogLesson, checkpointTitle, knownIds } from './progress-overview-model';
import { requiredData, requiredElement } from './required-element';

/** Binds the progress page under `doc`; returns false when the page has no progress block. */
export function mountProgressOverview(doc: ParentNode = document): boolean {
	const root = doc.querySelector<HTMLElement>('.progress[data-catalog]');
	if (!root) return false;
	const catalog: CatalogCourse[] = JSON.parse(requiredData(root, 'catalog'));
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	const overview = requiredElement(root, '[data-overview]');
	const dump = requiredElement(root, '[data-dump]');
	const message = requiredElement(root, '[data-message]');

	// Entries for ids the build no longer knows are dropped (spec S04 "Content
	// changes"). This page has the whole catalog, so the pruning lives here.
	const known = knownIds(catalog);
	function pruneOrphans() {
		progress.pruneOrphans(known.lessons, known.checkpoints, known.practice, known.habits);
	}
	pruneOrphans();

	function lessonRows(l: CatalogLesson, rec: progress.ProgressRecord): HTMLElement[] {
		const row = document.createElement('div');
		row.className = 'progress-lesson';
		row.dataset.state = rec.lessons[l.id]?.state ?? 'untouched';
		const dot = document.createElement('span');
		dot.className = 'dot';
		const link = document.createElement('a');
		link.href = `${base}/${l.id}/`;
		link.textContent = l.title;
		const cps = document.createElement('span');
		cps.className = 'cps';
		for (const c of l.checkpoints) {
			const sq = document.createElement('span');
			const st = rec.checkpoints[`${l.id}#${c.id}`];
			sq.dataset.state = st?.state ?? 'none';
			sq.title = checkpointTitle(c.id, st);
			cps.appendChild(sq);
		}
		row.append(dot, link, cps);
		// One line per active habit under its lesson (spec S07 "Where habits surface").
		const habits = activeHabits(l, rec).map((h) => {
			const line = document.createElement('p');
			line.className = 'progress-habit';
			line.dataset.progressHabit = h.id;
			const text = document.createElement('span');
			text.className = 'progress-habit-text';
			text.innerHTML = h.html;
			const when = document.createElement('span');
			when.className = 'progress-habit-when';
			when.textContent = habitSummary(h);
			line.append(text, ' ', when);
			return line;
		});
		return [row, ...habits];
	}

	function courseCard(course: CatalogCourse, rec: progress.ProgressRecord): HTMLElement {
		const card = document.createElement('div');
		card.className = 'progress-course';
		const h = document.createElement('h3');
		const a = document.createElement('a');
		a.href = `${base}/${course.area}/`;
		a.textContent = course.title;
		h.appendChild(a);
		card.appendChild(h);
		if (!course.lessons.length) {
			const p = document.createElement('p');
			p.textContent = 'No lessons yet.';
			card.appendChild(p);
			return card;
		}
		for (const l of course.lessons) card.append(...lessonRows(l, rec));
		const review = document.createElement('p');
		review.className = 'progress-review';
		const rl = document.createElement('a');
		rl.href = `${base}/${course.area}/review/`;
		rl.dataset.progressReview = course.area;
		rl.textContent = reviewDueLabel(progress.dueReviewIds(rec, `${course.area}/`).length);
		review.appendChild(rl);
		card.appendChild(review);
		return card;
	}

	function draw() {
		const rec = progress.load();
		overview.replaceChildren(...catalog.map((course) => courseCard(course, rec)));
		dump.textContent = progress.exportJson(rec);
	}

	root.querySelector('[data-export]')?.addEventListener('click', () => {
		const blob = new Blob([progress.exportJson(progress.load())], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `ai-training-progress-${progress.today()}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	});
	root.querySelector('[data-reset]')?.addEventListener('click', () => {
		if (confirm('Reset all progress in this browser?')) {
			progress.reset();
			message.textContent = 'Progress reset.';
		}
	});
	root.querySelector<HTMLInputElement>('[data-import]')?.addEventListener('change', async (e) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const text = await file.text();
		if (!confirm('Replace your progress with the imported file?')) return;
		const result = progress.importJson(text);
		if (result.ok) pruneOrphans();
		message.textContent = result.ok ? 'Imported.' : result.message;
		input.value = '';
	});

	draw();
	document.addEventListener(progress.EVENT, draw);
	return true;
}
