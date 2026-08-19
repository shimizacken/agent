---
name: shortcuts
description: 'Interpret concise command shortcuts for common Git and pull-request workflows. Use when a user invokes a listed shortcut such as c, cp, m, or pd.'
---

# Command Shortcuts

Interpret the following shortcuts as shorthand for the requested workflow. Keep the shortcut’s intent, inspect the repository state when needed, and preserve the user’s normal authorization boundaries.

## Git and pull-request shortcuts

| Shortcut | Meaning | Expected action |
|---|---|---|
| `c` | commit | Commit the current intended changes using a suitable Conventional Commit message. Ask for a message only when the change cannot be understood safely from context. |
| `cp` | commit and push | Create the commit, then push the current branch to its configured upstream. Report the commit and push result. |
| `m` | merged | Check and summarize whether the relevant branch or pull request has been merged, including what remains if it has not. |
| `pd` | PR description | Draft a concise pull-request description covering summary, motivation, notable implementation details, testing, and follow-up or risk notes. |

## Additional suggested shortcuts

| Shortcut | Meaning |
|---|---|
| `s` / `st` | `git status` |
| `d` | `git diff` |
| `ds` | `git diff --staged` |
| `l` / `lg` | recent commit log |
| `b` | list or inspect branches |
| `co <branch>` | check out a branch |
| `pl` | pull the current branch |
| `ps` | push the current branch |
| `pr` | inspect or prepare the pull request for the current branch |
| `t` | run the project’s relevant tests |
| `v` | verify the change with the project’s build, lint, and test commands |

## Guardrails

- Treat `c`, `cp`, `pl`, and `ps` as repository mutations. Inspect the working tree and branch before acting, and do not include unrelated changes.
- A push may affect remote collaborators; if the target or branch is unclear, ask before pushing.
- Never use destructive commands such as reset, force-push, or broad restore as an implied shortcut.
- Expand the shortcut in status updates so the user can see what action was taken.
