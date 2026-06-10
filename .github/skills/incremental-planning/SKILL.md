---
name: incremental-planning
description: 'Planning style for this project. Use when creating a migration plan, refactor plan, or any multi-step implementation plan. Each plan must be broken into small, independently buildable phases - one phase = one commit. Guides how to slice work so every step leaves the codebase in a working state.'
---

# Incremental Planning

## File Location

Plan files must be created at `.agent/plans/<plan-name>.md` in the workspace root.

## Rules

- **One commit per phase** - each phase must be a single, focused git commit with a clear message.
- **Build must pass before committing** - run `pnpm build` (and `pnpm test` if logic changed) before every commit.
- **Each phase is independently deployable** - the extension must remain functional after every commit, not just at the end.
- **No big-bang phases** - if a phase touches more than 2–3 files or changes both logic and UI, split it further.
- **Verify step per phase** - every phase ends with an explicit verification command (build, test, or storybook check).

## Phase Sizing Guide

| Phase type | Max scope |
|---|---|
| Tooling / config | 1–3 config files, no logic |
| Logic extraction | 1 new file + 1 edited file (importer) |
| Tests | 1 new test file per module |
| Single component | 1 `.tsx` file + its `.stories.tsx` |
| Wiring / hook | 1 hook file, no UI change yet |
| Cutover | Mount new entry point; old code still present |
| Cleanup | Delete old code only after cutover is verified |

## Naming Convention

Commit messages follow conventional commits:
- `chore:` - tooling, deps, config
- `refactor:` - restructuring without behaviour change
- `test:` - tests only
- `feat:` - new component or feature
- `fix:` - bug fix

## Anti-patterns to Avoid

- ❌ "Migrate everything to React" in one commit
- ❌ Deleting old code in the same commit that introduces new code
- ❌ Committing a broken build as a "WIP"
- ❌ Mixing logic changes with CSS changes in one commit
