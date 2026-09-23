# Fixture: an agent and its key

A stand-in coding agent for the lesson *Keeping API keys out of the agent's
reach*. `agent.py` finds a key at start and says where it came from,
`vault.py` stands in for a password manager's command-line tool, and
`scan.py` is a small secret scanner. Nothing here calls a model, and every
key in this directory is fake.

The application's `.env` is committed as `env.sample`, because the course
repository ignores every `.env`. Copy it once before you start:
`cp env.sample .env`. Then run `python3 agent.py` and `python3 scan.py`
before you change anything. `git checkout -- .` puts every tracked file
back, and `.env` stays as you left it.
