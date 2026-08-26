---
name: code-change
description: 'Workflow for changing existing code: fixing a bug, adding a feature, or removing a feature. Use when: modifying an existing page or component; refactoring; adding new behaviour; cleaning up removed functionality. Ensures e2e coverage exists before touching code, then plans and implements incrementally following project conventions.'
argument-hint: 'bug-fix | add-feature | remove-feature — and a short description of what to change'
---

# Code Change Workflow

Covers three change types: **bug fix**, **add feature**, **remove feature**.
All three follow the same gate-first approach: e2e coverage must exist before the code changes.

## Step 1 — Identify the Target

Locate the page, component, or feature that will be changed.

- Find the relevant Cypress spec files under `cypress/e2e/`.
- Find the relevant source files under `src/`.
- Identify the `TestID` entries in `src/testID.ts` that belong to the area.

If none exist yet, they must be created in Step 2 before any source code is touched.

## Step 2 — Audit and Complete E2E Coverage

**Do not change source code until this step is complete.**

### 2a. Check existing coverage

Open the matching `cypress/e2e/<feature>.cy.ts` file (or files).
Ask: does it exercise the happy path and the main failure paths of this feature?

| Coverage level | Action |
|---|---|
| Full happy + failure paths | Proceed to Step 3 |
| Happy path only | Add failure-path tests first |
| Partial or missing | Write the missing spec(s) first |

### 2b. Write missing e2e tests (if needed)

- Use `TestID` enum values for all selectors — never hardcode strings.
- Follow the fixture pattern already used in `cypress/fixtures/`.
- Verify the new tests pass against the current (unchanged) code before continuing.

Commit the e2e additions as a standalone commit:
```
test: add e2e coverage for <feature> before <change-type>
```

### 2c. Check Vitest unit test coverage for utils

If the change touches or introduces any util functions, check whether they have Vitest tests.

- Util functions must be **small, single-purposed, and pure** — same input always produces the same output, no side effects.
- If a util is missing tests, add them before changing its logic.
- Each test file lives next to its module: `src/utils/foo.utils.test.ts` alongside `src/utils/foo.utils.ts`.
- Run `pnpm test` to confirm all unit tests pass before proceeding.

Commit new unit tests as a standalone commit:
```
test: add unit test coverage for <util-name> before <change-type>
```

## Step 3 — Create an Incremental Plan

Follow the [incremental-planning skill](../incremental-planning/SKILL.md).

- Create a plan file at `agent/plans/<issue-or-feature-slug>.md`.
- Split the work into phases: one phase = one commit.
- Every phase must leave the build and tests passing.
- Size each phase using the phase-sizing table from the incremental-planning skill.

### Change-type-specific phase guidance

**Bug fix**
1. Reproduce phase: add a unit test that fails on the current code.
2. Fix phase: minimal change that makes the failing test pass.
3. Cleanup phase (optional): remove workarounds introduced for the bug.

**Add feature**
1. Data / types phase: new types and pure logic only, no UI.
2. Hook / service phase: wire the logic into a hook or service.
3. UI phase: connect the hook to the component.
4. Wiring phase: register routes or exports if needed.

**Remove feature**
1. Deprecation phase: stop rendering the feature but keep its code.
2. Deletion phase: remove dead code after the deprecation commit is verified.
3. Cleanup phase: remove related types, constants, and `TestID` entries.

## Step 4 — Implement Each Phase

For each phase in the plan:

1. Make only the changes scoped to that phase.
2. Keep util functions **small, focused, and pure**. If a piece of logic can be extracted into a pure function, do so and add a Vitest test for it. Never put business logic directly in components or hooks when it can live in a tested util.
3. Apply code conventions from the three active skills:
   - **functional-coding-style**: pure functions, SRP, no side effects in logic.
   - **formatting**: blank lines between `if` blocks, before `return`, curly braces always.
   - **copilot-instructions**: functional components, `import type`, no `any`, no `!`, named exports only, `TestID` enum for test IDs, lodash sub-module imports.
4. Run `pnpm build` and `pnpm test` — both must pass before committing.
5. Output the commit command (do not run it):
   ```
   git add <files>
   git commit -m "<type>(<scope>): <description>"
   ```
   Prefix with the branch ticket ID if the branch is named `IS-XXXXX`.

## Step 5 — Verify End-to-End

After all phases are committed, confirm:

- [ ] `pnpm build` exits with no errors.
- [ ] All existing Cypress specs still pass (or have been intentionally updated).
- [ ] The new or updated e2e spec from Step 2 passes.
- [ ] All touched util functions have Vitest tests; `pnpm test` passes.
- [ ] No `any`, no `!`, no hardcoded test-ID strings introduced.
- [ ] Import order matches the convention in `copilot-instructions`.

## Quick Reference — Conventions Checklist

| Rule | Source |
|---|---|
| Blank line before `return`; blank line between `if` blocks | formatting skill |
| Pure logic separated from side effects | functional-coding-style skill |
| One phase = one commit, build must pass | incremental-planning skill |
| `import type` for type-only imports | copilot-instructions |
| `TestID` enum for all selectors | copilot-instructions |
| Named exports only; no `index.tsx` entry points | copilot-instructions |
| Lodash: sub-module imports only | copilot-instructions |
| Hook args as single named object `args` | copilot-instructions |
| Utils: pure, single-purposed, tested with Vitest | functional-coding-style skill |
