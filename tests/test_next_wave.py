"""Tests for scripts/next_wave.py, ported case by case from the Vitest tests
of the JavaScript tool it replaces (#492), plus tests of the command line
that runs `bun scripts/lesson-plan.mjs` and `gh`.

The one case about reading the course order from a course's `parts` moved
to site/tests/scripts/lesson-plan.test.ts, since lesson-plan computes the
course position now.
"""

import io
import json
import subprocess
from collections.abc import Sequence
from typing import NotRequired, TypedDict, cast

import next_wave as nw
import pytest
from next_wave import (
    NITS_TITLE,
    NOT_IN_ONLY,
    LessonsWave,
    PlannedLesson,
    ReadyIssue,
    WaveEntry,
    format_wave,
    parse_args,
    pick_wave,
)


class Lesson(TypedDict):
    id: str
    title: NotRequired[str]
    issue: NotRequired[int]
    serves: NotRequired[list[str]]
    assumes: NotRequired[list[str]]
    after: NotRequired[list[str]]


class Area(TypedDict):
    dir: str
    course: list[str]
    lessons: list[Lesson]


def plan(areas: Sequence[Area], live: Sequence[str] = ()) -> list[PlannedLesson]:
    """The lessons as lesson-plan prints them, with one course per area listing `course`."""
    out: list[PlannedLesson] = []
    for a in areas:
        for lesson in a["lessons"]:
            lesson_id = lesson["id"]
            position = a["course"].index(lesson_id) + 1 if lesson_id in a["course"] else None
            out.append(
                {
                    "id": lesson_id,
                    "area": a["dir"],
                    "title": lesson.get("title"),
                    "issue": lesson.get("issue"),
                    "position": position,
                    "after": lesson.get("after", []),
                    "assumes": lesson.get("assumes", []),
                    "serves": lesson.get("serves", []),
                    "live": lesson_id in live,
                }
            )
    return out


def issue(number: int, assignees: Sequence[str] = (), labels: Sequence[str] = ()) -> ReadyIssue:
    return {
        "number": number,
        "title": f"Lesson #{number}",
        "assignees": list(assignees),
        "labels": list(labels),
    }


# The typed pickers behind `pick_wave`, for the tests that read one kind's fields.
lessons_wave = nw.pick_lessons_wave
content_wave = nw.pick_content_wave


def ids(entries: Sequence[object]) -> list[str]:
    return [cast("dict[str, str]", e)["id"] for e in entries]


# pickWave


def test_picks_planned_lessons_in_course_order_and_reports_the_course_position() -> None:
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/one", "a/two", "a/three"],
                "lessons": [
                    {"id": "a/three", "title": "Three", "issue": 3},
                    {"id": "a/one", "title": "One"},
                    {"id": "a/two", "title": "Two", "issue": 2},
                ],
            }
        ],
        live=["a/one"],
    )
    r = pick_wave(lessons, [issue(2), issue(3)], size=6)
    assert r == {
        "kind": "lessons",
        "size": 6,
        "only": None,
        "unblockersFirst": False,
        "wave": [
            {
                "issue": 2,
                "id": "a/two",
                "title": "Two",
                "area": "a",
                "position": 2,
                "afterPlanned": [],
                "unblocks": 0,
            },
            {
                "issue": 3,
                "id": "a/three",
                "title": "Three",
                "area": "a",
                "position": 3,
                "afterPlanned": [],
                "unblocks": 0,
            },
        ],
        "blocked": [],
        "skipped": [],
        "waiting": [],
        "notPicked": [],
    }


def test_leaves_out_a_lesson_that_already_has_a_page_even_when_its_issue_is_ready() -> None:
    lessons = plan(
        [{"dir": "a", "course": ["a/one"], "lessons": [{"id": "a/one", "issue": 1}]}],
        live=["a/one"],
    )
    r = pick_wave(lessons, [issue(1)], size=6)
    assert r == {
        "kind": "lessons",
        "size": 6,
        "only": None,
        "unblockersFirst": False,
        "wave": [],
        "blocked": [],
        "skipped": [],
        "waiting": [],
        "notPicked": [],
    }


def test_blocks_a_lesson_that_assumes_an_objective_only_a_planned_lesson_serves() -> None:
    # lesson-plan drops the `lesson` and `section` of an assumes entry and
    # keeps the objective, so the planted duplicate is a repeated objective.
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/one", "a/two", "a/three"],
                "lessons": [
                    {"id": "a/one", "serves": ["a/c/o1"]},
                    {"id": "a/two", "issue": 2, "serves": ["a/c/o2"]},
                    {"id": "a/three", "issue": 3, "assumes": ["a/c/o1", "a/c/o2", "a/c/o2"]},
                ],
            }
        ],
        live=["a/one"],
    )
    r = lessons_wave(lessons, [issue(2), issue(3)], size=6)
    assert ids(r["wave"]) == ["a/two"]
    assert r["blocked"] == [
        {"issue": 3, "id": "a/three", "blockedBy": [{"objective": "a/c/o2", "servedBy": ["a/two"]}]}
    ]


