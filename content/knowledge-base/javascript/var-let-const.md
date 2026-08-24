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
versionScope: ES2015 (ES6) and later
lastUpdated: 2026-08-23
readingTime: 9
prerequisites: []
related:
  - closures-explained
gotchas:
  - id: 2h69s3hkGrMLSh8RP205SV
    symptom: I changed a property on an object declared with `const` and nothing threw.
    slug: const-object-still-mutable
    cause: >-
      `const` locks the binding, not the value. The name must keep pointing at
      the same object, but that object stays fully mutable.
    fix: >-
      If you need the contents locked too, use `Object.freeze()` — and remember
      it is shallow, so nested objects still change. If you only need to signal
      intent, `const` is already doing its job.
    tag:
      - immutability
  - id: fcsHcCinsnk9GYrcSAIhA
    symptom: >-
      My loop callbacks all print the same final number, even though the counter changed each time.
    slug: var-loop-callback-shares-binding
    cause: >-
      `var` gives the whole loop one shared binding. The callbacks run after the
      loop finishes, so they all read the same finished value.
    fix: >-
      Change the loop counter to `let`. A `for` loop creates a fresh binding per
      iteration, so each callback captures its own.
    tag:
      - scope-and-closures
  - id: 6cle5aoIIvatit25By2rEl
    symptom: >-
      I get a ReferenceError reading a variable that is clearly declared a few lines below.
    slug: >-
      cannot-access-before-initialization
    errorMessage: >-
      Cannot access 'x' before initialization
    cause: >-
      A `let` or `const` binding was read while it was still in the Temporal
      Dead Zone. Often appears after moving code, or when a function runs
      earlier than expected.
    fix: >-
      Move the declaration above the first use. If a function reads it, make
      sure that function is called after the declaration line, not before.
    tag:
      - scope-and-closures
      - error-handling
  - id: 7xRfOBhLOFowP1vJOUpEsX
    symptom: >-
      My `typeof` check throws a ReferenceError, even though I was told `typeof` never throws.
    slug: typeof-throws-in-tdz
    errorMessage: >-
      Cannot access 'x' before initialization
    cause: >-
      `typeof` is safe for a name that was never declared at all, but not for
      one sitting in the TDZ.
    fix: >-
      Do not use `typeof` as an existence check for block-scoped variables.
      Restructure so the declaration runs first, or check a property on an
      object instead.
    tag:
      - scope-and-closures
      - error-handling
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

Run this in your console and guess the output before you read on.

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
```

Most people expect `0 1 2`. You get `3 3 3`. Change one word — `var` to `let` — and it prints `0 1 2`. Nothing else in the code moves.

That one word decides **how many variables exist**, **how long each one lives**, and **what happens if you read one too early**. Those are the only three differences, and everything else follows from them.

## Difference 1: scope

`var` only cares about function boundaries. `let` and `const` care about every pair of curly braces.

```js
function checkout(isMember) {
  if (isMember) {
    var discount = 0.1; // leaks out of the if-block
    let bonus = 5; // trapped inside the if-block
  }
  console.log(discount); // 0.1
  console.log(bonus); // ReferenceError: bonus is not defined
}
```

Leaking sounds convenient until a file grows to 300 lines and you can no longer tell which branch actually set the value. Block scope keeps a variable's lifetime as short as the logic that needs it.

## Difference 2: reassigning and redeclaring

These are two separate things, and the three keywords disagree about both.

- **Reassigning** — giving the name a new value.
- **Redeclaring** — writing the declaration keyword twice for the same name in the same scope.

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

All three declarations are **hoisted** — the engine registers the name at the top of its scope before running any code. What differs is the state of that binding before the declaration line executes.

- `var` → the binding exists and already holds `undefined`
- `let` / `const` → the binding exists but is **locked**. Touching it throws a `ReferenceError`

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

Read those two error messages carefully, because the wording is your best debugging clue:

- **`x is not defined`** — the binding does not exist anywhere in scope. Usually a typo or a missing import.
- **`Cannot access 'x' before initialization`** — the binding exists, but you read it too early. Move the declaration up.

The TDZ is a feature, not a limitation. `undefined` is a valid value, so a `var` mistake flows downstream and blows up somewhere unrelated. The TDZ fails at the exact line where the mistake is.

## Why the loop bug happens

Back to the opening example, step by step.

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
```

1. `var i` is scoped to the surrounding function, not the loop. **One** `i` exists for the whole loop.
2. The loop runs three times and schedules three callbacks. None run yet — `setTimeout` defers them.
3. The loop ends. The condition `i < 3` just failed, so `i` is `3`.
4. The callbacks fire. All three read the same single binding and print `3`.

With `let`, the `for` loop creates **a fresh binding per iteration**, so each callback captures its own `0`, `1`, and `2`.

This is really a closure question underneath: the callback captures the binding, not the value at the time it was written. See [Closures Explained](/kb/javascript/closures-explained) for the mechanism.

## const does not mean immutable

This trips up almost everyone once.

```js
const user = { name: 'Kelly' };
user.name = 'Bytes'; // OK — the object's contents changed
user.role = 'dev'; // OK
user = {}; // TypeError — the binding did not change
```

`const` locks the **binding**, not the value it points to. The name is stapled to that one object; the object itself is still an open box.

For genuinely read-only data, use `Object.freeze()` — and remember it is shallow, so nested objects stay mutable.

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

## Version and environment notes

- `let` and `const` shipped in **ES2015 (ES6)**. Every current browser and every supported Node.js version handles them natively. Check an older project with `node -v`.
- Scripts and modules behave differently. Code in `<script type="module">` and in `.mjs` files runs in strict mode by default, which makes some sloppy `var` patterns throw instead of failing quietly.
- If your build targets old browsers, a bundler may compile `let` down to `var` wrapped in extra functions. The behaviour is preserved, but stepping through the compiled output in a debugger is confusing — read the source, not the bundle.

## Check yourself

**1.** What does this print?

```js
let count = 0;
{
  let count = 5;
  console.log(count);
}
console.log(count);
```

**2.** What happens on each line?

```js
const config = { debug: false };
config.debug = true;
console.log(config.debug);
config = { debug: false };
```

<details>
<summary>Answers</summary>

**1.** `5`, then `0`. The inner `count` is a different binding that only exists inside the braces. The outer one is untouched.

**2.** The property change succeeds and prints `true`. The last line throws `TypeError: Assignment to constant variable`, because reassigning the binding is what `const` blocks.

</details>

## Sources

- MDN Web Docs — [`var`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var), [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
- MDN Web Docs — [Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)
- ECMAScript Language Specification — Declarations and the Variable Statement
