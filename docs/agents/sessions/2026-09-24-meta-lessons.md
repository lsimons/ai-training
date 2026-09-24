# Meta session, 2026-09-24 (lessons)

A dispatcher run over the planned lessons, started 2026-09-24.

## Arguments

- `/wave 10`, kind `lessons`, filing on (the default filing paragraph).

## Parked

None.

## Waves

### Wave 14

```text
WAVE 14 merged
PR: #313
Merged issues: #118 #156 #150 #137 #196 #187 #161 #140 #155 #132 #302 #256
Left out: none
For the maintainer: none. Calls I made are listed in the PR body: I deleted the per-lesson pytest page checks that #137, #140 and #132 had invented, and kept their fixtures for #311 to wire in after #237. #140 was renamed to "Watch a tiny agent work". #132 also fixed the same unsupported "pauses by default" sentence in the live safety/agent-risk. `mise run ci` on the wave branch, GitHub CI on the PR and CI on main (run 36037772354) all passed. Every worktree is removed and the branches are kept.
Filed: #310 Build check rejects an unresolved (@key) citation in rendered HTML (ready-for-human, filed by the nits reviewer); #311 Wire the wave 14 foundations fixtures into the #237 proof mechanism; #312 Cosmetic nits left open on wave 14 branches
Follow-ups: none
Add to collision notes: A foundations lesson backed by a fixture pastes its output into a `text` fence and adds no test or CI check of its own until #237 is merged (then see #311).
Add to collision notes: A rewrap of lesson prose keeps every `(@key)` citation on one line, and the builder compares the built page's citation count with main.
Add to collision notes: A plan title that says the learner runs something is checked against the foundations rule that the learner runs nothing.
```

### Wave 15

```text
WAVE 15 merged
PR: #316
Merged issues: #143 #120 #164 #157 #159 #182 #149 #135 #168 #166 #312
Left out: none
For the maintainer: none
Filed: #314 Point two wave 15 assumes stand-ins at their live teaching lessons; #315 Cosmetic nits left open on wave 15 branches (plus a heads-up comment on #138 about an Academy framing its plan note asks for, which the course doesn't state)
Follow-ups: none
Add to collision notes: Reviewers start the `code-review` skill from inside the review worktree, because it reviews the checkout it runs in (three reviewers got an empty result this wave), and they probe by hand when it returns nothing.
Add to collision notes: A fixture that shells out to git removes `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` and the other repository variables from the env it passes, and reads input directories with a glob, not `iterdir()`.
Add to collision notes: A claim about how an agent product loads context (skills, MCP tools, memory files) names the vendor page and matches today's default behavior.
Add to collision notes: Builders never message reviewers. Only the lead asks for a re-check.
```
