"""Tests for scripts/vale_linebreaks.py (issue #371).

The unit tests run on inline rule text. The Vale tests run the `vale`
binary pinned in .mise.toml on the real rules: the House copies as
committed, and the synced ai-tells rules copied to a temporary styles
directory and widened there, so they don't depend on whether the local
sync was widened yet. The synced packages must be under .vale/styles/:
`mise run setup` fetches them, and CI runs `prose-sync` before `py-test`.
"""

import pathlib
import shutil
import subprocess

import pytest
import vale_linebreaks

import prose_eval

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
STYLES = REPO_ROOT / ".vale" / "styles"
HOUSE = STYLES / "House"


def test_widen_pattern_replaces_each_space_and_keeps_other_escapes() -> None:
    assert vale_linebreaks.widen_pattern(r"\bfor the [^.]+\. It") == r"\bfor\sthe\s[^.]+\.\sIt"
    assert vale_linebreaks.widen_pattern(r"a\ b\\c") == r"a\sb\\c"
    assert vale_linebreaks.widen_pattern(r"dead[- ]end") == r"dead[-\s]end"
    assert vale_linebreaks.widen_pattern("trailing\\") == "trailing\\"


def test_widen_scalar_keeps_the_quoting_and_the_comment() -> None:
    assert (
        vale_linebreaks.widen_scalar('"\\\\bNo [^.]+\\" x" # c d', "f")
        == '"\\\\bNo\\\\s[^.]+\\"\\\\sx" # c d'
    )
    assert vale_linebreaks.widen_scalar("'it''s a b' # c d", "f") == "'it''s\\sa\\sb' # c d"
    assert vale_linebreaks.widen_scalar("in order to # c d", "f") == "in\\sorder\\sto # c d"
    assert vale_linebreaks.widen_scalar("'a b': c d", "f") == "'a\\sb': c d"


@pytest.mark.parametrize(
    ("text", "message"),
    [
        ('"a\\tb"', "unsupported escape"),
        ('"a b', "unterminated double-quoted"),
        ("'a b", "unterminated single-quoted"),
        ("|", "unsupported YAML scalar"),
    ],
)
def test_widen_scalar_rejects_what_it_cannot_read(text: str, message: str) -> None:
    with pytest.raises(vale_linebreaks.RuleFormatError, match=message):
        vale_linebreaks.widen_scalar(text, "rule.yml:3")


EXISTENCE = """\
---
extends: existence
message: "Found '%s'. Say it plainly."
level: error
tokens:
  # A comment with spaces stays.
  - "\\\\bfor the [^.]+"

  - 'no more'
  - plain words # a comment
exceptions:
  - in order
action:
  name: replace
"""

EXISTENCE_WIDENED = """\
---
extends: existence
message: "Found '%s'. Say it plainly."
level: error
tokens:
  # A comment with spaces stays.
  - "\\\\bfor\\\\sthe\\\\s[^.]+"

  - 'no\\smore'
  - plain\\swords # a comment
exceptions:
  - in\\sorder
action:
  name: replace
"""

SUBSTITUTION = """\
extends: substitution
message: "Use '%s' over '%s'."
swap:
  cell phone: mobile phone
  '(?:ok|Okay) then': OK then
  "e mail": email
"""


def test_widen_rule_rewrites_the_pattern_blocks_of_an_existence_rule() -> None:
    assert vale_linebreaks.widen_rule(EXISTENCE) == EXISTENCE_WIDENED
    assert vale_linebreaks.widen_rule(EXISTENCE_WIDENED) == EXISTENCE_WIDENED


def test_widen_rule_rewrites_swap_keys_and_never_the_replacements() -> None:
    assert vale_linebreaks.widen_rule(SUBSTITUTION) == (
        "extends: substitution\n"
        "message: \"Use '%s' over '%s'.\"\n"
        "swap:\n"
        "  cell\\sphone: mobile phone\n"
        "  '(?:ok|Okay)\\sthen': OK then\n"
        '  "e\\\\smail": email\n'
    )


def test_widen_rule_reads_a_list_item_with_more_than_one_space_after_the_dash() -> None:
    text = 'extends: existence\ntokens:\n  -   "foo bar"\n-\tin order\n'
    assert vale_linebreaks.widen_rule(text) == (
        'extends: existence\ntokens:\n  -   "foo\\\\sbar"\n-\tin\\sorder\n'
    )


