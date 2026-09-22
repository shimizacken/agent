---
name: clean-code
description: 'Apply clean code principles and design patterns to any codebase. Use when the user asks for code review, refactoring advice, design pattern suggestions, or wants to improve the structure and readability of their code regardless of language or stack.'
---

# Clean Code

## Naming

Names are the first line of documentation. A good name makes a comment unnecessary.

- **Functions** - verb phrases that say what they do: `calculateTax`, `fetchUserById`, `isExpired`
- **Variables** - noun phrases that say what they hold: `activeUsers`, `retryCount`, `invoiceTotal`
- **Booleans** - questions that answer yes/no: `isLoading`, `hasPermission`, `canRetry`
- **Avoid**: `data`, `info`, `temp`, `result`, `obj`, single letters outside loop counters

## Functions

- Do one thing. If you need "and" to describe a function, it does two things.
- Keep them short - a function that fits on screen without scrolling is a good sign.
- Arguments: 0 is ideal, 1-2 is fine, 3+ is a signal to introduce a parameter object.
- No side effects that aren't obvious from the name.

## Single Responsibility

Each module, class, or function should have one reason to change. When a unit changes for multiple unrelated reasons, split it.

Signs of mixed responsibility: a file that imports from both UI and database layers, a function that both validates and persists, a class with methods that serve entirely different callers.

## Design patterns - when to reach for them

| Pattern | Use when |
|---------|---------|
| **Strategy** | You have multiple algorithms for the same operation and want to swap them |
| **Observer** | One change should notify multiple dependents without tight coupling |
| **Factory** | Object creation logic is complex or needs to vary by context |
| **Repository** | You want to decouple business logic from data access details |
| **Decorator** | You need to add behavior to objects without modifying their class |
| **Command** | You want to encapsulate operations as objects (for undo, queues, logging) |

Do not apply patterns speculatively. Introduce a pattern when the problem it solves is present, not in anticipation of it.

## Abstraction levels

Each function should operate at a single level of abstraction. Mixing high-level orchestration with low-level detail in the same function makes code hard to follow.

```ts
// Mixed levels - hard to follow
const processOrder = async (order) => {
  if (!order.items || order.items.length === 0) { return; }

  const tax = order.total * 0.25;

  await db.query("INSERT INTO orders ...", [order.id, order.total + tax]);
  sendEmail(order.user.email, "Your order is confirmed");
};

// Consistent level - each step is at the same altitude
const processOrder = async (order) => {
  if (!isValidOrder(order)) { return; }

  const total = calculateTotalWithTax(order);

  await saveOrder(order, total);
  await notifyUser(order.user);
};
```

## Dependencies

- Depend on abstractions, not concretions (interfaces over implementations).
- High-level modules should not depend on low-level modules - introduce an abstraction between them.
- Inject dependencies rather than constructing them inside a function or class.

## Comments

Write comments to explain *why*, not *what*. If you need a comment to explain what code does, the code needs better names or structure.

Good comment: `// YouTrack requires ISO-8601 with no milliseconds`
Bad comment: `// loop through users` above a for loop that obviously loops through users

## Code smells to eliminate

- **Long parameter lists** - introduce a config object
- **Duplicate logic** - extract to a shared function
- **Deep nesting** - invert conditions and return early
- **Large files** - split by responsibility
- **Feature envy** - a function that uses another object's data more than its own belongs in that object
