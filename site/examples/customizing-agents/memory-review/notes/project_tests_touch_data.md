---
name: Tests touch the data
description: Back up todos.json before a test run and restore it after
type: project
---

The tests read and write the real todos.json, because there is no way yet
to point them at another file. Copy todos.json to todos.json.bak before
running the tests, and copy it back after.
