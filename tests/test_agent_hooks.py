"""Tests for the Claude Code hooks in scripts/agent_hooks.py (#349, #342).

The guard is tested through `check_command` with the git lookups replaced,
so no test depends on the checkout it runs in, and through `main` for the
exit code and message Claude Code sees. The git helpers get a throwaway
repository with a linked worktree.
"""

import json
import os
import subprocess
from collections.abc import Callable
from pathlib import Path

import pytest

import agent_hooks

MAIN = "/repo"
WORKTREE = "/repo-wt/feat/1-x"


def in_main(path: str) -> bool:
    return path.startswith(MAIN + "/") or path == MAIN


def on_branch(branch: str) -> Callable[[str], str]:
    return lambda _path: branch


def check(
    command: str, cwd: str = WORKTREE, env: dict[str, str] | None = None, branch: str = "feat/1-x"
) -> str | None:
    return agent_hooks.check_command(command, cwd, env or {}, in_main, on_branch(branch))


@pytest.mark.parametrize(
    "command",
    [
        "git push --force origin feat/1-x",
        "git push -f",
        "git push -uf origin feat/1-x",
        "git push origin +feat/1-x",
        "cd /tmp && git push --force",
    ],
)
def test_force_push_is_rejected_with_the_lease_alternative(command: str) -> None:
    reason = check(command)
    assert reason is not None
    assert "--force-with-lease" in reason


@pytest.mark.parametrize(
    "command",
    [
        "git push --force-with-lease origin feat/x",
        "git push --force-with-lease",
        "git push -u origin feat/1-x",
        "git push",
    ],
)
def test_ordinary_and_lease_pushes_of_a_branch_pass(command: str) -> None:
    assert check(command) is None


@pytest.mark.parametrize(
    "command",
    ["git push origin main", "git push origin HEAD:main", "git push origin x:refs/heads/main"],
)
def test_push_to_main_is_rejected(command: str) -> None:
    reason = check(command)
    assert reason is not None
    assert "no agent pushes to `main`" in reason


def test_plain_push_on_main_is_a_push_to_main() -> None:
    assert check("git push", branch="main") is not None
    assert check("git push origin HEAD", branch="main") is not None


def test_no_role_may_push_main() -> None:
    assert check("AI_TRAINING_ROLE=dispatcher git push origin main") is not None
    assert check("git push origin main", env={"AI_TRAINING_ROLE": "dispatcher"}) is not None
    assert check("AI_TRAINING_ROLE=wave-lead git push origin main") is not None


def test_merge_needs_a_merging_role() -> None:
    reason = check("gh pr merge 12 --rebase")
    assert reason is not None
    assert "wave lead" in reason
    assert check("AI_TRAINING_ROLE=wave-lead gh pr merge 12 --rebase") is None
    assert check("gh pr merge 12 --rebase", env={"AI_TRAINING_ROLE": "coordinator"}) is None


@pytest.mark.parametrize(
    "command",
    [
        "git stash",
        "git stash push -m x",
        "git reset --hard",
        "git reset --hard origin/main",
        "git checkout -- .",
        "git checkout .",
        "git restore .",
    ],
)
def test_discarding_commands_are_rejected_in_the_main_checkout(command: str) -> None:
    reason = check(command, cwd=MAIN)
    assert reason is not None
    assert "main checkout" in reason


@pytest.mark.parametrize("command", ["git stash", "git reset --hard", "git checkout -- ."])
def test_discarding_commands_pass_in_a_worktree(command: str) -> None:
    assert check(command, cwd=WORKTREE) is None


def test_cd_and_dash_c_move_the_check_into_the_main_checkout() -> None:
    assert check(f"cd {MAIN} && git stash") is not None
    assert check(f"git -C {MAIN} reset --hard") is not None
    assert check(f"git -C {MAIN} -c core.pager=cat stash") is not None
    assert check(f"cd {MAIN}/site; git reset --hard") is not None


def test_harmless_git_in_the_main_checkout_passes() -> None:
    for command in [
        "git stash list",
        "git stash show",
        "git reset HEAD~1",
        "git checkout -- a.txt",
        "git status",
    ]:
        assert check(command, cwd=MAIN) is None, command


def test_long_sleep_is_rejected_and_short_sleep_passes() -> None:
    reason = check("sleep 480")
    assert reason is not None
    assert "notifications" in reason
    assert check("sleep 5") is None
    assert check("sleep 60") is None
    assert check("sleep 2m") is not None
    assert check("sleep 30 30 30") is not None
    assert check("mise run site-build && sleep 600") is not None


