---
name: publish-pr
description: Publish the current branch as a GitHub pull request using the gh CLI. Use when asked to create, publish, open, or update a PR.
argument-hint: '[base branch or PR title]'
user-invocable: true
---

# Publish Pull Request

Create or update a GitHub pull request for the current branch using the `gh` CLI.

## Process

1. Confirm `gh` is installed and authenticated with `gh auth status`. If it is unavailable or unauthenticated, stop and report: `GitHub CLI (gh) is not installed or not authenticated. Run gh auth login before proceeding.`
2. Inspect the current branch and worktree with `git status --short --branch`. Do not modify, stash, reset, or commit uncommitted changes. Mention pending worktree changes in the PR only when they are not part of the committed diff.
3. Determine the base branch with `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, unless the user supplied an explicit base branch.
4. Confirm the current branch is not the base branch and identify its merge base with `git merge-base HEAD <base-branch>`.
5. Inspect the complete committed diff and commit history from the merge base. Check repository PR templates and contribution guidance when available.
6. Generate a concise PR title and body from verified changes. Include:
   - Summary of the user-visible or operational outcome
   - Important changes grouped by theme
   - Tests or validation commands actually run
   - Risks, limitations, or `None identified.`
7. Check for an existing open PR from the current branch with `gh pr view --json number,url,state`. Do not create a duplicate.
8. Show the proposed title and body and ask for confirmation before changing GitHub state.
9. After confirmation, write the body to a temporary file outside the repository and:
   - Update an existing PR with `gh pr edit <number> --title "<title>" --body-file <body-file>`.
   - Otherwise create one with `gh pr create --base <base-branch> --head <current-branch> --title "<title>" --body-file <body-file>`.
10. Remove the temporary body file and report the PR URL plus whether it was created or updated.

## Decision Rules

- Never force-push, merge, close, or delete a PR as part of this workflow.
- Never invent issue links, test results, reviewers, labels, milestones, or deployment details.
- Do not include secrets, tokens, or credentials in the title or body.
- Do not create a duplicate PR when one already exists for the current branch.
- If the branch has no committed changes compared with the base branch, report that there is nothing to publish.
- If `gh` fails, report the command and error without retrying destructive operations.
- Do not modify repository files, commit changes, or push branches unless the user explicitly asks for those actions.
