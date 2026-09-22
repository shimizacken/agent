---
name: pr-description
description: Generate or update a consistent GitHub pull request description from the current branch changes. Use for PR descriptions, pull request summaries, or the PD shortcut.
argument-hint: '[YTC|YTP] {YouTrack link}'
user-invocable: true
---

# Pull Request Description

Generate or update a concise, factual GitHub pull request description from the current branch changes.

## Process

1. Identify the current branch and its merge base with the target branch, normally the repository default branch.
2. Inspect the complete diff and commit history from the merge base.
3. Check repository PR templates or contribution guidance when available.
4. Use the branch issue identifier in the title or summary when one is present.
5. Determine whether the branch implements a plan file and identify its path.
6. Treat uncommitted worktree changes as pending work, not completed changes.
7. Check for an existing PR for the current branch with `gh pr view --json number,url,state`. Update it when it exists; otherwise create one.
8. Do not claim tests, builds, reviews, or behavior that cannot be verified from the available context.

## Output Format

# <Issue ID>: <Short PR title>

If the PR implements a plan, place this line immediately below the title:

Implements plan: `<path to plan file>`

Then return exactly these sections:

## Summary

One or two sentences describing the purpose and user-visible or operational outcome.

## Changes

- List the important implementation or configuration changes.
- Group closely related changes together.
- Omit routine file-by-file narration.

## Testing

- List each test, build, lint, audit, or validation command that was actually run.
- State clearly when validation was not run.

## Risks And Follow-up

- List relevant compatibility risks, migration notes, known limitations, or follow-up work.
- Write `None identified.` when there are no meaningful items.

## Rules

- Keep the description concise and suitable for a GitHub pull request.
- Describe behavior and intent before implementation details.
- Use neutral, professional language.
- Use bullets for changes, testing, and risks.
- Do not invent issue links, test results, reviewers, or deployment details.
- Do not modify repository files, commit, or force-push while generating the description.

## GitHub CLI Actions

- Require `gh` to be installed and authenticated before creating or updating a PR.
- If `gh` is not installed or not authenticated, stop and respond with: "GitHub CLI (`gh`) is not installed or not authenticated. Run `gh auth login` before proceeding." Do not attempt to create or update the PR.
- Detect the default branch with `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and use it as the base when no explicit base is specified.
- When an existing PR is found, update its title and body with `gh pr edit <number> --title "<title>" --body-file <generated-body-file>`.
- When no PR exists, create one with `gh pr create --base <merge-base-branch> --head <current-branch> --title "<title>" --body-file <generated-body-file>`.
- Do not create a duplicate PR when one already exists for the current branch.
- Return the PR URL and whether it was created or updated.
