---
name: git-commits
description: 'Git commit conventions for this project. Use when staging and committing changes. Covers conventional commit format, commit sizing, and the rule to always ask the developer before running git commit.'
---

# Git Commits

## Format

```
<type>(<scope>): <short description>
```

If the current branch is named `IS-XXXXX`, prefix every message:

```
IS-XXXXX: <type>(<scope>): <short description>
```

### Types

| Type | When |
|---|---|
| `feat` | New behaviour visible to users |
| `fix` | Bug fix |
| `refactor` | Restructuring without behaviour change |
| `test` | Tests only |
| `chore` | Tooling, deps, config |
| `style` | Formatting, CSS — no logic change |

## Keep Commits Small

- One logical change per commit.
- Never mix logic changes with formatting changes.
- Never delete old code in the same commit that introduces new code.
- If a change touches more than 2-3 files, look for a natural split point.

## Always Ask Before Committing

Never run `git commit` automatically. Always output the commands and wait for the developer to confirm:

```
git add <files>
git commit -m "<message>"
```