def test_widen_scalar_keeps_the_trailing_whitespace_of_a_plain_scalar_unwidened() -> None:
    assert vale_linebreaks.widen_scalar("in order  ", "f") == "in\\sorder  "
    assert vale_linebreaks.widen_scalar("in order \t# a comment", "f") == "in\\sorder \t# a comment"


def test_widen_rule_leaves_other_rule_types_alone() -> None:
    sequence = "extends: sequence\nmessage: x\ntokens:\n  - tag: JJ\n    pattern: a b\n"
    assert vale_linebreaks.widen_rule(sequence) == sequence


@pytest.mark.parametrize(
    ("text", "message"),
    [
        ("extends: existence\ntokens: [a b]\n", "written inline"),
        ("extends: existence\ntokens:\n  a b\n", "list item"),
        ("extends: substitution\nswap:\n  - a b\n", "'pattern: replacement' line"),
    ],
)
def test_widen_rule_names_the_line_it_cannot_read(text: str, message: str) -> None:
    with pytest.raises(vale_linebreaks.RuleFormatError, match=rf"rule\.yml:\d: .*{message}"):
        vale_linebreaks.widen_rule(text, "rule.yml")


def test_run_widens_the_pinned_packages_only(tmp_path: pathlib.Path) -> None:
    ini = tmp_path / "vale.ini"
    ini.write_text("Packages = https://example.test/Pkg.zip, https://example.test/Missing.zip\n")
    for name in ("Pkg", "Other"):
        (tmp_path / name).mkdir()
        (tmp_path / name / "Rule.yml").write_text(EXISTENCE)
    (tmp_path / "Pkg" / "Clean.yml").write_text(EXISTENCE_WIDENED)
    assert vale_linebreaks.run([ini, ini], tmp_path) == [tmp_path / "Pkg" / "Rule.yml"]
    assert (tmp_path / "Pkg" / "Rule.yml").read_text() == EXISTENCE_WIDENED
    assert (tmp_path / "Other" / "Rule.yml").read_text() == EXISTENCE
    assert vale_linebreaks.run([ini], tmp_path) == []