def test_does_not_block_a_lesson_whose_assumed_objective_a_live_lesson_serves_elsewhere() -> None:
    lessons = plan(
        [
            {"dir": "a", "course": ["a/one"], "lessons": [{"id": "a/one", "serves": ["a/c/o1"]}]},
            {
                "dir": "b",
                "course": ["b/one"],
                "lessons": [{"id": "b/one", "issue": 1, "assumes": ["a/c/o1"]}],
            },
        ],
        live=["a/one"],
    )
    r = lessons_wave(lessons, [issue(1)], size=6)
    assert ids(r["wave"]) == ["b/one"]
    assert r["blocked"] == []


def test_blocks_a_lesson_whose_assumed_objective_no_lesson_serves_and_says_so() -> None:
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/one"],
                "lessons": [{"id": "a/one", "issue": 1, "assumes": ["x/y/z"]}],
            }
        ]
    )
    r = lessons_wave(lessons, [issue(1)], size=6)
    assert r["wave"] == []
    assert r["blocked"] == [
        {"issue": 1, "id": "a/one", "blockedBy": [{"objective": "x/y/z", "servedBy": []}]}
    ]


def three_areas() -> list[PlannedLesson]:
    return plan(
        [
            {
                "dir": "a",
                "course": ["a/1", "a/2", "a/3"],
                "lessons": [
                    {"id": "a/1", "issue": 11},
                    {"id": "a/2", "issue": 12},
                    {"id": "a/3", "issue": 13},
                ],
            },
            {
                "dir": "b",
                "course": ["b/1", "b/2"],
                "lessons": [{"id": "b/1", "issue": 21}, {"id": "b/2", "issue": 22}],
            },
            {"dir": "c", "course": ["c/1"], "lessons": [{"id": "c/1", "issue": 31}]},
        ]
    )


def test_takes_lessons_round_robin_across_areas_in_area_order() -> None:
    ready = [issue(n) for n in [11, 12, 13, 21, 22, 31]]
    r = lessons_wave(three_areas(), ready, size=10)
    assert ids(r["wave"]) == ["a/1", "b/1", "c/1", "a/2", "b/2", "a/3"]
    assert r["waiting"] == []


def test_caps_the_wave_at_size_and_reports_the_rest_as_waiting_grouped_by_area() -> None:
    lessons = [lesson for lesson in three_areas() if lesson["area"] != "c"]
    ready = [issue(n) for n in [11, 12, 13, 21, 22]]
    r = lessons_wave(lessons, ready, size=3)
    assert ids(r["wave"]) == ["a/1", "b/1", "a/2"]
    assert r["skipped"] == []
    assert [(w["area"], ids(w["lessons"])) for w in r["waiting"]] == [
        ("a", ["a/3"]),
        ("b", ["b/2"]),
    ]


def test_defaults_the_size_to_six() -> None:
    planted: list[Lesson] = [{"id": f"a/{i}", "issue": i + 1} for i in range(8)]
    lessons = plan([{"dir": "a", "course": [x["id"] for x in planted], "lessons": planted}])
    r = lessons_wave(lessons, [issue(i + 1) for i in range(8)])
    assert r["size"] == 6
    assert len(r["wave"]) == 6
    assert [ids(w["lessons"]) for w in r["waiting"]] == [["a/6", "a/7"]]


def one_to_three() -> list[PlannedLesson]:
    return plan(
        [
            {
                "dir": "a",
                "course": ["a/1", "a/2", "a/3"],
                "lessons": [
                    {"id": "a/1", "issue": 1},
                    {"id": "a/2", "issue": 2},
                    {"id": "a/3", "issue": 3},
                ],
            }
        ]
    )


def test_skips_an_assigned_issue_and_an_issue_that_is_not_ready_and_says_why() -> None:
    r = lessons_wave(one_to_three(), [issue(1), issue(2, ["someone"])], size=6)
    assert ids(r["wave"]) == ["a/1"]
    assert r["skipped"] == [
        {"issue": 2, "id": "a/2", "reason": "issue is assigned to someone"},
        {"issue": 3, "id": "a/3", "reason": "issue is not ready-for-agent"},
    ]


def test_reports_planned_after_entries_and_picks_lessons_without_them_first() -> None:
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/live", "a/1", "a/2", "a/3"],
                "lessons": [
                    {"id": "a/live"},
                    {"id": "a/1", "issue": 1, "after": ["a/live", "a/3"]},
                    {"id": "a/2", "issue": 2, "after": ["a/live"]},
                    {"id": "a/3", "issue": 3},
                ],
            }
        ],
        live=["a/live"],
    )
    r = lessons_wave(lessons, [issue(1), issue(2), issue(3)], size=6)
    assert ids(r["wave"]) == ["a/2", "a/3", "a/1"]
    assert [w["afterPlanned"] for w in r["wave"]] == [[], [], ["a/3"]]


def test_falls_back_to_the_issue_title_and_sorts_an_unlisted_lesson_last() -> None:
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/2"],
                "lessons": [{"id": "a/1", "issue": 1}, {"id": "a/2", "issue": 2}],
            }
        ]
    )
    r = lessons_wave(lessons, [issue(1), issue(2)], size=6)
    assert [(w["id"], w["title"], w["position"]) for w in r["wave"]] == [
        ("a/2", "Lesson #2", 1),
        ("a/1", "Lesson #1", None),
    ]


