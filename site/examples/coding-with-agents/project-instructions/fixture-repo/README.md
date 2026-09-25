# todo

A small command-line to-do list kept in a JSON file. It exists as a practice
repository for the lesson *Writing project instructions the agent reads every
session*.

```sh
python3 todo.py add "Buy milk"
python3 todo.py list
python3 todo.py done 1
python3 todo.py undo 1
python3 todo.py clear
python3 export.py > todos.csv
python3 -m unittest -q
```

`todo.py` holds the commands, `store.py` reads and writes the list,
`render.py` formats it and `export.py` writes it as CSV. `docs/SPEC.md`
specifies the commands, including two that aren't built yet. `legacy/` holds
the first version of the program, one file, kept for reference.

Work in a copy of this directory, and give the copy one commit of its own so
that `git status` shows what a session changed:

```sh
git init -q && git add -A && git commit -qm start
```

Reset it by deleting the copy and copying again.
