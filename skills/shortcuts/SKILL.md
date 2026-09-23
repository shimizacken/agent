---
name: shortcuts
description: 'Use the C, CP, P, CB, FF, G, GP, IMP, WN, PRD, CPR, SLC, and YT chat shortcuts for Git and implementation work. C means commit current changes; CP means commit and push the current branch; P means push the current branch; CB means create a new git branch; FF means format files; G means generate requested content; GP means generate a plan file; IMP means implement a plan file; WN means identify what to implement next from the current plan; PRD means generate a pull request description; CPR means create or update a pull request via the gh CLI; SLC means summarize the latest changes; YT means YouTrack. Shortcuts are case-insensitive.'
argument-hint: '<C|CP|P|CB|FF|G|GP|IMP|WN|PRD|CPR|SLC|YT>'
user-invocable: true
---

# Git Shortcuts

## When to Use

Use this skill when the user sends `C`, `CP`, `P`, `CB`, `FF`, `G`, `GP`, `IMP`, `WN`, `PRD`, `CPR`, `SLC`, or `YT`, in any letter case, as a request to manage current Git work, generate content, or provide YouTrack context.

- `C`: inspect, validate, stage, and commit the intended current changes.
- `CP`: perform the `C` workflow, then push the current branch to its upstream remote.
- `P`: push the current branch to its upstream remote without committing or modifying files.
- `CB {name}`: create a new git branch from the current `HEAD` without committing, pushing, or discarding any uncommitted changes.
- `FF {paths}`: format the given files (or all files with uncommitted changes when no paths are given) per the project's formatting skills, without staging, committing, or pushing.
- `G`: generate the requested content or artifact from the available context without committing or pushing.
- `GP`: follow the [generate-plan prompt](../../../.github/prompts/generate-plan.prompt.md) to create or refine an incremental implementation plan file for the requested work.
- `IMP`: implement the requested phase from a plan or implementation file, following that file's verification and commit instructions.
- `WN`: inspect the current plan and report what should be implemented next without modifying files.
- `PRD`: follow [the PR description prompt](../../../.github/prompts/pr-description.prompt.md) to generate a consistent description without modifying the worktree.
- `CPR [base branch or title]`: follow [the publish-pr prompt](../../../.github/prompts/publish-pr.prompt.md) to create or update a GitHub pull request for the current branch via the `gh` CLI.
- `SLC`: summarize the latest changes on the current branch relative to its upstream or base branch. Use `git log` and `git diff` to produce a concise human-readable summary grouped by theme. Do not commit or push.
- `YT`: YouTrack context. Use `YTC {link}` with `PRD` to mark the PR as closing the YouTrack issue, or `YTP {link}` with `PRD` to mark it as part of the YouTrack issue.

## Procedure

1. Normalize the request case-insensitively and accept `C`, `CP`, `P`, `CB`, `FF`, `G`, `GP`, `IMP`, `WN`, `PRD`, `CPR`, or `YT` with the argument forms documented above.
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
12. For `CB`, derive a kebab-case branch name from the given argument. Keep a leading ticket ID (for example `IS-XXXXX`) uppercase and hyphen-separated from the rest of the description, e.g. `IS-1234-add-user-auth`. Ask the user for a short description when no argument is given.
13. For `CB`, create the branch from the current `HEAD` with `git checkout -b <branch-name>`, preserving any uncommitted changes. Do not fetch, rebase onto, or switch to a base branch first unless explicitly requested.
14. For `CB`, confirm the result with `git branch --show-current` and report the new branch name.
15. For `FF`, resolve the target files from the given paths, or from `git status --short` when no paths are given.
16. For `FF`, apply the project's formatting conventions (the [formatting](../formatting/SKILL.md) skill, plus [react-formatting](../react-formatting/SKILL.md), [vue-formatting](../vue-formatting/SKILL.md), or [angular-formatting](../angular-formatting/SKILL.md) when relevant) to the target files. Use an installed formatter command from the project when one is defined; otherwise apply the documented rules directly.
17. For `FF`, report the files that changed and do not stage, commit, or push them.
18. For `G`, generate only the requested content or artifact and do not commit or push unless explicitly requested.
19. For `GP`, follow the [generate-plan prompt](../../../.github/prompts/generate-plan.prompt.md) and create or refine the plan file under `.agents/plans/`.
20. For `IMP`, follow the incremental implementation workflow for the specified plan or implementation file and run its verification step.
21. For `WN`, inspect the current plan, identify the next incomplete implementation phase, and report it without modifying files.
22. For `CPR`, follow [the publish-pr prompt](../../../.github/prompts/publish-pr.prompt.md) exactly, including its `gh` authentication check, base branch detection, and confirmation-before-creating step. Pass an argument through as the base branch or PR title per the prompt's `argument-hint`.
23. For `SLC`, run `git log origin/HEAD..HEAD --oneline` (or `git log --oneline -20` when no upstream exists) and `git diff origin/HEAD` to collect the changes, then produce a concise summary grouped by theme. Do not commit, push, or modify files.

### Pull Request Description (`PRD`)

Follow [the PR description prompt](../../../.github/prompts/pr-description.prompt.md) for the branch inspection process, fixed output sections, and content rules. Pass `YTC {link}` when the PR closes a YouTrack issue or `YTP {link}` when it addresses only part of one. Return its Markdown output without creating a commit, pushing changes, or editing files.

## Decision Rules

- If the worktree is clean, do not create an empty commit. Report that there is nothing to commit.
- If the user names specific files or a commit message, honor those constraints after checking that the files are relevant.
- If staged changes already exist, inspect them carefully and do not reset or unstage them without explicit instruction.
- If the branch is detached, has no remote, or push fails, complete the local commit when authorized and report the exact push blocker.
- If the request is not a supported shortcut or documented argument form after case normalization, ask the user to choose one of the supported shortcuts.
- For `P`, do not commit, stage, unstage, or modify files.
- For `CB`, do not commit, stage, or push, and do not discard or stash existing uncommitted changes.
- For `FF`, do not stage, commit, or push the formatted files unless explicitly requested.
- For `CPR`, do not commit, push, force-push, merge, close, or delete a pull request; only create or update it via `gh pr create`/`gh pr edit` per the publish-pr prompt.
- For `G`, do not commit or push unless explicitly requested.
- For `WN`, do not modify files.
- Never run `git reset --hard`, `git checkout --`, force-push, rebase, or other destructive history operations as part of a shortcut.
