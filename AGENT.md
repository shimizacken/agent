# AGENT.md

## Table Of Contents

1. [Purpose](#purpose)
2. [Documentation Split](#documentation-split)
3. [Instruction Design Principles](#instruction-design-principles)
4. [What High-Value Instructions Usually Cover](#what-high-value-instructions-usually-cover)
5. [Default Paradigm](#default-paradigm)
6. [Reusable Baseline](#reusable-baseline)
7. [Folder Structure](#folder-structure)
8. [Code Style](#code-style)
9. [Code Conventions](#code-conventions)
10. [Accessibility](#accessibility)
11. [Testing](#testing)
12. [Git And Planning](#git-and-planning)
13. [Template For Repo-Specific Sections](#template-for-repo-specific-sections)
14. [Minimal Repo-Specific Skeleton](#minimal-repo-specific-skeleton)
15. [Relationship To Copilot Instructions](#relationship-to-copilot-instructions)

## Purpose

Use this file as the deeper operating guide for a repository. It is intentionally broader than the Copilot instructions file and is allowed to capture workflow, architecture, and editing conventions in more detail.

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

## Default Paradigm

Use functional programming as the default paradigm unless the target repository clearly requires something else.

- prefer small, composable functions
- prefer explicit data flow over hidden mutable state
- keep impure code at boundaries
- pass dependencies as arguments instead of reaching into globals when practical
- use pipeline design patterns where possible
- prefer transformation pipelines and derived values over stateful orchestration when both are equally clear

In JavaScript and TypeScript, pipelines can be implemented in a few practical ways:

- use native array methods like `map`, `filter`, and `reduce` when the flow is simple
- use small custom composition helpers when the repo does not already depend on a pipeline utility
- use utilities such as `lodash/flow` when the target repository already uses Lodash

```ts
const normalizeName = (value: string) => value.trim().toLowerCase();
const prefixUser = (value: string) => `user:${value}`;

const userId = prefixUser(normalizeName('  Alice '));
```

```ts
const pipe =
  <T>(...fns: Array<(value: T) => T>) =>
  (value: T) =>
    fns.reduce((currentValue, fn) => fn(currentValue), value);

const normalizeName = (value: string) => value.trim();
const toLowerCase = (value: string) => value.toLowerCase();
const prefixUser = (value: string) => `user:${value}`;

const buildUserId = pipe(normalizeName, toLowerCase, prefixUser);
```

```ts
import flow from 'lodash/flow';

const buildUserId = flow([normalizeName, toLowerCase, prefixUser]);
```

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
- use FP as the default style for application and utility code

### Types And APIs

- prefer precise types over `any`
- make nullability explicit
- keep external API assumptions narrow and validated
- centralize shared constants instead of repeating magic strings

### Tests

- add or update tests when behavior changes materially
- prefer deterministic tests with mocked boundaries
- avoid adding brittle tests that only mirror implementation details

## Folder Structure

Prefer a flat folder structure with explicit folders when the target repository does not already enforce a different architecture.

Typical top-level source folders:

- `api`
- `utils`
- `services`
- `containers`
- `pages`
- `components`
- `constants`
- `hooks`
- `hoc`
- `assets`
- `network`
- `style`

The goal is discoverability: each folder should communicate responsibility clearly without creating deep, ambiguous nesting.

## Code Style

Prefer a code style that optimizes for readability over terseness.

- keep a blank line before and after control-flow statements when it improves readability
- keep a blank line before `return` when it closes a logical block
- avoid `return` where possible in simple expression-bodied functions
- use braces for `if`, `else`, loops, and similar control-flow statements
- prefer early returns over deeply nested branching
- prefer explicit names over abbreviated names
- keep functions focused and short when practical
- prefer named exports when the target repository allows them
- avoid clever one-liners that reduce readability

### Import Order

Organize imports in logical groups, from more external to more local:

1. third-party packages
2. vanilla logic and state management
3. hooks
4. pages
5. containers
6. views
7. assets
8. styles

Keep each group together and separate groups with a blank line when the file has enough imports for grouping to improve readability.

## Code Conventions

Use compact, enforceable conventions. If a target repo already has stronger local conventions, prefer the repo.

### Naming Conventions

#### Vanilla Modules

| Type | Filename / Folder | Suffix | Example |
| --- | --- | --- | --- |
| Vanilla TS/JS module | camelCase | `*.ts` / `*.js` | `sessionValidator.ts` |
| Util | camelCase | `*.utils.ts` | `entities.utils.ts` |
| API module | camelCase | `*.api.ts` | `entities.api.ts` |
| Service | camelCase | `*.service.ts` | `billing.service.ts` |
| Types | camelCase | `*.types.ts` | `user.types.ts` |

#### React Files And Folders

| Type | Filename / Folder | Suffix | Example |
| --- | --- | --- | --- |
| Page | PascalCase | `*.page.tsx` | `Dashboard.page.tsx` |
| Container | PascalCase | `*.container.tsx` | `UserList.container.tsx` |
| View component | PascalCase | `*.view.tsx` | `UserList.view.tsx` |
| Story | PascalCase | `*.stories.tsx` | `Button.stories.tsx` |
| Component folder | PascalCase | - | `UserCard` |

#### Tests

| Type | Filename / Folder | Suffix | Example |
| --- | --- | --- | --- |
| Unit test | mirror target file | `*.test.ts` / `*.test.tsx` | `entities.utils.test.ts` |
| E2E test | camelCase | `*.cy.ts` / `*.cy.tsx` | `dashboard.cy.ts` |

- unit test files should live next to the file they test
- for example, `entities.utils.ts` and `entities.utils.test.ts` should sit side by side

#### Styles And Assets

| Type | Filename / Folder | Suffix | Example |
| --- | --- | --- | --- |
| JSON | camelCase | `*.json` | `packageSettings.json` |
| Component styles | PascalCase | `*.module.scss` / `*.css` | `Button.module.scss` |
| Partial SCSS | underscore + camelCase | `*.scss` | `_variables.scss` |
| Image | snake_case | `*.png` | `logo_icon.png` |
| SVG | kebab-case | `*.svg` | `logo-icon.svg` |

### Vanilla JS/TS

#### Utils

- utilities should be generic and reusable
- utilities should be pure functions
- utilities should be small, focused, and easy to test
- use currying when it improves composition and reuse
- pass dependencies and required values as arguments
- avoid coupling utilities to framework runtime or app state when possible

```ts
type User = {
  role: string;
};

export const hasRole =
  (requiredRole: string) =>
  (user: User) =>
    user.role === requiredRole;

const isAdmin = hasRole('admin');
```

```ts
export const mapWith =
  <TInput, TOutput>(mapper: (value: TInput) => TOutput) =>
  (values: TInput[]) =>
    values.map(mapper);

const getNames = mapWith((user: { name: string }) => user.name);
```

#### Types

- use dedicated `*.types.ts` files for shared domain types when the types are reused
- keep types close to the domain they describe
- prefer explicit names over generic names like `Data` or `Item`
- separate external API shapes from internal domain shapes when they differ

#### Services

- use `*.service.ts` only when a real stateful or boundary-oriented abstraction is needed
- a service should expose a clear, intention-revealing API
- inject external dependencies into services
- keep business logic testable without real network, storage, or framework dependencies
- do not create services for simple stateless helpers that belong in utils

### React

#### Functional Components

- prefer functional components only
- do not introduce class components
- keep components explicit and easy to follow
- prefer inline props for components unless the props type is reused or large enough to hurt readability
- prefer named exports
- keep hooks, rendering logic, and side effects separated when possible

```tsx
export const MuteButton: React.FC<{
  isMuted: boolean;
  className?: string;
  onClick: () => void;
}> = ({ isMuted, className, onClick }) => (
  <button
    type="button"
    className={classNames(styles.muteButton, className)}
    onClick={onClick}
    aria-label={isMuted ? 'Unmute station' : 'Mute station'}
  >
    <span className={styles.muteButtonIcon} aria-hidden="true">
      {isMuted ? 'no_sound' : 'volume_mute'}
    </span>
  </button>
);

```

#### Component Types

| Type | Responsibility | Notes |
| --- | --- | --- |
| `components` | presentational UI | prefer `*.view.tsx` for pure display components |
| `containers` | stateful orchestration and integration | connect hooks, services, stores, signals, or APIs |
| `pages` | route-level composition | compose containers and views into screens |

Use the split above when it helps clarity. If a target repo already uses a simpler structure, follow the repo instead of forcing extra layers.

- story files should live next to the view they describe
- for example, `Button.view.tsx` and `Button.stories.tsx` should sit side by side

## Accessibility

Accessibility should be treated as a default quality requirement, not a later enhancement.

- prefer semantic HTML before ARIA workarounds
- use buttons for actions and links for navigation
- ensure interactive elements are keyboard accessible
- ensure focus states are visible and not removed without replacement
- use accessible names for buttons, inputs, links, and other controls
- associate labels with form fields
- provide alt text for meaningful images and empty alt text for decorative images
- do not rely on color alone to communicate meaning
- ensure error states and validation messages are available to assistive technologies
- prefer headings in a logical hierarchy
- test critical flows with keyboard navigation

## Testing

Testing should be treated as part of the change, not an afterthought.

- add or update tests when logic or user-visible behavior changes
- prefer unit tests for pure logic, hooks, utilities, and service behavior
- prefer component tests or story coverage for reusable UI behavior when that exists in the target repo
- prefer end-to-end tests for critical user flows, integration boundaries, and regression coverage
- keep tests deterministic by mocking time, randomness, network, storage, and browser-only boundaries when needed
- avoid brittle assertions tied to implementation details
- prefer clear arrange-act-assert structure
- if test coverage is intentionally skipped, say why

## Git And Planning

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
6. Folder Structure
7. Code Style
8. Naming Conventions
9. Hard Constraints
10. Testing Guidance
11. Known Pitfalls
12. Practical Editing Guidance

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

## Folder Structure

Important directories and what belongs in them.

## Code Style

Formatting and readability rules that should be applied consistently.

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