def test_keeps_an_empty_lesson_title_as_javascripts_nullish_fallback_did() -> None:
    lessons = plan([{"dir": "a", "course": ["a/1"], "lessons": [{"id": "a/1", "issue": 1}]}])
    lessons[0]["title"] = ""
    r = lessons_wave(lessons, [issue(1)])
    assert r["wave"][0]["title"] == ""


def test_rejects_an_unknown_kind() -> None:
    with pytest.raises(ValueError, match="unknown kind"):
        pick_wave([], [], kind="nope")


def test_with_only_skips_every_planned_lesson_outside_the_whitelist_before_the_ready_check() -> (
    None
):
    r = lessons_wave(one_to_three(), [issue(1), issue(2)], only=[2], size=6)
    assert ids(r["wave"]) == ["a/2"]
    assert r["only"] == [2]
    assert r["notPicked"] == []
    assert r["skipped"] == [
        {"issue": 1, "id": "a/1", "reason": NOT_IN_ONLY},
        {"issue": 3, "id": "a/3", "reason": NOT_IN_ONLY},
    ]


def test_with_only_reports_every_listed_number_that_is_not_in_the_wave_with_a_reason() -> None:
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/live", "a/1", "a/2", "a/3", "a/4", "a/5", "a/6"],
                "lessons": [
                    {"id": "a/live", "issue": 9, "serves": ["a/c/o1"]},
                    {"id": "a/1", "issue": 1},
                    {"id": "a/2", "issue": 2},
                    {"id": "a/3", "issue": 3},
                    {"id": "a/4", "issue": 4, "assumes": ["a/c/o2"]},
                    {"id": "a/5", "issue": 5, "serves": ["a/c/o2"]},
                    {"id": "a/6", "issue": 6, "assumes": ["x/y/z"]},
                ],
            }
        ],
        live=["a/live"],
    )
    ready = [issue(1), issue(3, ["someone"]), issue(4), issue(5), issue(6), issue(50)]
    r = lessons_wave(
        lessons,
        ready,
        open_issues=[1, 2, 3, 4, 5, 6, 9, 50, 51],
        only=[1, 2, 3, 4, 5, 6, 9, 50, 51, 999],
        size=1,
    )
    assert ids(r["wave"]) == ["a/1"]
    assert r["notPicked"] == [
        {"issue": 2, "reason": "not ready-for-agent"},
        {"issue": 3, "reason": "assigned"},
        {"issue": 4, "reason": "blocked by a/5"},
        {"issue": 5, "reason": "waiting (wave full)"},
        {"issue": 6, "reason": "blocked by objective x/y/z (no lesson serves it)"},
        {"issue": 9, "reason": "lesson a/live is live"},
        {"issue": 50, "reason": "not a planned lesson (use --kind content)"},
        {"issue": 51, "reason": "not a planned lesson (use --kind content)"},
        {"issue": 999, "reason": "no such open issue"},
    ]


# unblocks. Course order puts `a/first` before the two unblockers. `a/loop`
# serves the missing objective of three blocked lessons (one in another
# area), `a/memory` serves two. `b/blocked-three` also assumes an objective
# no lesson serves, and still counts once for `a/loop`.


def unblock_plan() -> list[PlannedLesson]:
    return plan(
        [
            {
                "dir": "a",
                "course": [
                    "a/first",
                    "a/loop",
                    "a/memory",
                    "a/blocked-one",
                    "a/blocked-two",
                    "a/both",
                ],
                "lessons": [
                    {"id": "a/first", "issue": 1},
                    {"id": "a/loop", "issue": 2, "serves": ["a/c/loop"]},
                    {"id": "a/memory", "issue": 3, "serves": ["a/c/memory"]},
                    {"id": "a/blocked-one", "issue": 4, "assumes": ["a/c/loop"]},
                    {"id": "a/blocked-two", "issue": 5, "assumes": ["a/c/loop", "a/c/memory"]},
                    {"id": "a/both", "issue": 6, "assumes": ["a/c/memory"]},
                ],
            },
            {
                "dir": "b",
                "course": ["b/blocked-three"],
                "lessons": [
                    {"id": "b/blocked-three", "issue": 7, "assumes": ["a/c/loop", "x/y/z"]}
                ],
            },
        ]
    )


UNBLOCK_READY = [issue(n) for n in range(1, 8)]

# Without `a/blocked-one`, `a/loop` unblocks `a/blocked-two` and
# `b/blocked-three`, and `a/memory` unblocks `a/blocked-two` and `a/both`.
# `a/blocked-two` assumes both objectives and counts once for each.
WITHOUT_BLOCKED_ONE = [("a/loop", 2), ("a/memory", 2), ("a/first", 0)]


def test_unblocks_counts_the_blocked_candidates_and_keeps_course_order_without_the_flag() -> None:
    r = lessons_wave(unblock_plan(), UNBLOCK_READY, size=6)
    assert r["unblockersFirst"] is False
    assert [(w["id"], w["unblocks"]) for w in r["wave"]] == [
        ("a/first", 0),
        ("a/loop", 3),
        ("a/memory", 2),
    ]
    assert [b["id"] for b in r["blocked"]] == [
        "a/blocked-one",
        "a/blocked-two",
        "a/both",
        "b/blocked-three",
    ]