def test_gh_poll_loops_are_rejected() -> None:
    loop = "for i in $(seq 1 19); do gh pr view 3 --json state; sleep 30; done"
    reason = check(loop)
    assert reason is not None
    assert "poll loop" in reason
    assert (
        check('while [ "$(gh pr view 3 --json state -q .state)" = OPEN ]; do sleep 20; done')
        is not None
    )
    assert check("until gh run view 5 --exit-status; do sleep 10; done") is not None


def test_loops_without_gh_and_gh_without_loops_pass() -> None:
    assert check("for f in a b; do echo $f; done") is None
    assert check("for n in 359 360; do gh issue view $n --json state; done") is None
    assert check("for n in 1 2; do gh issue view $n; done; sleep 5") is not None
    assert check("gh pr checks 3 --watch") is None
    assert check("gh run watch 12") is None


def test_heredoc_bodies_and_quoted_text_are_data() -> None:
    body = "git commit -F - <<'EOF'\nsleep 600 while the gh loop ran\ngit push --force\nEOF"
    assert check(body) is None
    assert check('git commit -m "no sleep 600; for x do gh"') is None
    assert check("cat <<EOF > f\nsleep 900\nEOF\nsleep 900") is not None


def test_unbalanced_quotes_fall_back_to_plain_words() -> None:
    assert check("echo 'unterminated && sleep 900") is not None


def test_guard_bash_event_blocks_with_exit_2_and_names_the_hook() -> None:
    event = {"tool_input": {"command": "sleep 480"}, "cwd": WORKTREE}
    code, message = agent_hooks.guard_bash(event, {})
    assert code == 2
    assert message.startswith("Blocked by .claude/hooks/guard-bash.sh:")


def test_guard_bash_event_without_a_command_passes() -> None:
    assert agent_hooks.guard_bash({"tool_input": {}}, {}) == (0, "")
    assert agent_hooks.guard_bash({}, {}) == (0, "")


def test_main_reads_stdin_and_prints_the_reason(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    event = json.dumps({"tool_input": {"command": "sleep 480"}, "cwd": str(tmp_path)})
    assert agent_hooks.main(["agent_hooks.py", "guard-bash"], event, {}) == 2
    assert "sleep" in capsys.readouterr().err
    ok = json.dumps({"tool_input": {"command": "sleep 5"}, "cwd": str(tmp_path)})
    assert agent_hooks.main(["agent_hooks.py", "guard-bash"], ok, {}) == 0


def test_main_rejects_a_bad_mode_and_ignores_bad_json(capsys: pytest.CaptureFixture[str]) -> None:
    assert agent_hooks.main(["agent_hooks.py"], "{}", {}) == 1
    assert "usage" in capsys.readouterr().err
    assert agent_hooks.main(["agent_hooks.py", "guard-bash"], "not json", {}) == 0
    assert agent_hooks.main(["agent_hooks.py", "guard-bash"], "[1]", {}) == 0


# Polling a background command, skipped git hooks, deletes on GitHub, and
# `rm` out of `.scratch` (#391).


@pytest.mark.parametrize(
    "command",
    [
        "sleep 55 && tail -5 .scratch/fast.txt",
        "sleep 30; cat /private/tmp/task.output",
        "sleep 50\nls -la .scratch",
        "mise run fast > .scratch/f.txt 2>&1 & sleep 55; tail .scratch/f.txt",
    ],
)
def test_sleep_then_read_is_polling_and_names_the_foreground_run(command: str) -> None:
    reason = check(command)
    assert reason is not None
    assert "foreground" in reason
    assert "600000" in reason


def test_reading_without_a_sleep_before_it_passes() -> None:
    assert check("tail -5 .scratch/fast.txt") is None
    assert check("cat a.txt && sleep 5") is None
    assert check("ls .scratch; sleep 1") is None


@pytest.mark.parametrize(
    "command",
    [
        "git commit --no-verify -m x",
        "git add -A && git commit --amend --no-verify",
        "git commit -n -m x",
        "git commit -anm x",
        "git commit --no-veri -m x",
        "git push --no-verify origin feat/1-x",
        "git -C ../other push --no-verify",
        "mise run fast; git commit -m x --no-verify",
    ],
)
def test_skipping_the_git_hooks_is_rejected(command: str) -> None:
    reason = check(command)
    assert reason is not None
    assert "--no-verify" in reason


@pytest.mark.parametrize(
    "command",
    [
        "git commit -m x",
        "git commit -m --no-verify",
        "git commit -mnote",
        'git commit -m "fix: mention --no-verify"',
        "git commit -am x -- -n",
        "git push -n origin feat/1-x",
        "git log --no-verify",
        "git commit -F - <<'EOF'\ngit commit --no-verify\nEOF",
    ],
)
def test_commits_and_pushes_that_keep_the_hooks_pass(command: str) -> None:
    assert check(command) is None


@pytest.mark.parametrize(
    "command",
    [
        "gh repo delete lsimons/ai-training --yes",
        "gh api -X DELETE repos/o/r/git/refs/heads/x",
        "gh api repos/o/r/issues/comments/1 -X DELETE",
        "gh api repos/o/r/issues/comments/1 -XDELETE",
        "gh api repos/o/r/issues/comments/1 -X=DELETE",
        "gh api --method DELETE repos/o/r/releases/1",
        "gh api repos/o/r/releases/1 --method=delete",
        "gh issue view 1 && gh api repos/o/r/labels/x --method DELETE",
    ],
)
def test_deletes_on_github_are_rejected(command: str) -> None:
    reason = check(command)
    assert reason is not None
    assert "DELETE" in reason


@pytest.mark.parametrize(
    "command",
    [
        "gh api repos/o/r/pulls/1",
        "gh api -X PATCH repos/o/r/issues/comments/1 -f body=x",
        "gh api --method POST repos/o/r/issues/1/comments -f body=DELETE",
        "gh api repos/o/r/issues -X",
        "gh repo view",
    ],
)
def test_other_gh_calls_pass(command: str) -> None:
    assert check(command) is None


@pytest.mark.parametrize(
    ("command", "outside"),
    [
        ("rm -rf .scratch/x ../other", "../other"),
        ("rm -rf .scratch/../..", ".scratch/../.."),
        ("rm -rf .scratch/..", ".scratch/.."),
        ("rm -rf .scratch/x /", "/"),
        ("rm -rf .scratch/x $HOME", "$HOME"),
        ("rm -rf -- .scratch/x site", "site"),
    ],
)
def test_rm_with_a_scratch_target_must_stay_inside_scratch(command: str, outside: str) -> None:
    reason = check(command)
    assert reason is not None
    assert f"`{outside}`" in reason


@pytest.mark.parametrize(
    "command",
    [
        "rm -rf .scratch",
        "rm -rf .scratch/",
        "rm -rf .scratch/x .scratch/y/z",
        "rm -rf .scratch/*",
        "cd site && rm -rf ../.scratch/x",
        "rm -rf site/dist",
        "rm a.txt",
    ],
)
def test_rm_inside_scratch_or_without_a_scratch_target_passes(command: str) -> None:
    assert check(command) is None


def git(*args: str, cwd: Path) -> None:
    env = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_SYSTEM": os.devnull}
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, env=env)


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    main = tmp_path / "main"
    main.mkdir()
    git("init", "-q", "-b", "main", cwd=main)
    git(
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@example.com",
        "commit",
        "-q",
        "--allow-empty",
        "-m",
        "base",
        cwd=main,
    )
    git("worktree", "add", "-q", "-b", "feat/1-x", str(tmp_path / "wt"), cwd=main)
    return tmp_path


