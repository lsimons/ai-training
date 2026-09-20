# todo

A tiny command-line to-do list kept in a JSON file. It exists as a practice
repository for the lesson *Your first session with a coding agent*.

```sh
python3 todo.py add "Buy milk"
python3 todo.py list
python3 todo.py done 1
python3 -m unittest -q
```

Items live in `todos.json` next to the script. Set `TODO_FILE` to use a
different file.

One test fails on purpose. Reset the repository at any time with
`git checkout -- .`.