def test_unblocks_with_the_flag_sorts_by_the_count_and_puts_the_top_unblocker_first() -> None:
    r = lessons_wave(unblock_plan(), UNBLOCK_READY, size=1, unblockers_first=True)
    assert r["unblockersFirst"] is True
    assert [(w["id"], w["unblocks"]) for w in r["wave"]] == [("a/loop", 3)]
    assert [(w["area"], ids(w["lessons"])) for w in r["waiting"]] == [
        ("a", ["a/memory", "a/first"])
    ]


def test_unblocks_does_not_count_an_assigned_blocked_lesson_or_a_lesson_twice() -> None:
    # #4 is assigned, so `a/blocked-one` is not a blocked candidate.
    with_skip = [issue(1), issue(2), issue(3), issue(4, ["someone"]), issue(5), issue(6), issue(7)]
    r = lessons_wave(unblock_plan(), with_skip, size=6, unblockers_first=True)
    assert [(s.get("id"), s["reason"]) for s in r["skipped"]] == [
        ("a/blocked-one", "issue is assigned to someone")
    ]
    assert [(w["id"], w["unblocks"]) for w in r["wave"]] == WITHOUT_BLOCKED_ONE


def test_unblocks_does_not_count_a_blocked_lesson_whose_issue_is_not_ready() -> None:
    # #4 is not in the ready list, so `a/blocked-one` is not a blocked candidate.
    without_four = [issue(n) for n in [1, 2, 3, 5, 6, 7]]
    r = lessons_wave(unblock_plan(), without_four, size=6, unblockers_first=True)
    assert [(s.get("id"), s["reason"]) for s in r["skipped"]] == [
        ("a/blocked-one", "issue is not ready-for-agent")
    ]
    assert [(w["id"], w["unblocks"]) for w in r["wave"]] == WITHOUT_BLOCKED_ONE


def test_unblocks_does_not_count_a_blocked_lesson_outside_only() -> None:
    # #4 is ready but not in `only`, so `a/blocked-one` is not a blocked candidate.
    r = lessons_wave(
        unblock_plan(), UNBLOCK_READY, size=6, only=[1, 2, 3, 5, 6, 7], unblockers_first=True
    )
    assert [(s.get("id"), s["reason"]) for s in r["skipped"]] == [("a/blocked-one", NOT_IN_ONLY)]
    assert [(w["id"], w["unblocks"]) for w in r["wave"]] == WITHOUT_BLOCKED_ONE


def test_unblocks_keeps_the_after_rule_ahead_of_the_count_and_breaks_a_tie_by_position() -> None:
    # `a/2` unblocks the most but its own planned `after` is not live, so it
    # waits behind the two with none. Those two tie at one and keep course order.
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/1", "a/2", "a/3", "a/4", "a/5"],
                "lessons": [
                    {"id": "a/1", "issue": 1, "serves": ["a/c/o1"]},
                    {"id": "a/2", "issue": 2, "serves": ["a/c/o1", "a/c/o2"], "after": ["a/3"]},
                    {"id": "a/3", "issue": 3, "serves": ["a/c/o1"]},
                    {"id": "a/4", "issue": 4, "assumes": ["a/c/o1"]},
                    {"id": "a/5", "issue": 5, "assumes": ["a/c/o2"]},
                ],
            }
        ]
    )
    r = lessons_wave(lessons, [issue(n) for n in range(1, 6)], unblockers_first=True)
    assert [(w["id"], w["unblocks"], w["afterPlanned"]) for w in r["wave"]] == [
        ("a/1", 1, []),
        ("a/3", 1, []),
        ("a/2", 2, ["a/3"]),
    ]


def test_unblocks_with_the_flag_and_no_blocked_lesson_the_order_is_the_course_order() -> None:
    lessons = plan(
        [
            {
                "dir": "a",
                "course": ["a/1", "a/2"],
                "lessons": [
                    {"id": "a/1", "issue": 1},
                    {"id": "a/2", "issue": 2, "serves": ["a/c/o1"]},
                ],
            }
        ]
    )
    r = lessons_wave(lessons, [issue(1), issue(2)], unblockers_first=True)
    assert [(w["id"], w["unblocks"]) for w in r["wave"]] == [("a/1", 0), ("a/2", 0)]


def test_without_open_issues_treats_the_ready_issues_as_the_open_set() -> None:
    lessons = plan([{"dir": "a", "course": ["a/1"], "lessons": [{"id": "a/1", "issue": 1}]}])
    r = lessons_wave(lessons, [issue(1), issue(2)], only=[1, 2, 3])
    assert r["notPicked"] == [
        {"issue": 2, "reason": "not a planned lesson (use --kind content)"},
        {"issue": 3, "reason": "no such open issue"},
    ]


# pickWave with kind content


def plan_lessons() -> list[PlannedLesson]:
    return plan(
        [
            {
                "dir": "a",
                "course": ["a/1", "a/2", "a/live"],
                "lessons": [
                    {"id": "a/1", "issue": 10},
                    {"id": "a/2", "issue": 20},
                    {"id": "a/live"},
                ],
            }
        ]
    )


