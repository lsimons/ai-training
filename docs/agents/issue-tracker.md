# Issue tracker

This project uses [GitHub Issues](https://github.com/lsimons/ai-training/issues).

Use the `gh` CLI to read and write issues:

```bash
gh issue list
gh issue view <number>
gh issue create --title "..." --body "..." --label needs-triage
gh issue comment <number> --body "..."
gh issue edit <number> --add-label ready-for-agent --remove-label needs-triage
```

## Labels

| Label           | Description                                                              | Color   |
| --------------- | ------------------------------------------------------------------------ | ------- |
| bug             | Something isn't working                                                  | #d73a4a |
| content         | Adds, changes or improves content: lessons, courses, specs, docs         | #0e8a16 |
| code            | Adds, changes or improves source code: the site's TypeScript, Python, CI | #1d76db |
| harness         | Improves the agent harness: AGENTS.md, .claude, docs/agents, skills      | #5319e7 |
| dispatcher-run  | One /wave dispatcher run: its arguments, waves and state                 | #fbca04 |
| documentation   | Improvements or additions to documentation                               | #0075ca |
| enhancement     | New feature or request                                                   | #a2eeef |
| needs-triage    | Maintainer needs to evaluate this issue                                  | #e6e6fa |
| needs-info      | Waiting on reporter for more information                                 | #e6e6fa |
| ready-for-agent | Fully specified, ready for an autonomous agent                           | #e6e6fa |
| ready-for-human | Requires human implementation                                            | #e6e6fa |
| wontfix         | This won't be worked on                                                  | #ffffff |

GitHub's default labels (`duplicate`, `good first issue`, `help wanted`,
`invalid`, `question`, `accessibility`) also exist and may be used.

Every open issue has `content`, `code` or `harness`, or more than one,
saying what kind of change it asks for. A lesson issue (title
`Lesson: ...`) is `content`. An issue that touches both a lesson and the
code behind it (a fixture and its lesson page, a schema field and the spec
row) gets both. `harness` is for changes to how agents work on this repo:
`AGENTS.md`, `.claude/`, `docs/agents/` and the orchestration skills. No
picker selects `harness` issues, so the maintainer starts that work by
hand, when no `dispatcher-run` issue is open.

`dispatcher-run` marks the one issue per `/wave` run, titled
`Run: <Name> (<kind>)`. The dispatcher opens it, keeps its body current
and closes it when the run stops (`docs/agents/meta-orchestration.md`).
Such an issue is never triaged, picked or claimed, and it is the one kind
of open issue without `content`, `code` or `harness`.

## Triage flow

1. New issues get `needs-triage`.
2. A maintainer reads the issue and either asks for more detail
   (`needs-info`), closes it (`wontfix`), or specifies it fully.
3. The maintainer labels a fully specified issue `ready-for-agent` when an
   autonomous agent can implement it, or `ready-for-human` when it needs
   judgment, design or access an agent doesn't have.
4. Agents only pick up `ready-for-agent` issues. Reference the issue number in
   the branch name and the PR.
