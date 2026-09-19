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

| Label           | Description                                    | Color   |
| --------------- | ---------------------------------------------- | ------- |
| bug             | Something isn't working                        | #d73a4a |
| documentation   | Improvements or additions to documentation     | #0075ca |
| enhancement     | New feature or request                         | #a2eeef |
| needs-triage    | Maintainer needs to evaluate this issue        | #e6e6fa |
| needs-info      | Waiting on reporter for more information       | #e6e6fa |
| ready-for-agent | Fully specified, ready for an autonomous agent | #e6e6fa |
| ready-for-human | Requires human implementation                  | #e6e6fa |
| wontfix         | This will not be worked on                     | #ffffff |

GitHub's default labels (`duplicate`, `good first issue`, `help wanted`,
`invalid`, `question`, `accessibility`) also exist and may be used.

## Triage flow

1. New issues get `needs-triage`.
2. A maintainer reads the issue and either asks for more detail
   (`needs-info`), closes it (`wontfix`), or specifies it fully.
3. A fully specified issue is labelled `ready-for-agent` when an autonomous
   agent can implement it, or `ready-for-human` when it needs judgement, design
   or access an agent does not have.
4. Agents only pick up `ready-for-agent` issues. Reference the issue number in
   the branch name and the PR.