def test_main_reports_the_count_and_a_format_error(
    tmp_path: pathlib.Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    ini = tmp_path / "vale.ini"
    ini.write_text("Packages = https://example.test/Pkg.zip\n")
    (tmp_path / "Pkg").mkdir()
    (tmp_path / "Pkg" / "Rule.yml").write_text(EXISTENCE)
    monkeypatch.setattr(vale_linebreaks, "STYLES", tmp_path)
    assert vale_linebreaks.main([str(ini)]) == 0
    assert "widened 1 rule files" in capsys.readouterr().out
    assert vale_linebreaks.main([str(ini)]) == 0
    assert capsys.readouterr().out == ""
    (tmp_path / "Pkg" / "Bad.yml").write_text("extends: existence\ntokens: [a b]\n")
    with pytest.raises(SystemExit, match="written inline"):
        vale_linebreaks.main([str(ini)])
    with pytest.raises(SystemExit, match="Usage"):
        vale_linebreaks.main([])


def test_main_reports_a_bare_package_name_without_a_traceback(tmp_path: pathlib.Path) -> None:
    ini = tmp_path / "vale.ini"
    ini.write_text("Packages = Google\n")
    with pytest.raises(SystemExit, match=r"Packages entry 'Google' is not a \.zip URL"):
        vale_linebreaks.main([str(ini)])


# House.VerbTricolon keeps its literal spaces until the maintainer decides
# what to do about the noun lists it flags once it matches across a line
# break (issue #441). Strict, so widening the rule fails here until the
# marker goes.
VERB_TRICOLON_PENDING = pytest.mark.xfail(
    strict=True, reason="House.VerbTricolon is not widened yet (issue #441)"
)


def _house_rule(rule: pathlib.Path) -> object:
    marks = [VERB_TRICOLON_PENDING] if rule.name == "VerbTricolon.yml" else []
    return pytest.param(rule, id=rule.name, marks=marks)


@pytest.mark.parametrize("rule", [_house_rule(rule) for rule in sorted(HOUSE.glob("*.yml"))])
def test_house_rules_have_no_literal_space_in_a_pattern(rule: pathlib.Path) -> None:
    text = rule.read_text(encoding="utf-8")
    assert vale_linebreaks.widen_rule(text, str(rule)) == text


def _synced_rules() -> list[pathlib.Path]:
    configs = [REPO_ROOT / ".vale.ini", REPO_ROOT / ".vale-extended.ini"]
    dirs = vale_linebreaks.package_dirs(configs, STYLES)
    return sorted(rule for directory in dirs for rule in directory.glob("*.yml"))


def test_every_synced_rule_can_be_widened() -> None:
    rules = _synced_rules()
    assert rules, "no synced Vale packages under .vale/styles/: run 'mise run setup'"
    for rule in rules:
        widened = vale_linebreaks.widen_rule(rule.read_text(encoding="utf-8"), str(rule))
        assert vale_linebreaks.widen_rule(widened, str(rule)) == widened


# Each case: the rule, and a hit in which one of the rule's literal spaces
# falls on a line break. The first is the paragraph from issue #371.
ISSUE_371 = (
    "Then it asks for the case against it, for the questions left open, and\n"
    "for what each option costs."
)
SPLIT_HITS = {
    "ai-tells.StackedAnaphora": ISSUE_371,
    "ai-tells.MotionMetaphors": "The config then drives\nthe build on every push.",
    "House.VerbTricolon": ISSUE_371,
    "House.Transitions": "The run failed. In\naddition, the log was empty.",
    "House.Idioms": "The second run came at a\nprice for the team.",
}


def _split_case(rule: str) -> object:
    marks = [VERB_TRICOLON_PENDING] if rule == "House.VerbTricolon" else []
    return pytest.param(rule, id=rule, marks=marks)


def _vale(tmp_path: pathlib.Path, rule: str, text: str) -> list[str]:
    """The checks that fire on `text` with only `rule` on, at error.

    A package rule is widened the way `prose-sync` widens it. A House rule
    is used as committed.
    """
    style, name = rule.split(".")
    styles = tmp_path / "styles"
    (styles / style).mkdir(parents=True, exist_ok=True)
    source = STYLES / style / f"{name}.yml"
    assert source.is_file(), f"{source} is missing: run 'mise run setup'"
    target = styles / style / f"{name}.yml"
    shutil.copy(source, target)
    if style != "House":
        target.write_text(
            vale_linebreaks.widen_rule(target.read_text(encoding="utf-8"), str(target))
        )
    (tmp_path / ".vale.ini").write_text(
        f"StylesPath = styles\nMinAlertLevel = suggestion\n[*.md]\n{rule} = error\n"
    )
    page = tmp_path / "page.md"
    page.write_text(text + "\n")
    out = subprocess.run(
        ["vale", "--no-exit", "--output=JSON", "--config", str(tmp_path / ".vale.ini"), str(page)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    hits = prose_eval.parse_hits(out)
    return [alert["Check"] for alerts in hits.values() for alert in alerts]


@pytest.mark.parametrize("rule", [_split_case(rule) for rule in SPLIT_HITS])
def test_rule_fires_on_a_hit_split_over_two_lines(tmp_path: pathlib.Path, rule: str) -> None:
    assert "\n" in SPLIT_HITS[rule]
    assert rule in _vale(tmp_path, rule, SPLIT_HITS[rule])


# The same hits on one line. House.VerbTricolon fires there already.
@pytest.mark.parametrize("rule", SPLIT_HITS)
def test_rule_fires_on_the_same_hit_on_one_line(tmp_path: pathlib.Path, rule: str) -> None:
    text = SPLIT_HITS[rule]
    assert rule in _vale(tmp_path, rule, text.replace("\n", " "))


def test_an_unwidened_rule_misses_the_split_hit(tmp_path: pathlib.Path) -> None:
    """Why the script exists: Vale keeps the line break, and a literal space doesn't match it."""
    styles = tmp_path / "styles" / "T"
    styles.mkdir(parents=True)
    (styles / "Rule.yml").write_text(
        EXISTENCE.replace("level: error\n", "level: error\nnonword: true\n")
    )
    (tmp_path / ".vale.ini").write_text("StylesPath = styles\n[*.md]\nBasedOnStyles = T\n")
    page = tmp_path / "page.md"

    def fires(text: str) -> bool:
        page.write_text(text)
        result = subprocess.run(
            ["vale", "--output=line", "--config", str(tmp_path / ".vale.ini"), str(page)],
            capture_output=True,
            text=True,
        )
        return "T.Rule" in result.stdout

    assert fires("It says no more than that.\n")
    assert not fires("It says no\nmore than that.\n")
    (styles / "Rule.yml").write_text(vale_linebreaks.widen_rule((styles / "Rule.yml").read_text()))
    assert fires("It says no\nmore than that.\n")
