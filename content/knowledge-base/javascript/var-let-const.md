---
contentType: article
title: 'var, let, and const'
slug: var-let-const
category: JavaScript
tag:
  - scope-and-closures
  - immutability
  - interview-frequent
difficulty: Beginner
summary: >-
  let and const are block-scoped and fail loudly when misused, while var is
  function-scoped and fails silently. Covers scope, hoisting, the temporal dead
  zone, and why const does not mean immutable.
contentfulEntryId: 64pOmxhp91mlZpZgNLaDCH
order: 10
interviewQuestions:
  - id: 1FAlrd9waLhllhfiBgNydp
    question: 'If everything is hoisted, why does only `var` give me `undefined`?'
    shortAnswer: >-
      Hoisting creates the binding; it does not assign a value. A `var` binding
      is initialized to `undefined` at that moment, so reading it early is legal
      but meaningless. A `let` or `const` binding is created without any value
      and stays that way until the declaration line runs — that gap is the
      Temporal Dead Zone, and reading it throws. The error wording gives it
      away: "Cannot access 'x' before initialization" means the engine knows the
      binding exists, unlike "x is not defined."
  - id: 7giy26RVq8iGGP0CefkbTB
    question: Why does the TDZ exist at all? Wouldn't `undefined` be simpler?
    shortAnswer: >-
      Mostly because const requires it. If a const were initialized to undefined
      when hoisted and then given its real value, it would have held two values
      during its lifetime, which contradicts the guarantee the keyword makes.
      The TDZ is what lets const mean what it says. The secondary reason is that
      undefined hides mistakes — reading a variable before its declaration is
      almost always a bug, and quietly handing back a value lets it travel
      downstream until something unrelated breaks. Failing at the point of the
      mistake is far more useful.
  - id: 68Co9Jp7ebvg3FVygOvsNw
    question: Is `var` deprecated?
    shortAnswer: >-
      No, and it never will be. The committee that maintains JavaScript treats
      backward compatibility as close to inviolable — removing `var` would break
      a large share of the existing web, so it stays in the specification
      permanently. "Deprecated" and "you shouldn't use it" are different claims.
      `var` is fully supported and behaves exactly as specified; it is simply
      the wrong tool now that block scoping exists. Linters flag it by
      convention, not because the language discourages it.
  - id: 1GUJRigP3vevdxAPia4CQW
    question: How do I convert legacy `var` code?
    shortAnswer: >-
      Let a linter with `no-var` and `prefer-const` find them first, then
      convert mechanically: reach for `const`, and fall back to `let` only where
      reassignment forces it. The conversions that need real attention are the
      ones where scope actually changes — a `var` read after a loop or outside
      an `if` block will break, and so will a duplicate declaration that was
      previously allowed. Convert a file at a time and lean on tests; a
      repo-wide sweep hides which change caused a regression.
---

A variable declaration is a **name tag attached to a value**. `var`, `let`, and `const` all attach name tags. They differ in three things: **where the tag can be seen**, **whether you can move it**, and **what happens if you read it too early**.

## The office building analogy

Picture your program as an office building. A function is a floor, and every `{ ... }` block is a room on that floor.

- **`var`** — you write the name on a sticky note and it ends up visible to the **whole floor**, no matter which room you were standing in.
- **`let`** — you write the name on the **whiteboard inside one room**. Leave the room and it's gone.
- **`const`** — same whiteboard, but in permanent marker. The name stays attached to the same value forever.

```
function floor() {
  if (true) {           ┌── room (block) ──────────────┐
    var   sticky = 1;   │   sticky ──┐ escapes the room │
    let   board  = 2;   │   board    │ stays inside     │
    const marker = 3;   │   marker   │ stays inside     │
  }                     └────────────┼──────────────────┘
  console.log(sticky);  //  1  ◄─────┘
  console.log(board);   //  ReferenceError: board is not defined
}
```

## Difference 1: scope

`var` only cares about function boundaries. `let` and `const` care about every pair of curly braces.

```js
function checkout(isMember) {
  if (isMember) {
    var discount = 0.1; // leaks out of the if-block
    let bonus = 5; // trapped inside the if-block
  }
  console.log(discount); // 0.1
  console.log(bonus); // ReferenceError
}
```