def test_main_checkout_and_branch_lookups_against_a_real_repository(repo: Path) -> None:
    assert agent_hooks.is_main_checkout(str(repo / "main"))
    assert not agent_hooks.is_main_checkout(str(repo / "wt"))
    assert not agent_hooks.is_main_checkout(str(repo / "missing"))
    assert agent_hooks.current_branch(str(repo / "main")) == "main"
    assert agent_hooks.current_branch(str(repo / "wt")) == "feat/1-x"
    assert agent_hooks.current_branch(str(repo / "missing")) == ""


def test_default_lookups_block_stash_in_the_main_checkout_only(repo: Path) -> None:
    assert agent_hooks.check_command("git stash", str(repo / "main"), {}) is not None
    assert agent_hooks.check_command("git stash", str(repo / "wt"), {}) is None
    assert agent_hooks.check_command("git push", str(repo / "main"), {}) is not None


def test_formatter_for_picks_biome_under_site_and_ruff_for_python(tmp_path: Path) -> None:
    biome = tmp_path / "site" / "node_modules" / ".bin" / "biome"
    ruff = tmp_path / ".venv" / "bin" / "ruff"
    for tool in (biome, ruff):
        tool.parent.mkdir(parents=True)
        tool.write_text("")
    ts = agent_hooks.formatter_for(tmp_path / "site" / "src" / "a.ts", tmp_path)
    assert ts == (
        [str(biome), "check", "--write", "--no-errors-on-unmatched", "src/a.ts"],
        tmp_path / "site",
    )
    py = agent_hooks.formatter_for(tmp_path / "scripts" / "a.py", tmp_path)
    assert py == ([str(ruff), "format", "--quiet", "scripts/a.py"], tmp_path)
    assert agent_hooks.formatter_for(tmp_path / "docs" / "a.md", tmp_path) is None
    assert agent_hooks.formatter_for(tmp_path / "site" / "a.md", tmp_path) is None
    assert agent_hooks.formatter_for(Path("/elsewhere/a.ts"), tmp_path) is None


