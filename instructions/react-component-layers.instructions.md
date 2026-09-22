---
name: react-component-layers
description: Define page, container, and view boundaries for React components in this project.
applyTo: "**/*.tsx"
---

# React Component Layers

Use three layers when structuring React features. Name files with the matching suffix: `*.page.tsx`, `*.container.tsx`, or `*.view.tsx`.

## Page

A page is the route-level composition layer.

Allowed:

- Compose the page layout from containers and views.
- Define route-level configuration and page-specific static content.
- Pass route parameters or simple page inputs to child components.

Not allowed:

- Business logic, data fetching, or state management.
- Side effects, store access, or service/API calls.
- Direct CSS imports or inline styles.
- Importing a page into another page, container, or view.

## Container

A container is the stateful orchestration layer.

Allowed:

- Read from and write to application state using the established hooks.
- Own local state, effects, event handlers, data fetching, and business logic.
- Transform state or service results into the props required by views.
- Compose containers and views.

Not allowed:

- Importing or rendering pages.
- Direct CSS imports or inline styles.
- Moving presentational markup into the container when a view can own it.

## View

A view is the presentational UI layer.

Allowed:

- Render markup, styles, accessibility attributes, and visual states from props.
- Accept callbacks as props for user interactions.
- Compose other views or presentational primitives.
- Keep display-only transformations close to the rendered UI.

Not allowed:

- Side effects, data fetching, business logic, or application state management.
- Imports from stores, services, APIs, or containers/pages.
- Reading from or dispatching to global state.
- Direct access to routing, browser storage, or other external systems.

## Dependency Direction

Keep dependencies flowing downward: pages may use containers and views, containers may use containers and views, and views may use views or presentational primitives. Prefer named exports and keep each component focused on one layer's responsibility.
