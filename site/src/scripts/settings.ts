/**
 * The settings page in the browser: draws the comfort buttons and the review
 * schedule from the progress record, and redraws on every progress write.
 * The rules are in `settings-model.ts`; this module only touches the DOM.
 */
import { historyDisplay } from './checkpoint-logic';
import { dueByCourse } from './due-counts';
import * as progress from './progress';
import { requiredData, requiredElement } from './required-element';
import { type CatalogCourse, comfortNote, itemHref, itemLabel, scheduleRows, toggledComfort } from './settings-model';

/** Binds the settings page under `doc`; returns false when the page has no settings block. */
export function mountSettings(doc: ParentNode = document): boolean {
	const root = doc.querySelector<HTMLElement>('.settings[data-catalog]');
	if (!root) return false;
	const catalog: CatalogCourse[] = JSON.parse(requiredData(root, 'catalog'));
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	const schedule = requiredElement(root, '[data-schedule]');
	const dueNow = requiredElement(root, '[data-due-now]');
	const comfortButtons = root.querySelectorAll<HTMLButtonElement>('[data-comfort]');
	const comfortNoteEl = requiredElement(root, '[data-comfort-note]');

	function drawComfort() {
		const level = progress.load().comfort;
		for (const b of comfortButtons) b.setAttribute('aria-pressed', String(b.dataset.comfort === level));
		comfortNoteEl.textContent = comfortNote(level);
	}
	for (const b of comfortButtons) {
		b.addEventListener('click', () => {
			progress.setComfort(toggledComfort(progress.load().comfort, b.dataset.comfort));
			drawComfort();
		});
	}

	/** Which courses have items due now, each linking to its review page. */
	function drawDueNow(rec: progress.ProgressRecord) {
		const courses = dueByCourse(catalog, rec, progress.today());
		if (!courses.length) {
			dueNow.textContent = 'Nothing due right now.';
			return;
		}
		dueNow.replaceChildren('Due now: ');
		courses.forEach((course, i) => {
			if (i > 0) dueNow.append(', ');
			const a = document.createElement('a');
			a.href = `${base}/${course.area}/review/`;
			a.textContent = `${course.title} (${course.due})`;
			dueNow.appendChild(a);
		});
		dueNow.append('.');
	}

	function stageButton(className: string, text: string, disabled: boolean, onClick: () => void): HTMLButtonElement {
		const b = document.createElement('button');
		b.type = 'button';
		b.className = className;
		b.textContent = text;
		b.disabled = disabled;
		b.addEventListener('click', onClick);
		return b;
	}

	function scheduleRow(id: string, item: progress.ReviewEntry): HTMLElement {
		const row = document.createElement('div');
		row.className = 'schedule-item';
		row.dataset.reviewItem = id;
		const name = document.createElement('a');
		name.className = 'schedule-name';
		name.href = itemHref(base, id);
		name.textContent = itemLabel(catalog, id);
		const stage = Number(item.stage);
		const pills = document.createElement('span');
		pills.className = 'cp-stage';
		for (let i = 0; i < 5; i++) {
			const p = document.createElement('span');
			p.dataset.on = String(i < stage);
			pills.appendChild(p);
		}
		const label = document.createElement('em');
		label.className = 'cp-stage-label';
		label.textContent = `stage ${stage} of 5, due ${item.due}`;
		pills.appendChild(label);
		const history = document.createElement('span');
		history.className = 'schedule-history';
		history.textContent = historyDisplay(item.history);
		const actions = document.createElement('span');
		actions.className = 'schedule-actions';
		actions.append(
			stageButton('cp-sooner', 'See this sooner', stage <= 1, () => progress.adjustReviewStage(id, -1)),
			stageButton('cp-later', 'See this less often', stage >= 5, () => progress.adjustReviewStage(id, +1)),
		);
		row.append(name, pills, actions, history);
		return row;
	}

	function drawSchedule() {
		const rec = progress.load();
		drawDueNow(rec);
		const rows = scheduleRows(rec);
		if (!rows.length) {
			schedule.innerHTML =
				'<p class="review-empty">Nothing scheduled. Finish a lesson and its checkpoints appear here.</p>';
			return;
		}
		schedule.replaceChildren(...rows.map(([id, item]) => scheduleRow(id, item)));
	}

	function draw() {
		drawComfort();
		drawSchedule();
	}
	draw();
	document.addEventListener(progress.EVENT, draw);
	return true;
}