def titled(number: int, title: str, labels: Sequence[str] = ("content",)) -> ReadyIssue:
    return {"number": number, "title": title, "assignees": [], "labels": list(labels)}


def test_content_picks_ready_content_issues_by_number_leaving_out_planned_lessons() -> None:
    ready = [
        issue(30, [], ["content", "ready-for-agent"]),
        issue(20, [], ["content", "ready-for-agent"]),
        issue(5, [], ["content"]),
        issue(7, [], ["code"]),
        issue(8),
    ]
    r = pick_wave(plan_lessons(), ready, kind="content", size=6)
    assert r == {
        "kind": "content",
        "size": 6,
        "only": None,
        "wave": [
            {"issue": 5, "title": "Lesson #5", "labels": ["content"]},
            {"issue": 30, "title": "Lesson #30", "labels": ["content", "ready-for-agent"]},
        ],
        "skipped": [],
        "waiting": [],
        "notPicked": [],
    }


def test_content_caps_at_size_skips_assigned_issues_and_applies_only() -> None:
    ready = [issue(n, ["someone"] if n == 52 else [], ["content"]) for n in [50, 51, 52, 53]]
    r = content_wave(plan_lessons(), ready, size=1)
    assert [w["issue"] for w in r["wave"]] == [50]
    assert r["skipped"] == [{"issue": 52, "reason": "issue is assigned to someone"}]
    assert [w["issue"] for w in r["waiting"]] == [51, 53]

    o = content_wave(plan_lessons(), ready, only=[51, 53])
    assert [w["issue"] for w in o["wave"]] == [51, 53]
    assert o["notPicked"] == []
    assert o["skipped"] == [
        {"issue": 50, "reason": NOT_IN_ONLY},
        {"issue": 52, "reason": NOT_IN_ONLY},
    ]


def test_content_leaves_out_a_nits_issue_by_title() -> None:
    ready = [
        titled(60, "Cosmetic nits left open on wave 8 branches"),
        titled(61, "Nits: three typos"),
        titled(62, "Nitpicks are not nits"),
    ]
    r = content_wave(plan_lessons(), ready)
    assert [w["issue"] for w in r["wave"]] == [62]
    assert NITS_TITLE.match("nits in the safety course")


def test_nits_title_matches_at_the_start_with_an_ascii_word_boundary() -> None:
    assert NITS_TITLE.match("Also nits") is None
    # JavaScript's `\b` sees `é` as a non-word character, and `/i` without
    # the `u` flag does not fold the long s (U+017F) to `s`.
    assert NITS_TITLE.match("nitsé")
    assert NITS_TITLE.match("nit\u017f") is None


def test_content_with_only_reports_every_listed_number_that_is_not_in_the_wave() -> None:
    ready = [
        issue(70, [], ["content"]),
        issue(71, [], ["content"]),
        issue(72, ["someone"], ["content"]),
        issue(73, [], ["code"]),
        issue(20, [], ["content"]),
        issue(76),
        titled(74, "Nits: two typos"),
    ]
    r = content_wave(
        plan_lessons(),
        ready,
        open_issues=[70, 71, 72, 73, 74, 75, 76, 20],
        only=[70, 71, 72, 73, 74, 75, 76, 20, 999],
        size=1,
    )
    assert [w["issue"] for w in r["wave"]] == [70]
    assert r["notPicked"] == [
        {"issue": 71, "reason": "waiting (wave full)"},
        {"issue": 72, "reason": "assigned"},
        {"issue": 73, "reason": "not a content issue"},
        {"issue": 74, "reason": "a nits issue (the dispatcher adds it as the nits row)"},
        {"issue": 75, "reason": "not ready-for-agent"},
        {"issue": 76, "reason": "not a content issue"},
        {"issue": 20, "reason": "a planned lesson (use --kind lessons)"},
        {"issue": 999, "reason": "no such open issue"},
    ]


# formatWave


def empty_lessons_wave(**fields: object) -> LessonsWave:
    wave: dict[str, object] = {
        "kind": "lessons",
        "size": 2,
        "only": None,
        "unblockersFirst": False,
        "wave": [],
        "blocked": [],
        "skipped": [],
        "waiting": [],
        "notPicked": [],
    }
    wave.update(fields)
    return cast("LessonsWave", wave)


