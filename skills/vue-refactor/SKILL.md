---
name: vue-refactor
description: 'Refactor Vue codebases: migrate Options API components to Composition API, use script setup, extract composables, and separate page, container, and view responsibilities. Use when asked to modernize, refactor, or restructure Vue code.'
---

# Vue Refactor

> Also apply the [vue-formatting](../vue-formatting/SKILL.md) skill when writing or reviewing refactored components.

## Options API to Composition API

Convert component state, computed values, and lifecycle hooks to Composition API primitives.

```vue
<!-- Before -->
<script lang="ts">
export default {
  data: () => ({ count: 0 }),
  computed: {
    doubled() {
      return this.count * 2;
    },
  },
};
</script>

<!-- After -->
<script setup lang="ts">
import { computed, ref } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>
```

- Prefer `<script setup lang="ts">`
- Replace `data` with `ref` or `reactive`
- Replace `computed` properties with `computed`
- Replace watchers with `watch` or `watchEffect` only when derived state is insufficient
- Replace lifecycle hooks with `onMounted`, `onUpdated`, and `onUnmounted`
- Do not use `this` in Composition API code

## Component Boundaries

Split components into three layers. Name files accordingly:

| Layer | File suffix | Responsibility |
|-------|-------------|---------------|
| Page | `*.page.vue` | Top-level layout and routing composition |
| Container | `*.container.vue` | Side effects, state management, and business logic |
| View | `*.view.vue` | Pure UI driven by props and emitted events |

### Page (`*.page.vue`)

- Top-level composition and routing only
- Contains containers and/or views
- No business logic or direct data fetching

### Container (`*.container.vue`)

- Owns side effects, state management, and business logic
- Uses composables for reusable behavior
- Passes data to views through props
- Handles view events and coordinates actions

### View (`*.view.vue`)

- Presentation only
- Receives data through typed `defineProps`
- Communicates user actions through typed `defineEmits`
- Does not import services or access application stores directly

```vue
<script setup lang="ts">
interface ProfileViewProps {
  user: User;
}

const props = defineProps<ProfileViewProps>();
const emit = defineEmits<{
  logout: [];
}>();
</script>

<template>
  <section>
    <h1>{{ props.user.name }}</h1>
    <button type="button" @click="emit('logout')">Log out</button>
  </section>
</template>
```

## Composables

Extract reusable stateful behavior into composables named `use*.ts`.

- Keep composables focused on one responsibility
- Return readonly state when callers should not mutate it
- Keep pure transformations in standalone utility functions
- Keep API and browser side effects at the composable or service boundary

## Refactor Order

1. Migrate Options API components to Composition API
2. Add `<script setup lang="ts">`
3. Extract reusable behavior into composables
4. Split mixed components into page, container, and view layers
5. Add typed props and emitted events
6. Remove dead component state and duplicated business logic
