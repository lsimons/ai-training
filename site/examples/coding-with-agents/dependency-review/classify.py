"""Classify every dependency change between two npm lockfiles.

The lockfiles are hand-written fixtures in the shape npm writes
(lockfileVersion 3): the root entry "" lists the direct dependencies, and
every installed package has a "node_modules/<name>" entry with a version.
A change is one of three kinds, and each kind gets a different review.

Standard library only, Python 3.9 or later.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

# Which review dimensions apply to which kind of change.
DIMENSIONS = {
    "new direct": ["architecture", "quality", "governance", "security", "code", "license"],
    "new transitive": ["quality", "governance", "security", "code", "license"],
    "version bump": ["security", "code", "license if it changed"],
}


def load(name):
    with open(os.path.join(HERE, "fixture", name), encoding="utf-8") as f:
        return json.load(f)


def installed(lock):
    """Map package name -> version for every installed package."""
    out = {}
    for path, entry in lock["packages"].items():
        if path.startswith("node_modules/"):
            out[path[len("node_modules/"):]] = entry["version"]
    return out


def classify(before, after):
    old = installed(before)
    new = installed(after)
    direct = set(after["packages"][""].get("dependencies", {}))
    changes = []
    for name in sorted(new):
        if name not in old:
            kind = "new direct" if name in direct else "new transitive"
            changes.append((name, new[name], kind))
        elif old[name] != new[name]:
            changes.append((name, old[name] + " -> " + new[name], "version bump"))
    return changes


def main():
    before = load("package-lock.before.json")
    after = load("package-lock.after.json")
    for name, version, kind in classify(before, after):
        print("%s %s: %s" % (name, version, kind))


if __name__ == "__main__":
    main()