def test_format_renders_the_wave_table_and_the_three_lists_as_markdown() -> None:
    out = format_wave(
        {
            "kind": "lessons",
            "size": 6,
            "only": None,
            "unblockersFirst": False,
            "notPicked": [],
            "wave": [
                {
                    "issue": 1,
                    "id": "a/1",
                    "title": "One",
                    "area": "a",
                    "position": 1,
                    "afterPlanned": [],
                    "unblocks": 0,
                },
                {
                    "issue": 2,
                    "id": "a/2",
                    "title": "Two",
                    "area": "a",
                    "position": None,
                    "afterPlanned": ["a/3", "a/4"],
                    "unblocks": 0,
                },
            ],
            "blocked": [
                {
                    "issue": 3,
                    "id": "b/3",
                    "blockedBy": [
                        {"objective": "a/c/o1", "servedBy": ["a/5", "a/6"]},
                        {"objective": "a/c/o2", "servedBy": []},
                    ],
                }
            ],
            "skipped": [{"issue": 4, "id": "b/4", "reason": "issue is assigned to someone"}],
            "waiting": [
                {
                    "area": "a",
                    "lessons": [
                        {
                            "issue": 5,
                            "id": "a/5",
                            "title": "Five",
                            "area": "a",
                            "position": 5,
                            "afterPlanned": [],
                            "unblocks": 0,
                        }
                    ],
                },
                {
                    "area": "b",
                    "lessons": [
                        {
                            "issue": 6,
                            "id": "b/6",
                            "title": "Six",
                            "area": "b",
                            "position": 1,
                            "afterPlanned": [],
                            "unblocks": 0,
                        },
                        {
                            "issue": 7,
                            "id": "b/7",
                            "title": "Seven",
                            "area": "b",
                            "position": 2,
                            "afterPlanned": [],
                            "unblocks": 0,
                        },
                    ],
                },
            ],
        }
    )
    assert out == "\n".join(
        [
            "## Wave (2 of 6)",
            "",
            "| Issue | Lesson | Course position | Planned `after` |",
            "| ----- | ------ | --------------- | --------------- |",
            "| #1 | `a/1` | a 1 | - |",
            "| #2 | `a/2` | a (unlisted) | `a/3`, `a/4` |",
            "",
            "## Blocked (1)",
            "",
            "- #3 `b/3`: assumes `a/c/o1` (served by `a/5`, `a/6`); `a/c/o2` (no lesson serves it)",
            "",
            "## Skipped (1)",
            "",
            "- #4 `b/4`: issue is assigned to someone",
            "",
            "## Waiting for a later wave (3)",
            "",
            "- a: #5",
            "- b: #6 #7",
            "",
        ]
    )


def test_format_adds_the_unblocks_column_when_unblockers_first_is_set() -> None:
    wave: list[WaveEntry] = [
        {
            "issue": 1,
            "id": "a/1",
            "title": "One",
            "area": "a",
            "position": 2,
            "afterPlanned": [],
            "unblocks": 3,
        },
        {
            "issue": 2,
            "id": "a/2",
            "title": "Two",
            "area": "a",
            "position": 1,
            "afterPlanned": ["a/3"],
            "unblocks": 0,
        },
    ]
    out = format_wave(empty_lessons_wave(size=6, unblockersFirst=True, wave=wave))
    assert (
        "\n".join(
            [
                "| Issue | Lesson | Course position | Planned `after` | Unblocks |",
                "| ----- | ------ | --------------- | --------------- | -------- |",
                "| #1 | `a/1` | a 2 | - | 3 |",
                "| #2 | `a/2` | a 1 | `a/3` | 0 |",
            ]
        )
        in out
    )


def test_format_renders_an_empty_result_with_the_headings_and_counts_only() -> None:
    out = format_wave(empty_lessons_wave())
    assert "## Wave (0 of 2)" in out
    assert "## Blocked (0)" in out
    assert "## Skipped (0)" in out
    assert "## Waiting for a later wave (0)" in out
    assert "Not picked" not in out


def test_format_adds_the_not_picked_section_whenever_only_was_given_even_when_empty() -> None:
    assert "## Not picked from --only (0)" in format_wave(empty_lessons_wave(only=[1]))
    out = format_wave(
        empty_lessons_wave(
            only=[1, 999], notPicked=[{"issue": 999, "reason": "no such open issue"}]
        )
    )
    assert "\n".join(["## Not picked from --only (1)", "", "- #999: no such open issue", ""]) in out


def test_format_groups_the_not_in_only_skips_on_one_line() -> None:
    out = format_wave(
        empty_lessons_wave(
            size=6,
            only=[2],
            notPicked=[{"issue": 2, "reason": "assigned"}],
            skipped=[
                {"issue": 1, "id": "a/1", "reason": NOT_IN_ONLY},
                {"issue": 2, "id": "a/2", "reason": "issue is assigned to someone"},
                {"issue": 3, "id": "a/3", "reason": NOT_IN_ONLY},
            ],
        )
    )
    assert (
        "\n".join(
            [
                "## Skipped (3)",
                "",
                "- not in --only: #1 #3",
                "- #2 `a/2`: issue is assigned to someone",
            ]
        )
        in out
    )


def test_format_renders_a_content_wave_as_an_issue_table_then_the_lists() -> None:
    out = format_wave(
        {
            "kind": "content",
            "size": 2,
            "only": [5, 6, 7, 8],
            "notPicked": [{"issue": 7, "reason": "assigned"}],
            "wave": [
                {"issue": 5, "title": "Fix the | table", "labels": ["content"]},
                {"issue": 6, "title": "Widget", "labels": ["content", "ready-for-agent"]},
            ],
            "skipped": [{"issue": 7, "reason": "issue is assigned to someone"}],
            "waiting": [
                {"issue": 8, "title": "Later", "labels": ["content"]},
                {"issue": 9, "title": "Later too", "labels": ["content"]},
            ],
        }
    )
    assert out == "\n".join(
        [
            "## Wave (2 of 2, content)",
            "",
            "| Issue | Title | Labels |",
            "| ----- | ----- | ------ |",
            "| #5 | Fix the \\| table | `content` |",
            "| #6 | Widget | `content`, `ready-for-agent` |",
            "",
            "## Skipped (1)",
            "",
            "- #7: issue is assigned to someone",
            "",
            "## Waiting for a later wave (2)",
            "",
            "- #8 Later",
            "- #9 Later too",
            "",
            "## Not picked from --only (1)",
            "",
            "- #7: assigned",
            "",
        ]
    )


