---
name: create-release
description: Cut a new semver-tagged release and publish it with the gh CLI. Use when asked to release, cut a version, tag a release, or publish a new version of this package.
argument-hint: '[major|minor|patch|vX.Y.Z]'
user-invocable: true
---

# Create Release

Cut a new version tag and publish a GitHub release using the `gh` CLI.

## Process

1. Confirm the worktree is clean and the current branch is up to date with its upstream (`git status --short --branch`). Stop and report if there are uncommitted changes or the branch is behind.
2. List existing version tags with `git tag --sort=-v:refname --list 'v*.*.*'` to find the current highest version. Treat no matching tags as a starting point of `v0.0.0`.
3. Determine the next version:
   - If the user gave an explicit `vX.Y.Z`, use it after validating it is greater than the current highest tag.
   - If the user gave `major`, `minor`, or `patch`, bump the corresponding segment of the current highest version.
   - If nothing was specified, ask which bump type to use rather than guessing.
4. Update the `version` field in `package.json` to the new version (without the `v` prefix) if it does not already match.
5. Collect release notes: run `git log <previous-tag>..HEAD --oneline` (or full history if there is no previous tag) and summarize the changes grouped by conventional commit type (feat, fix, chore, etc.).
6. Show the proposed version, `package.json` diff, and release notes summary, and ask for confirmation before tagging.
7. After confirmation:
   - Commit the `package.json` version bump if it changed: `git commit -m "chore(release): vX.Y.Z"`.
   - Create an annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`.
   - Push the branch and the tag: `git push && git push origin vX.Y.Z`.
8. Publish the GitHub release with the collected notes:
   ```
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "<release notes>"
   ```
9. Note that pushing the `vX.Y.Z` tag triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml), which force-moves the `latest` tag to this commit. Do not move the `latest` tag manually.
10. Report the final tag, release URL from `gh release create`, and confirm the `latest` tag will update once the workflow runs.

## Decision Rules

- Never push a version tag lower than or equal to the current highest tag.
- Never force-push or delete existing version tags.
- If `gh` is not authenticated, report the exact blocker instead of retrying.
- If the worktree has unrelated pending changes, stop and ask before proceeding.
