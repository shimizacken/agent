# Plan: npx Installer for Copilot Instructions and Skills

## Goal

Make this repo runnable via `npx github:shimizacken/agent` so that it copies
`.github/copilot-instructions.md` and `.github/skills/` into any target project.

No npm publish needed - npx resolves the package directly from the private GitHub
repo. Authentication uses the caller's existing GitHub SSH or token setup.

## Constraints

- Zero runtime dependencies - use only Node.js built-ins (`fs`, `path`, `readline`)
- The install script must be idempotent - re-running overwrites existing files
- The package ships the actual `.github/` folder as its template source
- No build step required - the script runs directly as plain Node.js

---

## Phase 1 - Init the npm package

**Commit:** `chore: init npm package for npx installer`

### Files touched

- `package.json` (new)

### What to do

Create `package.json` with:

```json
{
  "name": "agent",
  "version": "1.0.0",
  "description": "Install GitHub Copilot instructions and skills into a project",
  "bin": {
    "agent": "./bin/install.js"
  },
  "files": [
    "bin/",
    ".github/copilot-instructions.md",
    ".github/skills/"
  ],
  "engines": {
    "node": ">=18"
  },
  "license": "MIT"
}
```

The `name` field matches the GitHub repo name. npx resolves the bin entry
automatically when the name matches.

### Verify

```
node -e "const p = require('./package.json'); console.assert(p.bin, 'bin missing')"
```

---

## Phase 2 - Add the install CLI script

**Commit:** `feat: add npx install script`

### Files touched

- `bin/install.js` (new)

### What to do

Create `bin/install.js` as an executable Node.js script. It must:

1. Resolve the template source directory as `path.join(__dirname, '..', '.github')`
2. Resolve the target as `path.join(process.cwd(), '.github')`
3. Recursively copy all files from source to target, creating directories as needed
4. Log each file written with a short relative path
5. Print a success summary when done

Add the shebang line `#!/usr/bin/env node` as the first line.

Use only `fs` (including `fs.cpSync` with `{ recursive: true }` for Node 18+) and `path`.

### Verify

```
node bin/install.js
ls .github/copilot-instructions.md .github/skills/
```

---

## Phase 3 - Add a smoke test for the installer

**Commit:** `test: add smoke test for install script`

### Files touched

- `bin/install.test.js` (new)

### What to do

Write a test using Node's built-in `node:test` and `node:assert` modules (no test framework needed).

The test should:
1. Create a temp directory with `fs.mkdtempSync`
2. Spawn `node bin/install.js` with `cwd` set to the temp directory
3. Assert exit code is `0`
4. Assert `.github/copilot-instructions.md` exists in the temp directory
5. Assert `.github/skills/conventional-commits/SKILL.md` exists in the temp directory
6. Clean up the temp directory in an `after` hook

Add a `test` script to `package.json`:

```json
"scripts": {
  "test": "node --test bin/install.test.js"
}
```

### Verify

```
node --test bin/install.test.js
```

---

## Phase 4 - Document npx usage in README

**Commit:** `docs: add npx installation instructions to README`

### Files touched

- `README.md`

### What to do

Add a `## Installation` section near the top of `README.md` with:

- The one-liner `npx github:shimizacken/agent` command
- What it installs and where
- A note that callers need GitHub access (SSH key or a `GH_TOKEN` env var)
- A brief note on what gets copied (copilot-instructions.md + skills/)

### Verify

```
node -e "const fs = require('fs'); const r = fs.readFileSync('README.md', 'utf8'); console.assert(r.includes('npx github:shimizacken/agent'), 'npx command missing from README')"
```
