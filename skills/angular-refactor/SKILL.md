---
name: angular-refactor
description: 'Refactor Angular codebases: migrate NgModules to standalone components, use signals and inject, separate smart and presentational components, and improve component boundaries. Use when asked to modernize, refactor, or restructure Angular code.'
---

# Angular Refactor

> Also apply the [angular-formatting](../angular-formatting/SKILL.md) skill when writing or reviewing refactored components.

## NgModules to Standalone Components

Prefer standalone components and explicit imports.

```ts
// Before
@NgModule({
  declarations: [UserCardComponent],
  exports: [UserCardComponent],
})
export class UserModule {}

// After
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.component.html',
})
export class UserCardComponent {}
```

- Add `standalone: true` to components, directives, and pipes
- Move module dependencies into the component's `imports` array
- Remove declarations and exports that are no longer needed
- Keep each component's dependency boundary explicit

## Dependency Injection and State

- Prefer `inject()` over constructor injection in new or refactored code when it matches local conventions
- Prefer signals for local reactive state
- Use `computed` for derived state
- Use effects only for synchronizing state with an external side effect
- Keep HTTP and other side effects in services
- Use `ChangeDetectionStrategy.OnPush`

```ts
@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ user()?.name }}</h1>
    <button type="button" (click)="logout()">Log out</button>
  `,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
  }
}
```

## Component Boundaries

Separate components into page, container, and presentational layers.

| Layer | Responsibility |
|-------|---------------|
| Page | Route composition and page-level layout |
| Container | Data loading, state coordination, and user actions |
| Presentational | Pure UI driven by inputs and outputs |

### Page

- Owns route-level composition only
- Contains containers and presentational components
- Does not contain reusable business logic

### Container

- Owns data loading and state coordination
- Injects services and handles commands
- Passes state to presentational components through inputs
- Handles outputs from presentational components

### Presentational

- Uses typed `input()` and `output()` APIs where supported by the project
- Renders from inputs and emits user events
- Does not inject data services or access global state directly
- Has no unrelated navigation or persistence logic

```ts
@Component({
  selector: 'app-profile-view',
  standalone: true,
  template: `
    <h1>{{ user().name }}</h1>
    <button type="button" (click)="logout.emit()">Log out</button>
  `,
})
export class ProfileViewComponent {
  readonly user = input.required<User>();
  readonly logout = output<void>();
}
```

## Services

Extract reusable stateful behavior and side effects into focused services.

- Keep each service responsible for one domain concern
- Keep pure transformations in standalone utility functions
- Expose readonly state when callers should not mutate it
- Avoid putting unrelated business rules in components

## Refactor Order

1. Enable `OnPush` change detection
2. Migrate NgModule declarations to standalone components
3. Replace service constructor access with `inject()` where appropriate
4. Replace mutable local state with signals
5. Split mixed components into page, container, and presentational layers
6. Extract side effects and reusable behavior into focused services
7. Remove dead modules, inputs, and duplicated business logic
