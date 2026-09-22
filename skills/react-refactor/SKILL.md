---
name: react-refactor
description: 'Refactor React codebases: convert class components to arrow functions, replace connect() with hooks, enforce named exports, and split components into page/container/view layers. Use when asked to modernize, refactor, or restructure React code.'
---

# React Refactor

> Also apply the [react-formatting](../react-formatting/SKILL.md) skill when writing or reviewing refactored components.

## Class Components to Arrow Functions

```tsx
// Before
class UserCard extends React.Component<Props> {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// After
const UserCard = ({ name }: Props) => <div>{name}</div>;
```

- Remove `this.props` - destructure in the signature
- Convert `this.state` + `setState` to `useState`
- Convert lifecycle methods: `componentDidMount` / `componentDidUpdate` / `componentWillUnmount` -> `useEffect`

## Named Exports

Always use named exports. No default exports.

```tsx
// Wrong
export default UserCard;

// Correct
export { UserCard };
```

## Replace connect() with Hooks

```tsx
// Before
const mapStateToProps = (state: RootState) => ({ user: state.auth.user });
const mapDispatchToProps = { logout };
export default connect(mapStateToProps, mapDispatchToProps)(ProfileContainer);

// After
export const ProfileContainer = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  return <ProfileView user={user} onLogout={() => dispatch(logout())} />;
};
```

## Component Layers

Split components into three layers. Name files accordingly:

| Layer | File suffix | Responsibility |
|-------|-------------|---------------|
| Page | `*.page.tsx` | Top-level JSX, routing |
| Container | `*.container.tsx` | Side effects, state, business logic |
| View | `*.view.tsx` | Pure UI, props only |

### Page (`*.page.tsx`)

- Top-level composition and routing only
- Contains only containers and/or views - no business logic
- No direct CSS imports or inline styles

```tsx
// profile.page.tsx
export const ProfilePage = () => (
  <Layout>
    <ProfileContainer />
  </Layout>
);
```

### Container (`*.container.tsx`)

- Owns side effects, state management, and business logic
- Reads from store via `useSelector`, dispatches via `useDispatch`
- Contains only containers and/or views - no pages
- No direct CSS imports or inline styles

```tsx
// profile.container.tsx
export const ProfileContainer = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  return <ProfileView user={user} onLogout={() => dispatch(logout())} />;
};
```

### View (`*.view.tsx`)

- Pure UI - no side effects whatsoever
- No imports from services, stores, or state management
- Depends only on its props and other views or HTML elements
- No pages or containers inside

```tsx
// profile.view.tsx
interface ProfileViewProps {
  user: User;
  onLogout: () => void;
}

export const ProfileView = ({ user, onLogout }: ProfileViewProps) => (
  <div className={styles.profile}>
    <h1>{user.name}</h1>
    <button onClick={onLogout}>Log out</button>
  </div>
);
```

## Refactor Order

1. Convert class components to arrow functions
2. Replace `connect()` with `useSelector` / `useDispatch`
3. Switch to named exports
4. Identify mixed components and split into page / container / view
5. Rename files to match the layer suffix
