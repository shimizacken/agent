---
name: angular-formatting
description: 'Code formatting rules for Angular and TypeScript web apps. Use when writing or reviewing Angular code. Covers standalone components, brace style, blank line placement, and import organization.'
---

# Angular Formatting

## Rules

- Prefer standalone components, directives, and pipes unless the codebase requires NgModules
- Always use curly braces for `if`, `while`, and `for` bodies, even single-line ones
- Add a blank line between consecutive `if` statements
- Add a blank line between declaration blocks and the following statements or `return`
- Add a blank line before a `return` statement when it is not the only line in a block
- Keep templates focused on presentation and move business logic into the component or a service
- Prefer Angular control flow syntax such as `@if` and `@for` in codebases that support it
- Keep component metadata, class members, and lifecycle methods consistently ordered

## Examples

**Bad:**
```ts
const x = compute();
if (!x) return null;
const y = transform(x);
return y;
```

**Good:**
```ts
const x = compute();

if (!x) { return null; }

const y = transform(x);

return y;
```

**Bad** - consecutive `if` blocks with no spacing:
```ts
if (a) { return 1; }
if (b) { return 2; }
if (c) { return 3; }
```

**Good:**
```ts
if (a) { return 1; }

if (b) { return 2; }

if (c) { return 3; }
```

## Import Organization

Group imports in this order. Separate each group with a blank line. Use `import type` for type-only imports.

| # | Group | Example |
|---|-------|---------|
| 1 | Angular | `import { ChangeDetectionStrategy, Component } from '@angular/core'` |
| 2 | Other 3rd-party libraries | `import { Observable } from 'rxjs'` |
| 3 | Utils | `import { formatDate } from '../utils/date'` |
| 4 | Services | `import { ItemsService } from '../services/items.service'` |
| 5 | Components | `import { ItemListComponent } from '../components/item-list.component'` |
| 6 | Assets | `import logo from '../images/logo.svg'` |
| 7 | Types | `import type { Item } from '../types/item'` |
| 8 | Styles | `import './item-list.component.scss'` |

## Example

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { ItemsService } from '../services/items.service';

import type { Item } from '../types/item';

@Component({
  selector: 'app-item-list',
  standalone: true,
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemListComponent {
  readonly items = signal<Item[]>([]);
}
```
