"""Runs the CI job's steps on the pull request before the agent's fix."""

from _gates import job_on

if __name__ == "__main__":
    job_on(apply_fix=False)
