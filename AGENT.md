# AGENT.md

## Purpose

This repository exists to produce reusable instruction files for AI coding assistants, especially `AGENT.md` and `.github/copilot-instructions.md`.

Use this file as the deeper operating guide. It is intentionally broader than the Copilot instructions file and is allowed to capture workflow, architecture, and editing conventions in more detail.

When adapting this file into another repository:

- keep the durable rules
- replace repository-specific examples with the real structure of the target repo
- remove sections that do not materially improve agent behavior

## Documentation Split

Keep responsibilities separate:

- `README.md` explains the project to humans
- `AGENT.md` explains how an agent should operate in the repo
- `.github/copilot-instructions.md` contains the short always-on subset for GitHub Copilot
- longer plans belong in dedicated markdown files, not inside the main instructions file

Do not duplicate large sections across all three files unless the rule must truly be repeated everywhere.

## Instruction Design Principles

Good instruction files are:

- specific enough to change agent behavior
- short enough to stay readable and composable
- biased toward repo reality, not aspirational architecture fiction
- explicit about constraints, naming, testing, and editing workflow
- clear about where to look when more context is needed

Avoid:

- vague statements like "write clean code"
- stack summaries with no behavioral implications
- duplicated rules scattered across multiple docs
- project-specific trivia that will age badly
- long style-guide prose that could be replaced with a precise rule

## What High-Value Instructions Usually Cover

Use this as a checklist when creating a repo-specific variant:

- purpose of the repository and current reality
- package manager and core commands
- tech stack
- top-level architecture and important directories
- naming conventions and file suffix conventions
- hard constraints on patterns to avoid
- local testing expectations
- styling conventions
- state management conventions
- data model boundaries
- known pitfalls or legacy traps
- practical editing guidance for incremental change

## Reusable Baseline

Unless the target repository says otherwise, these defaults are reasonable:

### Editing

- prefer small, local changes over broad rewrites
- preserve existing patterns before introducing new abstractions
- do not rename or move files unless it materially improves the code or the task requires it
- avoid speculative refactors unrelated to the request
- prefer explicit code over clever code

### Architecture

- keep side effects near application boundaries
- prefer pure helpers where practical
- separate orchestration code from presentational code when the codebase already follows that split
- prefer incremental modernization over pattern churn

### Types And APIs

- prefer precise types over `any`
- make nullability explicit
- keep external API assumptions narrow and validated
- centralize shared constants instead of repeating magic strings

### Tests

- add or update tests when behavior changes materially
- prefer deterministic tests with mocked boundaries
- avoid adding brittle tests that only mirror implementation details

### Git And Planning

- inspect the existing worktree before editing
- do not revert unrelated user changes
- for non-trivial work, write down a short plan before large edits
- keep plan files in a dedicated folder if the repo uses them

## Template For Repo-Specific Sections

When porting this file into a real repository, customize these sections first:

1. Purpose
2. Package Manager
3. Basic Commands
4. Stack
5. Current Architecture
6. Naming Conventions
7. Hard Constraints
8. Testing Guidance
9. Known Pitfalls
10. Practical Editing Guidance

## Minimal Repo-Specific Skeleton

Use this skeleton when bootstrapping a new repo:

```md
# AGENT.md

## Purpose

What this repo is, what exists today, and which source of truth wins when docs disagree.

## Package Manager

Which package manager to use and why.

## Basic Commands

- install
- dev
- build
- test
- lint

## Stack

Main frameworks, language, test tools, build tools.

## Project Structure

Important directories and what belongs in them.

## Naming Conventions

File suffixes, casing, and export expectations.

## Hard Constraints

Patterns the agent must not introduce.

## Testing Guidance

Which test types matter and how to keep them deterministic.

## Known Pitfalls

Legacy traps, stale docs, runtime edge cases.

## Practical Editing Guidance

How to make safe, local, high-signal changes in this repo.
```

## Relationship To Copilot Instructions

Do not copy this entire file into `.github/copilot-instructions.md`.

The Copilot file should usually keep only:

- stack and language rules that must always apply
- file naming or export constraints that meaningfully affect generated code
- core testing expectations
- hard bans on patterns that would create churn or regressions
- links to the deeper docs when the repo has them

If a rule is too detailed to fit in Copilot context, keep it here and reference it from the Copilot file.
