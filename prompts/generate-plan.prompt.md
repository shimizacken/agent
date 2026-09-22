---
name: generate-plan
description: Generate a structured, incremental implementation plan under .agents/plans. Use for planning features, fixes, migrations, refactors, or other multi-phase work.
argument-hint: '<request or scope>'
user-invocable: true
---

# Generate Implementation Plan

Create or refine one implementation plan for the requested work. Before writing, inspect relevant existing plans, repository conventions, nearby code, and available tests. Preserve useful project-specific detail while applying the structure below.

## Location And Naming

- Write plans under `.agents/plans/` relative to the workspace root.
- Use a descriptive `kebab-case.md` filename.
- Place the plan in the nearest appropriate subdirectory when the repository already groups plans by domain.
- Do not overwrite an existing plan unless the user explicitly asks for it to be refined.

## Required Structure

Use this order. Mark optional sections with `(optional)` in the heading only when they add useful context.

1. Header
2. Implementation Status
3. Table of Contents
4. Problem And Summary (optional)
5. Root Cause (optional)
6. Goals And Non-Goals
7. Current State And Constraints
8. Implementation Phases
9. Risks And Rollback
10. Completion Criteria

### Header

Start with a level-one heading containing the plan title and issue identifier when one is available. Include concise metadata for issue, date, scope, baseline, and affected systems when known.

### Implementation Status

State the current status, such as `Planned`, `In progress`, `Blocked`, or `Complete`. Include the current phase and next action when applicable. Keep this section easy to update as work progresses.

### Table Of Contents

Include links to every major section and each implementation phase. Keep anchors aligned with the headings.

### Problem And Summary (optional)

Explain the user or operational problem, desired outcome, and relevant behavior. Omit this section only when the request is already unambiguous from the header and goals.

### Root Cause (optional)

Describe the verified technical cause, evidence, and the code or configuration boundary that controls it. Do not present guesses as facts. Omit this section when the work is greenfield or no root cause exists yet.

### Goals And Non-Goals

State what the plan will achieve and what it deliberately will not change. Keep scope explicit enough to prevent unrelated cleanup.

### Current State And Constraints

Capture relevant architecture, dependencies, compatibility requirements, security or rollout constraints, and known unknowns. Link to concrete files, symbols, commands, or external issue references when available.

### Implementation Phases

Split the work into small, independently buildable phases. Each phase must include:

- A focused title and purpose.
- Exact files or commands in scope.
- Concrete implementation steps.
- An explicit verification command or manual check.
- A conventional commit message.

Keep each phase focused enough to review independently. Prefer one concern per phase and generally no more than two or three files unless the files form one inseparable change. Keep the repository working after every phase. Never create a phase that combines unrelated logic, UI, dependency, or cleanup work.

Every phase must end with this instruction:

> Stop after verification and wait for the developer's review and explicit approval before committing. Do not commit automatically.

### Risks And Rollback

List meaningful compatibility risks, migration concerns, unresolved assumptions, and a practical rollback or containment approach. Do not invent risks that are not relevant.

### Completion Criteria

Define observable conditions that show the entire plan is complete, including required tests, builds, audits, documentation, or manual checks.

## Rules

- Plans are documentation artifacts only. Do not implement code, commit, or push while generating a plan.
- Do not invent issue links, test results, root causes, file paths, or commands.
- Prefer existing repository patterns and terminology over generic templates.
- Keep phases independently reviewable and buildable.
- If important information is missing, record it as an assumption or open question instead of silently guessing.
- When refining an existing plan, preserve its intent and useful technical findings while normalizing headings, status, contents, phase boundaries, verification, and review gates.
