# Claude Code hooks

The scripts here are thin wrappers. The rules and their tests are in
`scripts/agent_hooks.py` and `tests/test_agent_hooks.py`, from issues #349
and #342. `.claude/settings.json` registers them.

- `guard-bash.sh`, PreToolUse on Bash. It exits 2 with a reason that names
  the alternative for a force push, any push to `main`, `gh pr merge`
  outside the wave lead, the dispatcher or a coordinator, `git stash` in
  every worktree (all but `list` and `show`), `git reset --hard`,
  `git checkout -- .` or `git restore .` in the main checkout, a
  `sleep` over 60 seconds, a loop that polls `gh`
  (`while` or `until`, or a `for` loop that sleeps), and a `sleep` followed
  by `tail`, `cat` or `ls`, which polls a background run. It also rejects
  `--no-verify` on `git commit` or `git push` (and `git commit -n`),
  `gh repo delete`, a `gh api` call with the DELETE method in any flag form
  or place, and an `rm` that names `.scratch` and also a path outside
  `.scratch/`, such as `.scratch/../..`. A role sets
  `AI_TRAINING_ROLE` in the environment or as a prefix on the command
  (`AI_TRAINING_ROLE=wave-lead gh pr merge`).
- `review-bash.sh`, PreToolUse on Bash in the `code-reviewer` agent only,
  registered in that agent's frontmatter. It allows the read-only review
  commands and rejects everything else, and any redirect to a file but
  `/dev/null`.
- `format-file.sh`, PostToolUse on Edit and Write. It runs Biome on an
  edited file under `site/` and ruff on an edited `.py` file, in the
  worktree that holds the file, and never fails the tool call.

The layers cover different things, and JSON has no comments, so this file
says it:

- The deny rules in `settings.json` stop the forms they spell out:
  `Edit` on `settings.json` itself, `gh repo delete`, and `gh api -X DELETE`
  when `-X DELETE` comes right after `api`. They miss other flag forms and
  places, such as `gh api <path> --method DELETE`. The Claude Code
  permissions page says a deny rule stops the command text it matches and
  not the same program run in another form
  (<https://code.claude.com/docs/en/permissions>, "What a Bash rule
  doesn't match").
- The allow rules run the commands they match without a prompt. The rule
  `rm -rf .scratch/*` also matches `rm -rf .scratch/x ../other`, so the
  guard hook rejects an `rm` that leaves `.scratch/`.
- The guard hook reads every part of a compound command and covers the
  flag forms the deny rules miss. A hook that exits 2 blocks the call even
  when an allow rule matches it (same page, "Extend permissions with
  hooks"). It matches shell text, so it catches mistakes and not an agent
  that works around it on purpose.
