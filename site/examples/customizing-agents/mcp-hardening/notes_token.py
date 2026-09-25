"""Tokens for the lesson's notes server: a scope, an expiry and an owner, signed.

A real service issues its tokens and checks them on its own side. The
stand-in plays that service too, so the secret is here, in the open. It
is a sample for the lesson and protects nothing.

A token has four parts, joined by dots: the scope (`read` or
`read+share`), the expiry as seconds since 1970, the owner's name, and
a signature over the first three.
"""

import hashlib
import hmac
import time

SAMPLE_SECRET = b"lesson-sample-secret-not-for-real-use"
SCOPES = ("read", "read+share")


def _signature(body):
    return hmac.new(SAMPLE_SECRET, body.encode(), hashlib.sha256).hexdigest()[:16]


def issue(scope, hours, owner):
    """Return a token for `owner` with `scope` that expires `hours` from now."""
    if scope not in SCOPES:
        raise ValueError(f"scope must be one of {SCOPES}")
    if not owner or "." in owner:
        raise ValueError("owner must be a name without dots")
    expires = int(time.time() + hours * 3600)
    body = f"{scope}.{expires}.{owner}"
    return f"{body}.{_signature(body)}"


def check(token):
    """Return (scope, owner, problem). `problem` is None for a valid token."""
    parts = (token or "").split(".")
    if len(parts) != 4:
        return None, None, "no valid token"
    scope, expires, owner, signature = parts
    body = f"{scope}.{expires}.{owner}"
    if scope not in SCOPES or not expires.isdigit():
        return None, None, "no valid token"
    if not hmac.compare_digest(signature, _signature(body)):
        return None, None, "no valid token"
    if time.time() >= int(expires):
        return scope, owner, "token expired"
    return scope, owner, None
