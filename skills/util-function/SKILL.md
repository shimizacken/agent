---
name: util-function
description: 'Rules for writing utility functions in this project. Use when adding a new util, refactoring a util, or writing tests for a util. Covers functional style, pure functions, argument limits, currying, and full Vitest coverage requirements.'
---

# Utils Functions

> Also apply the [functional-coding-style](../functional-coding-style/SKILL.md) and [formatting](../formatting/SKILL.md) skills when writing or reviewing utils.

## Rules

### Pure Functions
- Every util must be a **pure function**: same inputs always produce the same output, no side effects
- No reading or writing globals, no mutations of arguments
- Return a new value; never modify what was passed in

### Argument Limit
- **Max 2 positional arguments**
- When a function needs more than 2 inputs, choose one of:
  - **Options object** — group related params into a single typed object
  - **Curried function** — split into a chain of single-arg functions

#### Options object (3+ unrelated params)
```ts
type FormatPipeNameOptions = {
  id: string;
  prefix: string;
  separator: string;
};

const formatPipeName = ({ id, prefix, separator }: FormatPipeNameOptions): string =>
  `${prefix}${separator}${id}`;
```

#### Curried function (when partial application makes sense)
```ts
const buildDownstreamFilter =
  (datasetToDownstreamPipeIds: DatasetToDownstreamPipeIds) =>
  (pipeId: string): string[] =>
    datasetToDownstreamPipeIds[pipeId] ?? [];
```

### Functional Style
- **Always use arrow functions** — never `function` declarations or `function` expressions
- **No braces for single-expression functions** — omit `{}` and `return` when the body is one expression:
  ```ts
  // Bad
  const double = (n: number): number => { return n * 2; };

  // Good
  const double = (n: number): number => n * 2;
  ```
- Prefer expression bodies (`=>`) over block bodies (`=> { return ... }`)
- Use `map`, `filter`, `reduce` instead of `for` loops
- Use `??` / `?.` instead of `if`/`else` null guards where it reads clearly
- No intermediate mutable variables — compose transforms instead

## Location and Naming

### Function Naming

- **Exported functions** — use a verb prefix: `get`, `build`, `calculate`, `remove`, etc.
- **Curried factories** — when a util returns another function (partial application), name it `get<FnName>Fn`, e.g. `getDownstreamFilterFn`, `getPipeNameFormatterFn`

### File Naming

Util files live under `src/utils/` and follow the `*.utils.ts` / `*.utils.test.ts` naming pattern:

```
src/utils/<domain>.utils.ts
src/utils/<domain>.utils.test.ts
```

Examples:
- `src/utils/flows.utils.ts` and `src/utils/flows.utils.test.ts`
- `src/utils/pipes.utils.ts` and `src/utils/pipes.utils.test.ts`

## Full Vitest Coverage

Every util file must have a co-located test file at `src/utils/<domain>.utils.test.ts`.

### Coverage Requirements
- **Every exported function** must have at least one test
- **Happy path** — typical input, expected output
- **Edge cases** — empty arrays, `undefined`/`null` inputs, zero, empty string
- **Boundary values** — single-element arrays, maximum expected values

### Test File Structure
```ts
import { describe, it, expect } from 'vitest';
import { myUtil } from './myUtil';

describe('myUtil', () => {
  it('returns expected output for typical input', () => {
    expect(myUtil('foo')).toBe('expected');
  });

  it('returns fallback for empty input', () => {
    expect(myUtil('')).toBe('');
  });
});
```

### No Mocks for Pure Functions
Pure functions have no side effects — test them directly without mocking.
Only mock when the function under test calls a side-effectful dependency that was explicitly injected.

## Checklist

Before committing a new or changed util:

- [ ] Function is pure (no side effects, no mutation)
- [ ] 2 or fewer positional args (options object or currying used if more needed)
- [ ] Expression body used where possible
- [ ] Loops replaced with `map`/`filter`/`reduce`
- [ ] Test file exists alongside the util file
- [ ] All exported functions have tests
- [ ] Happy path covered
- [ ] Edge cases covered (empty, null/undefined, boundary values)
- [ ] `vitest run` passes with no failures
