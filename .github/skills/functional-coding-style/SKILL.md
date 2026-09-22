---
name: functional-coding-style
description: 'Coding style guidelines for this project. Functional programming principles take precedence, followed by SRP, and then testability. Use when writing new functions, refactoring code, or reviewing code structure. Guides how to separate pure logic from side effects, keep functions single-purpose, and write browser-free testable code.'
---

# Functional Coding Style

## Principles

### Be as Functional as Possible
- Prefer **pure functions** - same input always produces the same output, no side effects
- Isolate I/O and browser API calls (`chrome.*`, `document.*`) at the edges of the system
- Pass dependencies as parameters instead of reading globals
- Avoid mutating arguments; return new values instead
- **Prefer arrow functions** over `function` declarations for all helpers, callbacks, and exported utilities

### Single Responsibility Principle (SRP)
- Each function or module does **exactly one thing**
- Split: logic / DOM manipulation / storage access into separate functions
- If a function name contains "and", it probably does too much - split it

### Testability First
- Write business logic as pure transforms that can be unit-tested without a browser
- No implicit globals - inject `chrome`, `document`, or `window` as parameters where needed
- Side-effectful wiring (event listeners, `chrome.storage` calls, DOM queries at startup) belongs in a thin top-level layer, not in logic functions

## Structure Pattern

```
pure logic functions     ← unit-testable, no browser APIs
        ↓
side-effect functions    ← call chrome.*, document.*, etc.
        ↓
thin wiring layer        ← connects events → logic → side effects
```

## Examples

**Bad** - logic mixed with side effects:
```ts
function updateTheme(themeId: string) {
  const css = themes[themeId]; // reads global
  chrome.scripting.insertCSS({ css }); // side effect
  document.getElementById('label')!.textContent = themeId; // DOM mutation
}
```

**Good** - separated:
```ts
// Pure logic
const buildCssForTheme = (themes: Record<string, string>, themeId: string): string =>
  themes[themeId] ?? '';

// Side effect
const applyThemeCss = (css: string, tabId: number): Promise<void> =>
  chrome.scripting.insertCSS({ target: { tabId }, css });

// DOM mutation
const setThemeLabel = (el: HTMLElement, themeId: string): void => {
  el.textContent = themeId;
};
```
