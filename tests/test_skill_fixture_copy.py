"""The testing-a-skill fixtures copy the committed first-skill package, and nothing else.

`clones.py` builds its repositories from `first-skill/fixture-package`. A
learner who ran the first-skill exercise in place leaves local edits or new
files there, and those must not change what the fixtures print. Where the
package isn't in a git checkout, the copy falls back to the files as they
are and says so on stderr. The release check that `tag_placement.py` and
`first-skill/check.py` run sees an allow-list environment, so a PYTHONPATH
in the caller's shell doesn't reach it.
"""

import importlib.util
import os
import subprocess
import sys
from pathlib import Path
from types import ModuleType

import pytest

EXAMPLES = Path(__file__).resolve().parents[1] / "site" / "examples" / "customizing-agents"
CLONES = EXAMPLES / "testing-a-skill" / "clones.py"


@pytest.fixture(scope="module")
def clones() -> ModuleType:
    spec = importlib.util.spec_from_file_location("testing_a_skill_clones", CLONES)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _git(cwd: Path, *args: str) -> None:
    env = {
        "PATH": os.environ.get("PATH", os.defpath),
        "HOME": str(cwd),
        "GIT_CONFIG_GLOBAL": os.devnull,
        "GIT_CONFIG_SYSTEM": os.devnull,
        "GIT_AUTHOR_NAME": "Test",
        "GIT_AUTHOR_EMAIL": "test@example.com",
        "GIT_COMMITTER_NAME": "Test",
        "GIT_COMMITTER_EMAIL": "test@example.com",
    }
    subprocess.run(["git", *args], cwd=cwd, env=env, check=True, capture_output=True)


def _package(parent: Path) -> Path:
    package = parent / "fixture-package"
    (package / "sub").mkdir(parents=True)
    (package / "notes.py").write_text('__version__ = "0.3.0"\n', encoding="utf-8")
    (package / "sub" / "run.sh").write_text("#!/bin/sh\n", encoding="utf-8")
    (package / "sub" / "run.sh").chmod(0o755)
    return package


def _files(root: Path) -> dict[str, str]:
    return {
        str(path.relative_to(root)): path.read_text(encoding="utf-8")
        for path in sorted(root.rglob("*"))
        if path.is_file() and ".git" not in path.relative_to(root).parts
    }


def test_local_edits_and_untracked_files_do_not_reach_the_copy(
    clones: ModuleType, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    checkout = tmp_path / "checkout"
    package = _package(checkout / "first-skill")
    _git(checkout, "init", "-q")
    _git(checkout, "add", ".")
    _git(checkout, "commit", "-q", "-m", "start")
    (package / "notes.py").write_text('__version__ = "0.4.0"\n', encoding="utf-8")
    (package / "left-over.txt").write_text("from a run in place\n", encoding="utf-8")
    (package / "__pycache__").mkdir()
    (package / "__pycache__" / "notes.pyc").write_text("cache\n", encoding="utf-8")
    monkeypatch.setattr(clones, "PACKAGE", package)

    repo = clones.clean_clone(tmp_path / "out")

    assert _files(repo.path) == {"notes.py": '__version__ = "0.3.0"\n', "sub/run.sh": "#!/bin/sh\n"}
    assert os.access(repo.path / "sub" / "run.sh", os.X_OK)


def test_a_package_outside_a_git_checkout_is_copied_as_it_is(
    clones: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    package = _package(tmp_path / "download")
    (package / "__pycache__").mkdir()
    (package / "__pycache__" / "notes.pyc").write_text("cache\n", encoding="utf-8")
    monkeypatch.setattr(clones, "PACKAGE", package)

    repo = clones.clean_clone(tmp_path / "out")

    assert _files(repo.path) == {"notes.py": '__version__ = "0.3.0"\n', "sub/run.sh": "#!/bin/sh\n"}
    assert "is not committed in a git checkout" in capsys.readouterr().err


def test_the_course_package_is_copied_from_git(clones: ModuleType, tmp_path: Path) -> None:
    home = tmp_path / "home"
    home.mkdir()
    assert clones.copy_tracked(clones.PACKAGE, tmp_path / "copy", clones.git_env(home))
    assert (tmp_path / "copy" / "release_check.py").is_file()


@pytest.mark.parametrize(
    ("fixture", "cwd_name"),
    [("testing-a-skill/tag_placement.py", "author"), ("first-skill/check.py", "fixture-package")],
)
def test_pythonpath_in_the_shell_does_not_reach_the_release_check(
    fixture: str, cwd_name: str, tmp_path: Path
) -> None:
    # sitecustomize runs at every interpreter start on PYTHONPATH. It prints
    # only inside the package copy, so it shows up in the output only when
    # the release check inherits the caller's environment.
    site = tmp_path / "site"
    site.mkdir()
    (site / "sitecustomize.py").write_text(
        f"import os\nif os.path.basename(os.getcwd()) == {cwd_name!r}:\n    print('LEAK')\n",
        encoding="utf-8",
    )
    path = EXAMPLES / fixture

    def run(env: dict[str, str]) -> str:
        return subprocess.run(
            [sys.executable, str(path)],
            cwd=path.parent,
            env=env,
            capture_output=True,
            text=True,
            check=True,
        ).stdout

    clean = run(dict(os.environ))
    hostile = run(dict(os.environ, PYTHONPATH=str(site)))
    assert "LEAK" not in hostile
    assert hostile == clean
