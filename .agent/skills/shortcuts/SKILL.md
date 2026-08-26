---
name: shortcuts
description: 'Use the C, CP, P, G, GP, IMP, WN, PD, SLC, and YT chat shortcuts for Git and implementation work. C means commit current changes; CP means commit and push the current branch; P means push the current branch; G means generate requested content; GP means generate a plan file; IMP means implement a plan file; WN means identify what to implement next from the current plan; PD means generate a pull request description; SLC means summarize the latest changes; YT means YouTrack. Shortcuts are case-insensitive.'
argument-hint: '<C|CP|P|G|GP|IMP|WN|PD|SLC|YT>'
user-invocable: true
---

# Git Shortcuts

## When to Use

Use this skill when the user sends `C`, `CP`, `P`, `G`, `GP`, `IMP`, `WN`, `PD`, `SLC`, or `YT`, in any letter case, as a request to manage current Git work, generate content, or provide YouTrack context.

- `C`: inspect, validate, stage, and commit the intended current changes.
- `CP`: perform the `C` workflow, then push the current branch to its upstream remote.
- `P`: push the current branch to its upstream remote without committing or modifying files.
- `G`: generate the requested content or artifact from the available context without committing or pushing.
- `GP`: follow the [generate-plan prompt](../../../.github/prompts/generate-plan.prompt.md) to create or refine an incremental implementation plan file for the requested work.
- `IMP`: implement the requested phase from a plan or implementation file, following that file's verification and commit instructions.
- `WN`: inspect the current plan and report what should be implemented next without modifying files.
- `PD`: follow [the PR description prompt](../../../.github/prompts/pr-description.prompt.md) to generate a consistent description without modifying the worktree.
- `SLC`: summarize the latest changes on the current branch relative to its upstream or base branch. Use `git log` and `git diff` to produce a concise human-readable summary grouped by theme. Do not commit or push.
- `YT`: YouTrack context. Use `YTC {link}` with `PD` to mark the PR as closing the YouTrack issue, or `YTP {link}` with `PD` to mark it as part of the YouTrack issue.

## Procedure

1. Normalize the request case-insensitively and accept `C`, `CP`, `P`, `G`, `GP`, `IMP`, `WN`, `PD`, or `YT` with the argument forms documented above.
2. Inspect the current branch and worktree with `git status --short --branch`.
3. Review the staged and unstaged diff before selecting files. Preserve unrelated user changes and never use destructive commands to clean them up.
4. Identify the narrowest appropriate validation command from the project. Run it before committing when the changed files have an available focused check. If validation fails, fix the relevant issue or report the blocker instead of committing a known failure.
5. Stage only the intended files with `git add <paths>`. Do not stage secrets, generated artifacts, or unrelated changes.
6. Choose a concise conventional commit message describing the actual change. When the current branch is named `IS-XXXXX`, prefix the message with `IS-XXXXX: `.
7. Before committing, show the selected scope and proposed commit message and ask for confirmation unless the user has explicitly authorized the shortcut to commit without confirmation.
8. Run `git commit -m "<message>"` after confirmation. Verify the commit with `git status --short --branch` and `git log -1 --oneline`.
9. For `CP`, push the new commit after the commit succeeds:
   - If an upstream exists, run `git push`.
   - Otherwise, run `git push --set-upstream origin <current-branch>`.
10. For `P`, push the current branch without committing or modifying files:
   - If an upstream exists, run `git push`.
   - Otherwise, run `git push --set-upstream origin <current-branch>`.
11. Report the commit hash and message for `C` or `CP`; report the push result for `P` or `CP`; and report any validation performed.
12. For `G`, generate only the requested content or artifact and do not commit or push unless explicitly requested.
13. For `GP`, follow the [generate-plan prompt](../../../.github/prompts/generate-plan.prompt.md) and create or refine the plan file under `.agents/plans/`.
14. For `IMP`, follow the incremental implementation workflow for the specified plan or implementation file and run its verification step.
15. For `WN`, inspect the current plan, identify the next incomplete implementation phase, and report it without modifying files.
16. For `SLC`, run `git log origin/HEAD..HEAD --oneline` (or `git log --oneline -20` when no upstream exists) and `git diff origin/HEAD` to collect the changes, then produce a concise summary grouped by theme. Do not commit, push, or modify files.

### Pull Request Description (`PD`)

Follow [the PR description prompt](../../../.github/prompts/pr-description.prompt.md) for the branch inspection process, fixed output sections, and content rules. Pass `YTC {link}` when the PR closes a YouTrack issue or `YTP {link}` when it addresses only part of one. Return its Markdown output without creating a commit, pushing changes, or editing files.

## Decision Rules

- If the worktree is clean, do not create an empty commit. Report that there is nothing to commit.
- If the user names specific files or a commit message, honor those constraints after checking that the files are relevant.
- If staged changes already exist, inspect them carefully and do not reset or unstage them without explicit instruction.
- If the branch is detached, has no remote, or push fails, complete the local commit when authorized and report the exact push blocker.
- If the request is not a supported shortcut or documented argument form after case normalization, ask the user to choose one of the supported shortcuts.
- For `P`, do not commit, stage, unstage, or modify files.
- For `G`, do not commit or push unless explicitly requested.
- For `WN`, do not modify files.
- Never run `git reset --hard`, `git checkout --`, force-push, rebase, or other destructive history operations as part of a shortcut.
