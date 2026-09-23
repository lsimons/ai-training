# todo

A small command-line to-do list kept in a JSON file, split into three
modules. It exists as a practice repository for the lesson *Plan first, then
drive the change from a failing test*.

```sh
python3 todo.py add "Buy milk"
python3 todo.py list
python3 todo.py done 1
python3 todo.py clear
python3 -m unittest -q
```

`todo.py` holds the commands, `store.py` reads and writes the list, and
`render.py` formats it. Items live in `todos.json` next to the scripts. Set
`TODO_FILE` to use a different file.

The tests pass, and `clear` has a bug they don't cover. Reset the repository
at any time with `git checkout -- .`.
