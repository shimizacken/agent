---
name: formatting
description: 'Code formatting rules for this project. Use when writing or reviewing any TypeScript/JavaScript code. Covers brace style, blank line placement between declarations, statements, and returns.'
---

# Formatting

## Rules

- Always use curly braces for `if`, `while`, and `for` bodies — even single-line ones
- Add a blank line between consecutive `if` statements
- Add a blank line between declaration blocks and the following statements or `return`
- Add a blank line before a `return` statement when it is not the only line in a block

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

**Bad** — consecutive `if` blocks with no spacing:
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

Group imports in this order. Separate each group with a **blank line**. Use `import type` for type-only imports.

| # | Group | Example |
|---|-------|---------|
| 1 | React | `import React, { useState } from 'react'` |
| 2 | Other 3rd-party libraries | `import { useDispatch } from 'react-redux'` |
| 3 | Utils | `import { formatDate } from '../../utils/date'` |
| 4 | Services | `import { fetchItems } from '../../services/items'` |
| 5 | Hooks | `import { useItems } from '../../hooks/useItems'` |
| 6 | Pages | `import { HomePage } from '../../pages/Home'` |
| 7 | Containers | `import { ItemsContainer } from '../../containers/Items'` |
| 8 | Views / Components | `import { Button } from '../../components/Button'` |
| 9 | Assets | `import logo from '../../images/logo.svg'` |
| 10 | Types | `import type { Item } from '../../types/item'` |
| 11 | Styles | `import '../../style/component.css'` |

**Example:**
```ts
import React, { useState } from 'react';

import { pipe } from '../utils/common.utils';

import { useLogFile } from '../hooks/useLogFile.hook';

import { ReportView } from '../components/ReportView/Report.view';

import type { ReportSummary } from '../types/cypressLog.types';

import './App.scss';
```
