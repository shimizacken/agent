# GitHub Copilot Instructions

Use this file as the short, always-on instruction layer for a repository. It should be stricter and shorter than `AGENT.md`.

## Intent

- follow the existing codebase before introducing new abstractions
- prefer small, local changes over broad rewrites
- keep generated code explicit, readable, and easy to review
- avoid speculative refactors unless the task asks for them

## Documentation Split

- keep `README.md` product-facing
- keep deeper agent workflow and repository guidance in `AGENT.md`
- keep this file limited to rules that must apply in almost every Copilot response

## Default Engineering Rules

- preserve existing naming, folder, and architectural conventions
- use FP as the default paradigm unless the repo clearly requires otherwise
- prefer precise types over `any`
- make nullable or optional behavior explicit
- centralize shared constants instead of repeating magic strings
- keep side effects near boundaries and keep helpers pure when practical
- add or update tests when behavior changes materially
- prefer deterministic tests over environment-dependent tests

## Code Conventions

- prefer `camelCase` for vanilla JS/TS modules such as utils, types, APIs, and services
- prefer `PascalCase` for React pages, containers, views, and stories
- prefer functional components only
- use `*.page.tsx` for route-level composition
- use `*.container.tsx` for stateful orchestration
- use `*.view.tsx` for presentational components
- use `*.utils.ts` for reusable stateless helpers
- use `*.types.ts` for shared types
- use `*.service.ts` only when a real service abstraction is needed

## Testing

- add or update tests when behavior changes materially
- prefer deterministic unit tests for logic-heavy code
- prefer end-to-end tests for user flows and integration boundaries
- avoid brittle tests that assert implementation details

## Avoid

- introducing large abstractions without clear need
- mixing unrelated refactors into task-focused changes
- duplicating business rules in multiple places
- replacing established local patterns with personal preference
- generating placeholder architecture that the repo does not already use
- introducing classes or OOP-heavy patterns when a functional approach is sufficient

## Expected Repo Customization

When adapting this file for a specific repository, add only the highest-value repo-specific rules:

- required package manager
- stack-specific constraints
- naming or export conventions
- required test tools or test style
- banned patterns that commonly regress the codebase

If a rule needs a long explanation, move it to `AGENT.md` and link to it from here.