# The command line, which the JavaScript tool had in scripts/next-wave.mjs
# without tests.


def test_parse_args_defaults() -> None:
    assert parse_args([]) == {
        "size": 6,
        "kind": "lessons",
        "only": None,
        "unblockersFirst": False,
        "json": False,
    }


def test_parse_args_reads_every_flag() -> None:
    argv = ["--size", "3", "--kind", "content", "--only", "1,22", "--unblockers-first", "--json"]
    assert parse_args(argv) == {
        "size": 3,
        "kind": "content",
        "only": [1, 22],
        "unblockersFirst": True,
        "json": True,
    }


@pytest.mark.parametrize(
    ("argv", "message"),
    [
        (["--size", "0"], 'next-wave: --size needs a positive integer, got "0"'),
        (["--size", "01"], 'next-wave: --size needs a positive integer, got "01"'),
        # Python's `$` would also match before a trailing newline.
        (["--size", "3\n"], 'next-wave: --size needs a positive integer, got "3\\n"'),
        # Python's `[0-9]` is ASCII here, and `int()` would take Arabic-Indic digits.
        (["--size", "٣"], 'next-wave: --size needs a positive integer, got "٣"'),
        (["--size"], 'next-wave: --size needs a positive integer, got ""'),
        (["--kind", "nope"], 'next-wave: --kind is lessons or content, got "nope"'),
        (["--kind"], 'next-wave: --kind is lessons or content, got ""'),
        (
            ["--only", "1,,2"],
            'next-wave: --only needs issue numbers separated by commas, got "1,,2"',
        ),
        (
            ["--only", "1,2\n"],
            'next-wave: --only needs issue numbers separated by commas, got "1,2\\n"',
        ),
        (["--only"], 'next-wave: --only needs issue numbers separated by commas, got ""'),
        (["--bogus"], "next-wave: unknown argument --bogus"),
    ],
)
def test_parse_args_names_what_is_wrong(argv: list[str], message: str) -> None:
    assert parse_args(argv) == message


class FakeCommands:
    """Stands in for subprocess.run with canned output per command."""

    def __init__(self, outputs: dict[str, str | int | OSError]) -> None:
        self.outputs = outputs
        self.calls: list[tuple[list[str], object]] = []

    def __call__(
        self, command: list[str], cwd: object = None, **_: object
    ) -> subprocess.CompletedProcess[bytes]:
        self.calls.append((command, cwd))
        out = self.outputs[" ".join(command)]
        if isinstance(out, OSError):
            raise out
        if isinstance(out, int):
            return subprocess.CompletedProcess(command, out, b"")
        return subprocess.CompletedProcess(command, 0, out.encode())


BUN = "bun scripts/lesson-plan.mjs"
GH = "gh issue list -R lsimons/ai-training -s open -L 1000 --json number,title,assignees,labels"

PLAN_JSON = json.dumps(
    {
        "lessons": [
            {
                "id": "a/1",
                "area": "a",
                "title": "Café",
                "issue": 11,
                "position": 1,
                "after": [],
                "assumes": [],
                "serves": [],
                "live": False,
            },
            {
                "id": "a/2",
                "area": "a",
                "title": None,
                "issue": 12,
                "position": None,
                "after": ["a/1"],
                "assumes": [],
                "serves": [],
                "live": False,
            },
        ]
    }
)
GH_JSON = json.dumps(
    [
        {
            "number": 11,
            "title": "Lesson 11",
            "assignees": [],
            "labels": [{"name": "ready-for-agent"}],
        },
        {
            "number": 12,
            "title": "Lesson é 12",
            "assignees": [{"login": "someone"}],
            "labels": [{"name": "ready-for-agent"}],
        },
        {"number": 13, "title": "Not ready", "assignees": [], "labels": []},
    ]
)


class Captured:
    def __init__(self, stdout: str, stderr: str) -> None:
        self.stdout = stdout
        self.stderr = stderr


def run_main(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    argv: list[str],
    outputs: dict[str, str | int | OSError],
) -> tuple[int | None, Captured, FakeCommands]:
    fake = FakeCommands(outputs)
    monkeypatch.setattr(subprocess, "run", fake)
    buffer = io.BytesIO()

    class Stdout:
        def __init__(self) -> None:
            self.buffer = buffer

    monkeypatch.setattr("sys.stdout", Stdout())
    try:
        code: int | None = nw.main(argv)
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else None
    err = capsys.readouterr().err
    return code, Captured(buffer.getvalue().decode(), err), fake


