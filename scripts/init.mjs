// Rename this template to a new project.
//
// Replaces every occurrence of the repo-name placeholder `lsimons-template-doc`
// (used for the deploy base path, package name, and GitHub URLs) and the
// human-title placeholder `Template Docs` throughout the repo.
//
//   bun run scripts/init.mjs                       # infer name from git/dir
//   bun run scripts/init.mjs --name my-docs
//   bun run scripts/init.mjs --name my-docs --title "My Docs"
//
// Run via `mise run init [args]`.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, extname } from 'node:path';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const NAME_PLACEHOLDER = 'lsimons-template-doc';
const TITLE_PLACEHOLDER = 'Template Docs';

// Directories never worth touching, and binary/generated files we must not
// rewrite (rendered slide decks live here too and are large).
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.astro', '.quarto']);
const SKIP_FILES = new Set(['bun.lock', 'init.mjs']);
const BINARY_EXT = new Set([
	'.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.pptx',
	'.woff', '.woff2', '.ttf', '.otf', '.eot', '.html',
]);

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--name') args.name = argv[++i];
		else if (a === '--title') args.title = argv[++i];
		else throw new Error(`Unknown argument: ${a}`);
	}
	return args;
}

// Strip a leading `lsimons-` and a trailing `-doc`/`-docs` so a repo cloned as
// `lsimons-foo-docs` becomes `foo`. Leave anything else as-is.
function inferName() {
	let base;
	try {
		const url = execSync('git remote get-url origin', {
			cwd: REPO_ROOT,
			stdio: ['ignore', 'pipe', 'ignore'],
		})
			.toString()
			.trim();
		base = url.replace(/\.git$/, '').replace(/\/$/, '').split(/[/:]/).pop();
	} catch {
		base = REPO_ROOT.split('/').pop();
	}
	return base;
}

function titleize(name) {
	return name
		.replace(/[-_]+/g, ' ')
		.split(' ')
		.filter(Boolean)
		.map((w) => w[0].toUpperCase() + w.slice(1))
		.join(' ');
}

function* walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (SKIP_DIRS.has(entry.name)) continue;
			yield* walk(full);
		} else if (entry.isSymbolicLink && entry.isSymbolicLink()) {
			continue; // e.g. CLAUDE.md -> AGENTS.md
		} else if (entry.isFile()) {
			if (SKIP_FILES.has(entry.name)) continue;
			if (BINARY_EXT.has(extname(entry.name).toLowerCase())) continue;
			yield full;
		}
	}
}

function main() {
	const args = parseArgs(process.argv.slice(2));
	const name = args.name ?? inferName();
	if (!name || name === NAME_PLACEHOLDER) {
		console.error(
			`Could not infer a project name (got "${name}"). Pass one with --name.`,
		);
		process.exit(1);
	}
	const title = args.title ?? titleize(name);

	console.log(`Renaming template:`);
	console.log(`  name:  ${NAME_PLACEHOLDER}  ->  ${name}`);
	console.log(`  title: ${TITLE_PLACEHOLDER}  ->  ${title}`);
	console.log('');

	const changed = [];
	for (const file of walk(REPO_ROOT)) {
		let text;
		try {
			text = readFileSync(file, 'utf8');
		} catch {
			continue; // unreadable / not utf8
		}
		if (!text.includes(NAME_PLACEHOLDER) && !text.includes(TITLE_PLACEHOLDER)) continue;
		const updated = text
			.split(NAME_PLACEHOLDER)
			.join(name)
			.split(TITLE_PLACEHOLDER)
			.join(title);
		if (updated !== text) {
			writeFileSync(file, updated);
			changed.push(relative(REPO_ROOT, file));
		}
	}

	if (changed.length === 0) {
		console.log('No placeholders found - already initialised?');
	} else {
		console.log(`Updated ${changed.length} file(s):`);
		for (const f of changed.sort()) console.log(`  ${f}`);
	}
	console.log('');
	console.log('Next: rename the example slide deck if you like, then');
	console.log('  mise run docs-install && mise run docs-dev');
}

main();
