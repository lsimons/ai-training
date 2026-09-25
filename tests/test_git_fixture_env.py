"""Git variables in the learner's shell don't change what the git fixtures print.

Each of these fixtures builds a fresh repository and runs git in it with an
allow-list environment: `GIT_ENV_BASE` in the coding-with-agents fixtures'
`_common.py`, and `git_env` in testing-a-skill's `clones.py`. This runs every
one of them twice, once plainly and once with variables that change what git
does: a template directory whose pre-commit hook fails, extra config through
GIT_CONFIG_PARAMETERS, an external diff program and GIT_DIFF_OPTS. The output
must match byte for byte. The reversible-changes and testing-a-skill fixtures print
no diff, so for them only the failing template hook shows a leak.
"""

import os
import pathlib
import stat
import subprocess
import sys

import pytest

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
EXAMPLES = REPO_ROOT / "site" / "examples"
GIT_FIXTURE_DIRS = [
    "coding-with-agents/project-instructions",
    "coding-with-agents/reversible-changes",
    "coding-with-agents/reviewing-the-diff",
    "customizing-agents/testing-a-skill",
]
NOT_RUN = {
    # build.py needs a target directory and prints its usage without one. It
    # builds the repository with the same `build` the other fixtures call.
    "coding-with-agents/reviewing-the-diff/build.py",
    # clones.py is the module the other testing-a-skill fixtures import. Run on
    # its own it defines functions and prints nothing, so it would compare two
    # empty outputs. Its `git_env` is exercised through the fixtures that call it.
    "customizing-agents/testing-a-skill/clones.py",
}


def _fixtures() -> list[pathlib.Path]:
    found: list[pathlib.Path] = []
    for name in GIT_FIXTURE_DIRS:
        for path in sorted((EXAMPLES / name).glob("*.py")):
            if path.name.startswith(("_", "test_")) or f"{name}/{path.name}" in NOT_RUN:
                continue
            found.append(path)
    return found


def _run(fixture: pathlib.Path, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(fixture)],
        cwd=fixture.parent,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def _hostile_env(tmp_path: pathlib.Path) -> dict[str, str]:
    hooks = tmp_path / "template" / "hooks"
    hooks.mkdir(parents=True)
    hook = hooks / "pre-commit"
    hook.write_text("#!/bin/sh\necho HOOK-RAN\nexit 1\n", encoding="utf-8")
    hook.chmod(hook.stat().st_mode | stat.S_IEXEC)
    external = tmp_path / "external-diff"
    external.write_text("#!/bin/sh\necho EXTERNAL-DIFF\n", encoding="utf-8")
    external.chmod(external.stat().st_mode | stat.S_IEXEC)
    return dict(
        os.environ,
        GIT_TEMPLATE_DIR=str(tmp_path / "template"),
        GIT_CONFIG_PARAMETERS="'diff.noprefix'='true' 'color.ui'='always'",
        GIT_EXTERNAL_DIFF=str(external),
        GIT_DIFF_OPTS="--unified=1",
    )


def test_every_git_fixture_is_found() -> None:
    names = {f"{path.parent.name}/{path.name}" for path in _fixtures()}
    assert "reversible-changes/commits.py" in names
    assert "reviewing-the-diff/stat.py" in names
    assert "testing-a-skill/fresh_clone.py" in names
    assert "testing-a-skill/tag_placement.py" in names


def test_every_not_run_entry_names_a_file() -> None:
    missing = sorted(entry for entry in NOT_RUN if not (EXAMPLES / entry).is_file())
    assert missing == []


@pytest.mark.parametrize("fixture", _fixtures(), ids=lambda path: f"{path.parent.name}/{path.name}")
def test_git_variables_in_the_shell_do_not_change_the_output(
    fixture: pathlib.Path, tmp_path: pathlib.Path
) -> None:
    clean = _run(fixture, dict(os.environ))
    hostile = _run(fixture, _hostile_env(tmp_path))
    assert "HOOK-RAN" not in hostile.stdout + hostile.stderr
    assert "EXTERNAL-DIFF" not in hostile.stdout + hostile.stderr
    assert (hostile.returncode, hostile.stdout) == (clean.returncode, clean.stdout)