def test_main_runs_lesson_plan_in_site_and_prints_the_wave_as_markdown(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    code, out, fake = run_main(
        monkeypatch, capsys, ["--only", "11,12,13"], {BUN: PLAN_JSON, GH: GH_JSON}
    )
    assert code == 0
    assert out.stderr == ""
    assert [(" ".join(c), cwd) for c, cwd in fake.calls] == [(BUN, nw.SITE), (GH, None)]
    assert (nw.SITE / "scripts" / "lesson-plan.mjs").is_file()
    assert out.stdout == "\n".join(
        [
            "## Wave (1 of 6)",
            "",
            "| Issue | Lesson | Course position | Planned `after` |",
            "| ----- | ------ | --------------- | --------------- |",
            "| #11 | `a/1` | a 1 | - |",
            "",
            "## Blocked (0)",
            "",
            "",
            "## Skipped (1)",
            "",
            "- #12 `a/2`: issue is assigned to someone",
            "",
            "## Waiting for a later wave (0)",
            "",
            "",
            "## Not picked from --only (2)",
            "",
            "- #12: assigned",
            "- #13: not a planned lesson (use --kind content)",
            "",
        ]
    )


def test_main_prints_json_as_json_stringify_with_two_spaces_did(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    code, out, _ = run_main(
        monkeypatch, capsys, ["--json", "--size", "1"], {BUN: PLAN_JSON, GH: GH_JSON}
    )
    assert code == 0
    assert out.stdout.endswith("}\n")
    assert '"title": "Café"' in out.stdout
    assert '  "kind": "lessons",\n  "size": 1,\n  "only": null,\n' in out.stdout
    assert '"waiting": [],\n' in out.stdout
    assert json.loads(out.stdout)["wave"][0]["id"] == "a/1"


def test_to_json_escapes_a_lone_surrogate_as_javascript_does() -> None:
    assert nw.to_json({"t": "a\ud800b"}) == '{\n  "t": "a\\ud800b"\n}\n'


def test_main_exits_2_on_a_bad_argument_before_running_anything(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    code, out, fake = run_main(monkeypatch, capsys, ["--kind", "nope"], {})
    assert code == 2
    assert out.stdout == ""
    assert out.stderr == 'next-wave: --kind is lessons or content, got "nope"\n'
    assert fake.calls == []


def test_main_exits_1_and_names_gh_as_the_javascript_tool_did(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    code, out, _ = run_main(monkeypatch, capsys, [], {BUN: PLAN_JSON, GH: 1})
    assert code == 1
    assert out.stdout == ""
    assert out.stderr == f"next-wave: gh issue list failed: Command failed: {GH}\n"
    code, out, _ = run_main(
        monkeypatch, capsys, [], {BUN: PLAN_JSON, GH: FileNotFoundError(2, "x")}
    )
    assert code == 1
    assert out.stderr == 'next-wave: gh issue list failed: Executable not found in $PATH: "gh"\n'


def test_main_exits_1_when_lesson_plan_fails_or_cannot_start(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    code, out, _ = run_main(monkeypatch, capsys, [], {BUN: 1})
    assert code == 1
    assert out.stderr == f"next-wave: {BUN} failed: Command failed: {BUN}\n"
    code, out, _ = run_main(monkeypatch, capsys, [], {BUN: FileNotFoundError(2, "x")})
    assert code == 1
    assert out.stderr == f'next-wave: {BUN} failed: Executable not found in $PATH: "bun"\n'
    code, out, _ = run_main(monkeypatch, capsys, [], {BUN: PermissionError(13, "denied")})
    assert code == 1
    assert out.stderr == f"next-wave: {BUN} failed: [Errno 13] denied\n"


@pytest.mark.parametrize(
    ("outputs", "name"),
    [
        ({BUN: "not json"}, BUN),
        ({BUN: "{}"}, BUN),
        ({BUN: PLAN_JSON, GH: '[{"number": 1}]'}, "gh issue list"),
    ],
)
def test_main_exits_1_on_output_it_cannot_read(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    outputs: dict[str, str | int | OSError],
    name: str,
) -> None:
    code, out, _ = run_main(monkeypatch, capsys, [], outputs)
    assert code == 1
    assert out.stdout == ""
    assert out.stderr.startswith(f"next-wave: {name} failed: unreadable output: ")


def test_main_writes_a_lone_surrogate_in_the_markdown_as_u_fffd_as_javascript_did(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    gh = json.dumps(
        [
            {
                "number": 30,
                "title": "Odd \ud800 title",
                "assignees": [],
                "labels": [{"name": "ready-for-agent"}, {"name": "content"}],
            }
        ]
    )
    code, out, _ = run_main(monkeypatch, capsys, ["--kind", "content"], {BUN: PLAN_JSON, GH: gh})
    assert code == 0
    assert "| #30 | Odd \ufffd title | `ready-for-agent`, `content` |" in out.stdout


def test_parse_lesson_plan_keeps_only_string_after_entries() -> None:
    plan_json = json.loads(PLAN_JSON)
    plan_json["lessons"][1]["after"] = ["a/1", 7, None]
    lessons = nw.parse_lesson_plan(json.dumps(plan_json))
    assert lessons[1]["after"] == ["a/1"]
