# todo commands

Every command reads the list, changes it, saves it and prints one line.
The list is `todos.json` next to the scripts, or the file `TODO_FILE`
names. Items are numbered from 1 in the order of the file.

| Command             | Prints                        | Changes                     |
| ------------------- | ----------------------------- | --------------------------- |
| `add <text>`        | `added #<n>: <text>`          | Appends an open item        |
| `list`              | The numbered list and a count | Nothing                     |
| `done <n>`          | `done #<n>: <text>`           | Marks item n done           |
| `undo <n>`          | `open #<n>: <text>`           | Marks item n open again     |
| `clear`             | `removed <k> done item(s)`    | Drops every done item       |
| `rename <n> <text>` | `renamed #<n>: <text>`        | Replaces the text of item n |
| `remove <n>`        | `removed #<n>: <text>`        | Drops item n                |

`done`, `undo`, `rename` and `remove` print `no item #<n>` and change
nothing when there is no item n. `rename` and `remove` are specified and not
built yet.
