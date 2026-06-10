---
name: conventional-commits
description: 'Conventional commits format for this project. Use when writing commit messages, planning phases, or reviewing commit history. Covers allowed types, optional scopes, breaking changes, and examples.'
---

# Conventional Commits

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- **type** - required, lowercase
- **scope** - optional, lowercase, in parentheses: `feat(auth): ...`
- **description** - imperative, present tense, no period at the end, max ~72 characters
- **body** - optional, explains the *why* not the *what*
- **footer** - optional; use `BREAKING CHANGE:` or `fixes #<issue>`

## Allowed Types

| Type | When to use |
|---|---|
| `feat` | new feature or capability visible to the user or consumer |
| `fix` | bug fix |
| `refactor` | restructuring without behaviour change |
| `test` | adding or updating tests only |
| `chore` | tooling, deps, config, build scripts - no production code |
| `docs` | documentation only |
| `style` | formatting, whitespace - no logic change |
| `perf` | performance improvement |
| `ci` | CI/CD pipeline changes |
| `revert` | reverts a previous commit |

## Breaking Changes

Append `!` after the type/scope, and add a `BREAKING CHANGE:` footer:

```
feat(api)!: remove deprecated endpoint

BREAKING CHANGE: /v1/users has been removed. Use /v2/users instead.
```

## Examples

```
feat(auth): add OAuth2 login flow
fix(session): prevent token refresh race condition
refactor: extract validation logic into sessionValidator utils
test(cart): add unit tests for discount calculation
chore: upgrade eslint to v9
docs: update README with local setup steps
```

## Rules

- Use imperative mood: "add", "fix", "remove" - not "added", "fixes", "removed"
- Keep the description under ~72 characters
- Do not end the description with a period
- One logical change per commit - do not mix unrelated changes
- Scope should reflect the module, feature area, or file group being changed
