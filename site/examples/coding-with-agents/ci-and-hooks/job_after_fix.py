"""Runs the CI job's steps again after the agent's fix to importer.py.

The fix is the one the self-checking-loops lesson briefs for, read from
that lesson's fixtures. It changes importer.py and nothing else.
"""

from _gates import job_on

if __name__ == "__main__":
    job_on(apply_fix=True)
