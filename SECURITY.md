# Security policy

## Reporting a vulnerability

**Please don't report security vulnerabilities through public GitHub issues.**

Use GitHub's private vulnerability reporting: go to the **Security** tab of
this repository and click **Report a vulnerability**. If that's not available,
contact @lsimons directly through GitHub.

Please include:

- A description of the vulnerability
- Steps to reproduce
- The potential impact

We acknowledge reports within a few days and keep you informed of
progress. This is a small personal project, so response times may vary.

## Scope

This is a static documentation site. The main risks are in the build tooling
and the GitHub Actions workflows, which are pinned and audited with zizmor.
Interactive lesson content runs entirely in the browser and stores progress in
local storage only, and it sends nothing to a server.
