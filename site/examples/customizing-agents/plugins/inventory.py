"""List what a Claude Code plugin directory adds to a session.

For the lesson "Reading a plugin before you install it".

Run it on a plugin directory:   python3 inventory.py release-kit

The script only reads files. It never runs a hook, starts a server or
loads a skill. For the plugin in the directory it prints:

- the name and version from `.claude-plugin/plugin.json`
- the name of each skill under `skills/` and each command under `commands/`
- each agent under `agents/`, with the tools its front matter lists
- each hook in `hooks/hooks.json`: the event, the matcher and the command
- each server in `.mcp.json`: the command it starts or the URL it calls
- each file in `bin/`
- an estimate of the tokens that the names and descriptions of the skills,
  commands and agents add to every turn

The token count uses the same rule as `measure.py` in the lesson "Loading
only what the skill needs": about four characters per token. A word of up
to six characters is one token, a longer word is one token per four
characters (rounded up), and every punctuation mark is a token of its own.
Only the vendor's tokenizer gives the exact count.

The script reads the parts of a plugin that the lesson names, at their
default paths. A manifest can point to other paths, and a plugin can hold
other kinds of component. Read the plugin's own files for those.
"""

import json
import math
import re
import sys
from pathlib import Path

CHARS_PER_TOKEN = 4
ONE_TOKEN_WORD = 6

# A piece is a run of letters and digits, or a single mark of punctuation.
PIECE = re.compile(r"\w+|[^\w\s]")


def estimate_tokens(text: str) -> int:
    """Return the estimated number of tokens in `text`."""
    total = 0
    for piece in PIECE.findall(text):
        if not piece[0].isalnum() or len(piece) <= ONE_TOKEN_WORD:
            total += 1
        else:
            total += math.ceil(len(piece) / CHARS_PER_TOKEN)
    return total


def front_matter(path: Path) -> dict[str, str]:
    """Return the top-level fields of a Markdown file's front matter.

    A line indented under a field (a folded value) is added to that field.
    A file without front matter gives an empty dictionary.
    """
    lines = path.read_text(encoding="utf-8").splitlines()
    fields: dict[str, str] = {}
    if not lines or lines[0] != "---":
        return fields
    current = ""
    for line in lines[1:]:
        if line == "---":
            break
        if line[:1] in (" ", "\t") and current:
            fields[current] = (fields[current] + " " + line.strip()).strip()
            continue
        key, _, value = line.partition(":")
        current = key.strip()
        fields[current] = value.strip().strip("'\"")
    return fields


def model_can_invoke(fields: dict[str, str]) -> bool:
    """A skill or command with disable-model-invocation: true is left out of the context."""
    return fields.get("disable-model-invocation", "").lower() != "true"


def markdown_parts(plugin: Path, kind: str) -> list[Path]:
    """Return the skill, command or agent files of the plugin, sorted."""
    if kind == "skills":
        return sorted((plugin / "skills").glob("*/SKILL.md"))
    return sorted((plugin / kind).rglob("*.md"))


def report(plugin: Path) -> list[str]:
    """Return the lines of the inventory for the plugin directory."""
    out: list[str] = []
    manifest_path = plugin / ".claude-plugin" / "plugin.json"
    manifest = (
        json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.is_file() else {}
    )
    name = manifest.get("name", plugin.name)
    version = manifest.get("version", "no version")
    out.append(f"plugin {name} {version}")

    always_loaded = 0
    for kind in ("skills", "commands", "agents"):
        files = markdown_parts(plugin, kind)
        out.append(f"{kind}:" if files else f"{kind}: none")
        for path in files:
            fields = front_matter(path)
            default = path.parent.name if kind == "skills" else path.stem
            part = fields.get("name", default)
            description = fields.get("description", "")
            if kind == "agents":
                tools = fields.get("tools", "").strip("[]").replace('"', "")
                out.append(f"  {part}, tools: {tools or 'all of the main session'}")
            else:
                out.append(f"  {part}")
            if kind == "agents" or model_can_invoke(fields):
                always_loaded += estimate_tokens(part + " " + description)

    hooks_path = plugin / "hooks" / "hooks.json"
    hooks = (
        json.loads(hooks_path.read_text(encoding="utf-8")).get("hooks", {})
        if hooks_path.is_file()
        else {}
    )
    out.append("hooks:" if hooks else "hooks: none")
    for event, groups in hooks.items():
        for group in groups:
            matcher = group.get("matcher", "")
            when = f"tool matches {matcher}" if matcher not in ("", "*") else "every time"
            for hook in group.get("hooks", []):
                action = (
                    hook.get("command") or hook.get("url") or hook.get("prompt") or hook.get("type")
                )
                out.append(f"  {event}, {when}: {action}")

    mcp_path = plugin / ".mcp.json"
    mcp = json.loads(mcp_path.read_text(encoding="utf-8")) if mcp_path.is_file() else {}
    servers = mcp.get("mcpServers", mcp)
    out.append("servers:" if servers else "servers: none")
    for server, config in servers.items():
        if "url" in config:
            out.append(f"  {server}: calls {config['url']}")
        else:
            command = " ".join([config.get("command", ""), *config.get("args", [])])
            out.append(f"  {server}: starts {command}")

    bin_files = sorted(p.name for p in (plugin / "bin").glob("*") if p.is_file())
    out.append("bin: " + (", ".join(bin_files) if bin_files else "none"))
    out.append(f"always loaded, names and descriptions: {always_loaded}")
    return out


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 inventory.py <plugin directory>")
    print("\n".join(report(Path(sys.argv[1]))))
