# CLAUDE.md

## Commands

Replace these with your project's actual commands:

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint`

- Skills are located in `.claude/skills/` - see the `conventional-commits`, `formatting`, and `functional-coding-style` skills

## Engineering Rules

- follow the existing codebase before introducing new abstractions
- prefer small, local changes over broad rewrites
- preserve existing naming, folder, and architectural conventions
- use FP as the default paradigm unless the repo clearly requires otherwise
- prefer precise types over `any`
- make nullable or optional behavior explicit
- keep side effects near boundaries and keep helpers pure when practical

## Code Conventions

- prefer `camelCase` for vanilla JS/TS modules (utils, types, APIs, services)
- prefer `PascalCase` for React pages, containers, views, and stories
- prefer functional components only
- use `*.page.tsx` for route-level composition
- use `*.container.tsx` for stateful orchestration
- use `*.view.tsx` for presentational components
- use `*.utils.ts` for reusable stateless helpers
- use `*.types.ts` for shared types
- prefer arrow functions over `function` declarations

## Testing

- add or update tests when behavior changes materially
- prefer deterministic unit tests for logic-heavy code
- prefer end-to-end tests for user flows and integration boundaries
- avoid brittle tests that assert implementation details

## Git

- use conventional commits for all commit messages
- allowed types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`, `ci`, `revert`

## Avoid

- introducing large abstractions without clear need
- mixing unrelated refactors into task-focused changes
- duplicating business rules in multiple places
- replacing established local patterns with personal preference
- introducing classes or OOP-heavy patterns when a functional approach is sufficient
