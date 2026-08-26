---
name: e2e-testing
description: 'Conventions for writing Cypress e2e tests in this project. Use when adding a new spec file, adding test cases to an existing spec, or reviewing e2e tests for consistency. Covers selectors, TestID registration, custom commands, network stubs, fixture files, and spec structure.'
argument-hint: 'A short description of what feature or page to test'
---

# E2E Testing Conventions

All Cypress specs live under `cypress/e2e/`. New specs must be consistent with existing ones.

## Step 1 — Register TestIDs for New Elements

Before writing any `cy.get` calls, register every new element in `src/testID.ts`.

- Add a new entry to the `TestID` const object.
- Key: `PascalCase` matching the component name + role (e.g. `ChangelogDialogCloseButton`).
- Value: `kebab-case` string of the key (e.g. `'changelog-dialog-close-button'`).
- Keep entries in **alphabetical order** within their letter group.

```ts
// src/testID.ts
export const TestID = {
  // ...
  ChangelogDialogCloseButton: 'changelog-dialog-close-button',
  // ...
};
```

Then add `data-testid={TestID.ChangelogDialogCloseButton}` to the JSX element in the source.

## Step 2 — Write the Spec File

### File naming

`cypress/e2e/<feature-or-page-in-camelCase>.cy.ts`

### Import order

```ts
import { TestID } from '../../src/testID';

// App utils and constants — reuse instead of duplicating values
import { changelog } from '../../src/changelog/changelog';
import { CHANGELOG_BASE_KEY } from '../../src/constants/commonConstants';

// Cypress support constants
import { Alias, Fixtures, InterceptedURLs } from '../support/constants';
```

Never import `InterceptedURLs`, `Fixtures`, or `Alias` as plain strings. Always use the enums.

### Structure

```ts
// 1. Network stub helpers — defined outside describe, named clearly
const stubXxxNetworkRequests = () => {
  cy.intercept(InterceptedURLs.ApiAuth, { fixture: Fixtures.ApiAuth }).as(Alias.ApiAuth);
  // ...
};

// 2. describe block — one per feature/page
describe('<Feature> test suite', () => {
  beforeEach(() => {
    stubXxxNetworkRequests();
    // other shared setup (localStorage, custom URL, etc.)
  });

  it('should <expected behaviour>', () => {
    cy.visit('/route');
    // assertions
  });
});
```

### Extract setup logic into named functions

Logic inside `beforeEach`, `beforeAll`, or test body blocks that is longer than 1-3 lines must be extracted into a clearly named function defined outside the `describe` block.

```ts
// Fine inline — only 1 line
beforeEach(() => {
  cy.setChangeLogLocalStorageState();
});

// Good — extracted because it's more than 3 lines
const setChangelogStateWithUnread = (win: Window) => {
  win.localStorage.setItem(
    CHANGELOG_BASE_KEY,
    JSON.stringify({ lastSeen: -1, showUnreadChanges: true })
  );
};

beforeEach(() => {
  cy.window().then(setChangelogStateWithUnread);
});

// Bad — more than 3 lines left inline
beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.setItem(
      CHANGELOG_BASE_KEY,
      JSON.stringify({ lastSeen: -1, showUnreadChanges: true })
    );
  });
});
```

If the same helper is needed in more than one spec file, move it to a custom command in `cypress/support/commands.ts` instead (see Step 4).

## Step 3 — Selectors

**Always** use `cy.getByTestID` with the `TestID` enum. Never hardcode `data-testid` strings.

```ts
// Good
cy.getByTestID(TestID.ChangelogBadgeIndicator).should('exist');
cy.getByTestID(TestID.ChangelogButton).click();
cy.getByTestID(TestID.ChangelogEntry).should('have.length', changelog.length);

// Bad — hardcoded string
cy.get('[data-testid=changelog-badge-indicator]').should('exist');
```

For child elements that lack their own TestID, chain standard Cypress queries:

```ts
cy.getByTestID(TestID.ChangelogDialogAutoOpenCheckbox).find('input').should('be.checked');
```

## Step 4 — Custom Commands

Reuse existing commands from `cypress/support/commands.ts` before writing new stubs inline.

| Command | When to use |
|---|---|
| `cy.getByTestID(TestID.Xxx)` | Every element selection |
| `cy.preLoadData()` | Stubs pipes, systems, and datasets |
| `cy.stubNetworkConnectionRequests(apiEndpoint)` | Full network setup for a connected subscription |
| `cy.fixtureTestSubscription()` | Stubs `/subscriptions` with the test subscription |
| `cy.fixtureLicense({ apiEndpoint })` | Stubs the `/license` endpoint |
| `cy.setCustomURL(url?)` | Sets connection URL in localStorage |
| `cy.setChangeLogLocalStorageState(showUnreadChanges?)` | Sets changelog localStorage state |
| `cy.stubSocketIO()` | Returns a controllable fake socket for live-update tests |

### Adding a new custom command

1. Implement it in `cypress/support/commands.ts`:
   ```ts
   Cypress.Commands.add('myNewCommand', (arg: string) => {
     // implementation
   });
   ```
2. Declare it in `cypress/types.ts` inside the `Cypress.Chainable` interface:
   ```ts
   myNewCommand(arg: string): Chainable<void>;
   ```

## Step 5 — Network Stubs and Fixtures

- Use `cy.intercept` with `{ fixture: Fixtures.Xxx }` for static responses.
- Use `cy.intercept` with `{ statusCode, body }` for dynamic/error responses.
- Always alias intercepts with `.as(Alias.Xxx)` using the `Alias` enum.
- If a new fixture file is needed, add it under `cypress/fixtures/` and add a `Fixtures` enum entry in `cypress/support/constants.ts`.
- If a new URL is needed, add an `InterceptedURLs` enum entry in the same file.

## Step 6 — Reuse App Source Utilities

Import app-level constants and utilities directly instead of duplicating them:

```ts
// Good — reuse the real data
import { changelog } from '../../src/changelog/changelog';
cy.getByTestID(TestID.ChangelogEntry).should('have.length', changelog.length);

// Good — reuse the real key
import { CHANGELOG_BASE_KEY } from '../../src/constants/commonConstants';
win.localStorage.setItem(CHANGELOG_BASE_KEY, JSON.stringify({ ... }));

// Bad — duplicated magic values
cy.getByTestID(TestID.ChangelogEntry).should('have.length', 12);
win.localStorage.setItem('sesam--changelog', JSON.stringify({ ... }));
```

## Checklist Before Committing

- [ ] All new elements have a `TestID` entry and a matching `data-testid` attribute in JSX.
- [ ] `cy.getByTestID` used for every selector — no hardcoded strings.
- [ ] Custom commands reused where applicable; new commands declared in `cypress/types.ts`.
- [ ] Network intercepts use `InterceptedURLs`, `Fixtures`, and `Alias` enums.
- [ ] App constants and utils imported from `src/` — no duplicated magic values.
- [ ] Each `it` block tests one behaviour and has a descriptive name starting with `should`.
