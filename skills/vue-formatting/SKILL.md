---
name: vue-formatting
description: 'Code formatting rules for Vue and TypeScript/JavaScript web apps. Use when writing or reviewing Vue code. Covers script setup, brace style, blank line placement, and component organization.'
---

# Vue Formatting

## Rules

- Use `<script setup lang="ts">` for Vue components unless the codebase requires the Options API
- Always use curly braces for `if`, `while`, and `for` bodies, even single-line ones
- Add a blank line between consecutive `if` statements
- Add a blank line between declaration blocks and the following statements or `return`
- Add a blank line before a `return` statement when it is not the only line in a block
- Keep Vue SFC sections ordered as `<script>`, `<template>`, then `<style>`
- Keep component logic in `<script setup>` and keep templates focused on presentation

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
| 1 | Vue | `import { computed, ref } from 'vue'` |
| 2 | Other 3rd-party libraries | `import { useRoute } from 'vue-router'` |
| 3 | Utils | `import { formatDate } from '../utils/date'` |
| 4 | Services | `import { fetchItems } from '../services/items'` |
| 5 | Composables | `import { useItems } from '../composables/useItems'` |
| 6 | Components | `import { ItemList } from '../components/ItemList.vue'` |
| 7 | Assets | `import logo from '../images/logo.svg'` |
| 8 | Types | `import type { Item } from '../types/item'` |
| 9 | Styles | `import '../style/component.css'` |

## Example

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';

import { formatDate } from '../utils/date';

import { useItems } from '../composables/useItems';

import type { Item } from '../types/item';

import './ItemList.css';
</script>
```
