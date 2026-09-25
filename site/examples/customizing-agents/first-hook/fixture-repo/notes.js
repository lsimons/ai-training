// Prints the notes in notes.json, one per line.
const fs = require("node:fs");

const notes = JSON.parse(fs.readFileSync("notes.json", "utf8"));
for (const note of notes) {
  console.log(note);
}
