---
name: service-function
description: 'Rules for writing stateful service functions in this project. Use when creating a new service, refactoring a service, or reviewing service structure. Covers the init pattern, Args/State/API types, currying for injectable dependencies, and pre-bound singleton exports.'
---

# Service Functions

> Also apply the [functional-coding-style](../functional-coding-style/SKILL.md) and [formatting](../formatting/SKILL.md) skills when writing or reviewing utils.

## Pattern

A service is a stateful closure returned by an `init<ServiceName>` function. It encapsulates mutable state and exposes a typed API interface.

```
init<ServiceName>(args) → ServiceAPI
```

If the service has **fixed dependencies** (e.g. storage functions, external clients) that should be injectable for testing, curry:

```
init<ServiceName>(deps) → (args) → ServiceAPI
```

---

## Type Definitions

Define three types per service. Export `Args` and `API`; keep `State` unexported.

### Args type
Input parameters passed at initialization time.

```ts
export type <ServiceName>Args = {
  // initialization inputs
};
```

### State type (unexported)
Internal mutable state managed inside the closure. Not part of the public API.

```ts
type <ServiceName>State = {
  // internal mutable fields
};
```

### API type
The interface returned by the init function. All public methods go here.

```ts
export type <ServiceName>API = {
  getSomething: () => Something;
  setSomething: (value: Something) => void;
};
```

---

## Implementation

```ts
export const init<ServiceName> = (args: <ServiceName>Args): <ServiceName>API => {
  const state: <ServiceName>State = {
    // initialise from args
  };

  const getSomething = () => state.something;

  const setSomething = (value: Something) => {
    state.something = value;
  };

  return {
    getSomething,
    setSomething,
  };
};
```

---

## Currying — when deps are injectable

Use when the service depends on external functions (storage, clients, fetch) that need to be swapped in tests.

```ts
export type <ServiceName>Deps = {
  read: typeof realReadFn;
  write: typeof realWriteFn;
};

export const init<ServiceName> =
  (deps: <ServiceName>Deps) =>
  (args: <ServiceName>Args): <ServiceName>API => {
    const { read, write } = deps;

    // ... closure over deps and args
  };
```

Export a pre-bound singleton with real dependencies:

```ts
export const <serviceName>Service = init<ServiceName>({
  read: realReadFn,
  write: realWriteFn,
});
```

---

## Naming

- **API methods** — use a verb prefix: `get`, `build`, `calculate`, `remove`, `set`, `clear`, etc.
- **Init function** — always `init<ServiceName>`, e.g. `initChangelogService`, `initPersistURLService`
- **Curried init** — when deps are injected, the function is still named `init<ServiceName>Service`, e.g. `initChangelogService`

---

## Rules

- Name the init function `init<ServiceName>` — e.g. `initChangelogService`, `initPersistURLService`
- Always define `Args`, `State`, and `API` types — even if they're small
- Keep `State` unexported — it is an implementation detail
- Never expose the `state` object directly through the API
- Mutate state only inside the service closure — never outside
- Curry when deps need to be injected; keep the curried dep object as a separate `Deps` type
- Export a pre-bound singleton when there is a clear default set of real deps
- **Inject all dependencies** — never call external functions (storage, fetch, timers) directly inside the service; receive them via `Deps`. The service itself must be free of side effects — its state lives only in memory, not in the outside world
- **Fully unit test every method** with Vitest — inject test doubles for all deps, then assert on the returned API's behaviour

## Full Vitest Coverage

Every service must have a co-located test file at `src/services/<name>.service.test.ts`.

- Create the service with test doubles for all `Deps`
- Test every method on the returned `API`
- Cover the happy path, edge cases (empty/null args), and state transitions (call method A, assert method B reflects the change)
- Never test the pre-bound singleton directly — test the `init` function with injected deps

```ts
describe('init<ServiceName>', () => {
  const makeDeps = (): <ServiceName>Deps => ({
    read: vi.fn(),
    write: vi.fn(),
  });

  it('returns initial state via getter', () => {
    const service = init<ServiceName>(makeDeps())({ /* args */ });
    expect(service.getSomething()).toBe(expectedInitialValue);
  });

  it('updates state after setter is called', () => {
    const service = init<ServiceName>(makeDeps())({ /* args */ });
    service.setSomething('new-value');
    expect(service.getSomething()).toBe('new-value');
  });
});
```

## Checklist

Before committing a new or changed service:

- [ ] `init<ServiceName>` function defined and exported
- [ ] `Args` type exported
- [ ] `State` type defined (unexported)
- [ ] `API` type exported with all public methods declared
- [ ] Curried if any external dependencies are injected
- [ ] `Deps` type defined if curried
- [ ] Pre-bound singleton exported with real deps (if applicable)
- [ ] State is never directly exposed through the API
- [ ] All state mutations happen inside the closure only
- [ ] All deps injected via `Deps` \u2014 no direct calls to storage, fetch, or timers inside the service
- [ ] Test file exists at `src/services/<name>.service.test.ts`
- [ ] Every API method tested with injected test doubles
- [ ] State transitions covered (set then get)
