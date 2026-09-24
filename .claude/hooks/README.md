# Claude Code hooks

The scripts here are thin wrappers. The rules and their tests are in
`scripts/agent_hooks.py` and `tests/test_agent_hooks.py`, from issues #349
and #342. `.claude/settings.json` registers them.

- `guard-bash.sh`, PreToolUse on Bash. It exits 2 with a reason that names
  the alternative for a force push, a push to `main` outside the
  dispatcher, `gh pr merge` outside the wave lead, the dispatcher or a
  coordinator, `git stash`, `git reset --hard` or `git checkout -- .` in
  the main checkout, a `sleep` over 60 seconds, and a shell loop that
  calls `gh`. A role sets `AI_TRAINING_ROLE` in the environment or as a
  prefix on the command (`AI_TRAINING_ROLE=dispatcher git push`).
- `format-file.sh`, PostToolUse on Edit and Write. It runs Biome on an
  edited file under `site/` and ruff on an edited `.py` file, in the
  worktree that holds the file, and never fails the tool call.

The deny rules in `settings.json` (`Edit` on `settings.json` itself,
`gh repo delete`, `gh api -X DELETE`) are a second layer. A permission
rule matches shell text loosely, so the guard hook is the real check. JSON
has no comments, so this file says it.