def test_formatter_for_skips_a_missing_tool(tmp_path: Path) -> None:
    assert agent_hooks.formatter_for(tmp_path / "site" / "a.ts", tmp_path) is None
    assert agent_hooks.formatter_for(tmp_path / "a.py", tmp_path) is None


def test_format_file_runs_the_formatter_in_the_edited_worktree(repo: Path) -> None:
    wt = repo / "wt"
    ruff = wt / ".venv" / "bin" / "ruff"
    ruff.parent.mkdir(parents=True)
    log = repo / "ran.txt"
    ruff.write_text(f'#!/bin/sh\necho "$PWD $*" > "{log}"\n')
    ruff.chmod(0o755)
    edited = wt / "x.py"
    edited.write_text("x=1\n")
    assert (
        agent_hooks.main(
            ["agent_hooks.py", "format"], json.dumps({"tool_input": {"file_path": str(edited)}}), {}
        )
        == 0
    )
    assert log.read_text().split() == [str(wt.resolve()), "format", "--quiet", "x.py"]


def test_format_file_never_fails(repo: Path, tmp_path: Path) -> None:
    assert agent_hooks.format_file({"tool_input": {}}) == 0
    assert agent_hooks.format_file({"tool_input": {"file_path": "/no/such/dir/a.py"}}) == 0
    outside = tmp_path / "outside.md"
    assert agent_hooks.format_file({"tool_input": {"file_path": str(repo / "main" / "a.md")}}) == 0
    assert agent_hooks.format_file({"tool_input": {"file_path": str(outside)}}) == 0
    broken = repo / "wt" / ".venv" / "bin" / "ruff"
    broken.parent.mkdir(parents=True)
    broken.write_text("not a program")
    broken.chmod(0o755)
    assert agent_hooks.format_file({"tool_input": {"file_path": str(repo / "wt" / "b.py")}}) == 0


@pytest.mark.parametrize(
    "command",
    [
        "git diff origin/main...HEAD",
        "git log --oneline -5",
        "git -C ../ai-training-wt/feat/1-x show HEAD",
        "git status --short",
        "gh pr diff 12",
        "gh pr view 12 --json files",
        "gh issue view 12 --comments",
        "mise run site-test",
        "cd ../ai-training-wt/feat/1-x && git diff origin/main...HEAD | head -50",
        "ls site/src",
        "grep -rn 'a > b' site 2>/dev/null",
        "git diff 2>&1 | head",
        "grep -c x file >/dev/null",
        'grep -n "=>" site/src/lib/url.ts',
        "git log -1 &>/dev/null",
    ],
)
def test_review_bash_allows_the_read_only_review_commands(command: str) -> None:
    event = {"tool_input": {"command": command}}
    assert agent_hooks.review_bash(event) == (0, "")


@pytest.mark.parametrize(
    "command",
    [
        "git commit -am fix",
        "git push",
        "gh pr comment 12 --body x",
        "gh issue comment 12 --body x",
        "sed -i s/a/b/ file.md",
        "rm -rf site",
        "git diff && git checkout -- .",
        "AI_TRAINING_ROLE=dispatcher git diff",
        "git",
    ],
)
def test_review_bash_rejects_anything_else(command: str) -> None:
    code, message = agent_hooks.review_bash({"tool_input": {"command": command}})
    assert code == 2
    assert "not a review command" in message


@pytest.mark.parametrize(
    "command",
    [
        "grep -rn foo . > out.txt",
        "wc -l a >> b",
        "wc -l a>>b",
        "git diff > review.patch",
        "grep a &> f",
        "grep a >| f",
        "git log 2>err.txt",
    ],
)
def test_review_bash_rejects_a_redirect_to_a_file(command: str) -> None:
    code, message = agent_hooks.review_bash({"tool_input": {"command": command}})
    assert code == 2
    assert "redirects output to a file" in message


def test_output_redirects_skips_quoted_and_escaped_text() -> None:
    assert agent_hooks.output_redirects("grep 'a>b' f") == []
    assert agent_hooks.output_redirects('grep "a>b \\" > x" f') == []
    assert agent_hooks.output_redirects(r"grep a\>b f") == []
    assert agent_hooks.output_redirects("cmd 2>&1 >&- > out") == ["&1", "&-", "out"]


def test_review_bash_through_main(capsys: pytest.CaptureFixture[str]) -> None:
    event = json.dumps({"tool_input": {"command": "git push"}})
    assert agent_hooks.main(["agent_hooks.py", "review-bash"], event, {}) == 2
    assert "code-reviewer hook" in capsys.readouterr().err
    assert agent_hooks.review_bash({"tool_input": {}}) == (0, "")
