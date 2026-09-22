---
name: incremental-implementation
description: 'Implement one phase from a plan file in agent/plans/. Use when asked to implement a plan, build a feature phase by phase, or continue incremental work on an existing plan. Reads the plan, implements only the files listed for that phase, runs the verify step, and commits with the exact message from the plan.'
argument-hint: '<plan-name> [phase number]  e.g. "06-integrated-llm-chat phase 3"'
---

# Incremental Implementation

## Purpose

Implement exactly one phase from a plan file - no more, no fewer files than
the plan specifies. Each invocation leaves the codebase in a working state and
produces one clean commit.

## Step-by-Step Procedure

### 1. Resolve the plan and phase

- If a plan name was given, load `agent/plans/<plan-name>.md`.
- If no plan was given, list `agent/plans/` and ask the user which plan to work on.
- If a phase number was given, jump to that phase.
- If no phase was given, scan the plan for the first phase whose commit has not
  yet been applied (`git log --oneline` or check the files listed - if none of
  them exist yet, the phase is unimplemented).

### 2. Read the full phase block

Read the target phase completely before touching any file. Note:

- **Commit message** - copy it verbatim; do not paraphrase.
- **Files touched** - the exact list of files to create or edit. Do not touch
  any file outside this list.
- **Verify command** - the exact shell command(s) to run at the end.

### 3. Load relevant skills before writing code

Before writing any code, load and follow:

- `formatting` skill - brace style, blank lines, etc.
- `functional-coding-style` skill - FP principles, SRP, pure vs side-effect
  boundary.

### 4. Implement

Work through the **Files touched** list in the order given:

| File instruction | Action |
|---|---|
| `(new)` | Create the file; do not add anything beyond what the phase describes. |
| No annotation | Edit the existing file; make only the changes the phase lists. |
| `pnpm add …` | Run the install command; do not upgrade unrelated packages. |

Rules that apply to every file:

- Follow existing naming, folder, and architectural conventions.
- Preserve all code in files that is unrelated to this phase.
- If the phase says "export X", export exactly X - do not add extra exports
  speculatively.
- Never set `nodeIntegration: true` in any Electron `BrowserWindow`.
- Renderer code must never import from `src/main/` or use Node built-ins
  directly - go through `contextBridge` / IPC only.
- Parsing and report-building helpers must stay free of Electron and DOM
  imports.

### 5. Run the verify step

Run the exact command(s) listed under **Verify** in the phase block.

- If the command fails, fix the error and re-run before proceeding.
- Do not proceed to the commit step while verify is failing.
- If a verify step says "open the app and check X manually", note that as a
  manual check for the user and skip it in automated runs.

### 6. Commit

```
git add -A
git commit -m "<exact commit message from the plan>"
```

Use the commit message from the plan verbatim - do not reword it.

### 7. Report

After the commit, report:

- Which phase was implemented and what commit was made.
- Which phase is next (copy its one-line description from the plan).
- Any files that were created vs edited.
- Any manual verify steps the user should perform.

---

## Decision Points

### Which phase comes next?

Check `git log --oneline` for the commit messages listed in the plan.
The first plan commit message that does not appear in the log is the next phase.

### The plan lists a file that already exists with conflicting content

Read the existing file first. Implement only the delta the plan describes.
If the existing content contradicts the plan, surface the conflict to the user
before changing anything.

### A phase lists more than ~3 files or mixes logic + UI

Flag it to the user: the phase may violate the one-phase-one-concern rule from
the `incremental-planning` skill. Ask whether to split it before implementing.

### Verify fails and the fix is non-trivial

Stop, describe the failure, and ask the user how to proceed rather than making
speculative fixes that go beyond the phase scope.

---

## Hard Constraints

- **Never implement two phases in one run** unless explicitly asked.
- **Never commit a failing build** - verify must pass first.
- **Never add files, exports, or dependencies not listed in the phase** - that
  belongs to a future phase.
- **Never delete code** as part of a phase unless the phase explicitly lists a
  deletion.
- **Never modify `src/main/preload.ts` or `contextBridge`** to expose raw Node
  or Electron APIs - only typed, minimal IPC wrappers.