Leaking sounds convenient until a file grows to 300 lines and you can no longer tell which branch actually set the value. Block scope keeps a variable's lifetime as short as the logic that needs it.

## Difference 2: reassigning and redeclaring

```js
var a = 1;
var a = 2; // fine — and silent, which is the problem

let b = 1;
let b = 2; // SyntaxError: Identifier 'b' has already been declared
b = 3; // fine — reassignment is allowed

const c = 1;
c = 2; // TypeError: Assignment to constant variable
const d; // SyntaxError — const must be initialized on the spot
```

The dangerous one is `var`. Declaring the same name twice is usually a copy-paste accident, and `var` happily overwrites the earlier value without a word.

## Difference 3: hoisting and the temporal dead zone

All three declarations are **hoisted** — the engine registers the name at the top of its scope before running any code. What differs is the state of the box before the declaration line executes.

- `var` → the box exists and already contains `undefined`
- `let` / `const` → the box exists but is **locked**. Touching it throws a `ReferenceError`

That locked window is the **Temporal Dead Zone (TDZ)**.

```
        scope starts            declaration line          scope ends
             │                        │                        │
var  y:      │◄──── undefined ───────►│◄──────── 5 ───────────►│
let  x:      │◄──── TDZ ✗ ───────────►│◄──────── 5 ───────────►│
                 (ReferenceError)
```

```js
console.log(y); // undefined  ← looks like it "works"
var y = 5;

console.log(x); // ReferenceError: Cannot access 'x' before initialization
let x = 5;
```

The TDZ is a feature, not a limitation. `undefined` is a valid value, so a `var` mistake flows downstream and blows up somewhere unrelated. The TDZ fails at the exact line where the mistake is.

## The classic loop bug

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
// 3, 3, 3

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
// 0, 1, 2
```

`var` gives the whole loop **one shared binding**, so all three callbacks end up reading the same finished value. `let` creates **a fresh binding per iteration**, so each callback gets its own.

This is the single most common way the scope difference shows up in real code — and it is really a closure question. See [Closures Explained](/kb/javascript/closures-explained) for why a callback captures the binding rather than the value.

## const does not mean immutable

This trips up almost everyone once.

```js
const user = { name: 'Kelly' };
user.name = 'Bytes'; // OK — the object's contents changed
user.role = 'dev'; // OK
user = {}; // TypeError — the binding did not change
```

`const` freezes the **name tag**, not the value it points to. The tag is stapled to that one object; the object itself is still an open box.

For genuinely read-only data, use `Object.freeze()` — and remember it's shallow, so nested objects stay mutable.

```js
const config = Object.freeze({ api: '/v1', limits: { rpm: 60 } });
config.api = '/v2'; // ignored (throws in strict mode)
config.limits.rpm = 9999; // still changes — nested object isn't frozen
```

## One more difference: the global object

At the top level of a classic script, `var` creates a property on the global object. `let` and `const` don't.

```js
var a = 1;
let b = 2;
console.log(window.a); // 1
console.log(window.b); // undefined
```

This is one more way `var` can collide with something you didn't write. Inside ES modules, top-level `var` doesn't touch the global object either, since modules have their own scope.

## Side-by-side

|                                | `var`                           | `let`           | `const`         |
| ------------------------------ | ------------------------------- | --------------- | --------------- |
| Scope                          | function                        | block           | block           |
| Hoisted                        | yes, initialized to `undefined` | yes, but in TDZ | yes, but in TDZ |
| Redeclare in same scope        | allowed                         | `SyntaxError`   | `SyntaxError`   |
| Reassign                       | allowed                         | allowed         | `TypeError`     |
| Must initialize                | no                              | no              | yes             |
| Adds property to global object | yes (in scripts)                | no              | no              |

## The rule of thumb

1. Reach for **`const`** first.
2. Switch to **`let`** the moment you actually need to reassign.
3. Use **`var`** never — only recognize it when reading older code.

Defaulting to `const` isn't about enforcing purity. It's a signal to the next reader: "this name never changes, so you can stop tracking it."

Performance plays no part in the decision. Modern engines show no meaningful difference between the three, so choose on scope and intent alone.
