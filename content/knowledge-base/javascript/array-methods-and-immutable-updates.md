---
contentType: article
title: Array Methods and Immutable Updates
slug: array-methods-and-immutable-updates
category: JavaScript
tag:
  - immutability
  - state-management
  - interview-frequent
difficulty: Intermediate
summary: >-
  Some array methods change the original array and some return a new one, and
  mixing them up is the most common cause of state that silently fails to
  update. Covers which is which, the four update patterns, and the shallow copy
  trap.
contentfulEntryId: 5l0Rl3y9jlgZXHrLDokCcq
order: 300
versionScope: >-
  ES5 (2009) for map/filter/reduce and the other non-mutating basics; ES2023
  for toSorted/toReversed/toSpliced/with, which need Node.js 20+ or a browser
  from mid-2023 onward
readingTime: 11
prerequisites:
  - primitive-vs-reference-types
related: []
gotchas:
  - id: 4reA6kTi5MRN1eNmPvFTWs
    symptom: >-
      I mutated my array in state directly, but React never re-rendered.
    slug: state-mutation-no-rerender
    errorMessage:
    cause: >-
      Mutating the existing object or array keeps the same reference. React
      compares old and new state with `Object.is`, so it sees no change and
      skips the re-render.
    fix: |-
      Build a new array instead of mutating:

      - spread — `[...arr, item]`
      - `concat()`
      - `map()` / `filter()`

      Then pass the new array to the setter.
    category: JavaScript
    tag:
      - rendering
      - immutability
  - id: 7s67LwSm5Kh6aTDsZhHanV
    symptom: >-
      I copied my object with spread, but changing the copy still changed the
      original.
    slug: shallow-copy-shares-nested-refs
    errorMessage:
    cause: >-
      Spread and `Object.assign` copy only the top level. Nested objects and arrays inside the copy are still the same references as in the original.
    fix: >-
      Use `structuredClone` for a real deep copy, or restructure state so nested values don't need to be copied at all.
    category: JavaScript
    tag:
      - immutability
  - id: TNX9xN0aYtubLGv1YgHcG
    symptom: >-
      I called sort() and saved the result in a new variable, but my original array got reordered too.
    slug: sort-reverse-mutate-and-return
    errorMessage:
    cause: >-
      `sort()` and `reverse()` mutate the array in place and also return that same array, so assigning the return value just creates a second name for the same array — not a copy.
    fix: >-
      Copy before sorting: `[...arr].sort()`. Or use the ES2023 non-mutating twins — `toSorted()` / `toReversed()` — where the runtime supports them.
    category: JavaScript
    tag:
      - immutability
  - id: 5is5v12BeAXWpvzVUV9jng
    symptom: >-
      I meant to read a section of my array but called splice by mistake, and now items are missing from the original.
    slug: splice-slice-confusion
    errorMessage:
    cause: >-
      `splice()` and `slice()` are one letter apart but opposite in behavior — `splice()` removes or inserts in place and returns the removed section, while `slice()` returns a new array and leaves the original untouched.
    fix: >-
      Reach for `slice()` by default. Only use `splice()` when mutating in place is the actual intent, and say so in a comment.
    category: JavaScript
    tag:
      - immutability
interviewQuestions:
  - id: 1qV3YiCYJ3xjWjCqnYy2St
    question: Which array methods mutate the original array?
    shortAnswer: >-
      The mutating ones are `push`, `pop`, `shift`, `unshift`, `splice`, `sort`,
      `reverse`, and `fill`. Everything else returns a new array — `map`,
      `filter`, `slice`, `concat`, `flat`, and spreading. The three that catch
      people out are `sort` and `reverse`, because they mutate and also return
      the same array, so the code looks functional when it isn't, and `splice`
      versus `slice`, which are one letter apart and behave in opposite ways.
      Since ES2023 there are non-mutating twins: `toSorted`, `toReversed`,
      `toSpliced`, and `with`.
  - id: 5O5gJt9VOKHRQjLJ1bdrMm
    question: Why do some array methods mutate and others don't?
    shortAnswer: >-
      It is history rather than design. The mutating methods shipped with the
      language in 1995, when an array was simply an object you modified in
      place. The functional methods — `map`, `filter`, `reduce` — arrived in ES5
      in 2009, after that style had become popular, and were written to return
      new arrays instead. Nothing unified the two generations, because changing
      what `sort` or `push` does would break existing sites. ES2023 added
      `toSorted`, `toReversed`, `toSpliced`, and `with` as separate twins for
      exactly that reason.
  - id: 3JehHvXUeBRiPAPxEevqC6
    question: How do you update deeply nested state immutably?
    shortAnswer: >-
      Spread copies only one level, so you have to copy every level of the path
      you are changing and leave the rest shared. For a list of users each
      holding a settings object, that means mapping the array, spreading the
      matching user, then spreading their settings — three levels of copying to
      change one field. It becomes unreadable quickly. At that point the answer
      is usually to flatten the state so updates stay shallow, or to use a
      library such as Immer, which lets you write mutating syntax and produces
      an immutable result underneath.
  - id: 1QSeaoEqKunaHCYPwZdmqa
    question: Isn't creating a new array on every update wasteful?
    shortAnswer: >-
      Rarely, because the copy is shallow. A new array of a thousand items
      copies a thousand references, not a thousand objects, which is cheap next
      to the re-render it triggers. It only matters for very large lists updated
      very often, and the fix there is usually to restructure the data — keying
      items by id in an object, for example — rather than to start mutating. It
      is also worth remembering the rule only applies to values something else
      can already see. An array you are building locally before returning it is
      fine to push into.
---

Run this and predict what each line prints before you read on.

```js
const scores = [3, 1, 2];
const sorted = scores.sort();

console.log(sorted); // ?
console.log(scores); // ?
console.log(sorted === scores); // ?
```

All three lines show the same sorted array, and the third one is `true` —
`sorted` and `scores` are literally the same array. `sort()` reordered
`scores` in place and simply handed the same reference back.

Array methods come in exactly two families: ones that **edit the array you
already have**, and ones that **leave it alone and hand you a new one**.
Which family a method belongs to is not obvious from its name, and mixing
the two up is the single most common cause of state that silently fails to
update.

## The shared document analogy

Imagine a document that several people have open at once.

- A **mutating** method is editing that document in place. Everyone holding
  it sees the change immediately — including code you forgot was holding it.
- A **non-mutating** method is choosing _Save As_. The original is
  untouched, and you get a new file with a new name.

The second part matters more than it sounds. Anything watching for changes
is usually watching the **file name, not the contents**. Edit in place and
the name never changes, so nothing notices — that is exactly React's
situation.

Where the analogy breaks: clicking _Save As_ on a real document makes a
fully independent copy, down to anything embedded in it. A non-mutating
array method doesn't go that far — it only copies the array itself, one
level deep. Anything nested inside, like an object sitting at index 0, is
still the exact same object in both the old array and the new one. That gap
is exactly what the shallow copy trap below is about.

```text
push:                          [...arr, item]:

  ┌─────────┐                    ┌─────────┐      ┌─────────┐
  │ arr #1  │ ← state            │ arr #1  │      │ new #2  │ ← state
  │ [a,b,c] │                    │ [a,b]   │      │ [a,b,c] │
  └─────────┘                    └─────────┘      └─────────┘
   same address                   old address      new address
   React sees no change           React re-renders
```

## Which methods mutate

**These change the original:**

```js
push(); // add to the end
pop(); // remove from the end
shift(); // remove from the front
unshift(); // add to the front
splice(); // remove or insert anywhere
sort(); // reorder
reverse(); // flip
fill(); // overwrite a range
```

**These return a new array and leave the original alone:**

```js
map()       // transform every item
filter()    // keep some items
slice()     // take a section
concat()    // join arrays
flat()      // flatten nesting
[...arr]    // spread
```

An easy first pass: if the name sounds like an instruction to the array, it
probably mutates. If it sounds like a description of a result, it probably
doesn't.

## The two that catch everyone

`sort()` and `reverse()` mutate and also return the array, as the opening
example showed — that return value is what makes the code look functional
when it isn't.

**`splice()` mutates, `slice()` does not.** One letter apart, opposite
behaviour.

```js
const a = [1, 2, 3, 4];
a.slice(1, 3); // [2, 3]     → a is still [1, 2, 3, 4]
a.splice(1, 3); // [2, 3, 4]  → a is now [1]
```

Since **ES2023**, each mutating method has a non-mutating twin:

```js
arr.toSorted(); // instead of sort()
arr.toReversed(); // instead of reverse()
arr.toSpliced(1, 2); // instead of splice()
arr.with(0, 'new'); // instead of arr[0] = "new"
```

⚠️ These need Node 20+ (Node 18 and 19 do not support them — only `findLast`
and `findLastIndex` shipped that early) or a browser from mid-2023 onward.
If you support older environments, `[...arr].sort()` does the same job
everywhere.

## The shallow copy trap

Spreading an array copies the array, **not the objects inside it**.

```js
const todos = [{ id: 1, done: false }];
const copy = [...todos];

copy[0].done = true;
console.log(todos[0].done); // true  ← the original object changed
```

Walking through why:

1. `todos` holds one array, containing one object — call its address `#a1`.
2. `[...todos]` creates a new array, `copy`, but the single slot inside it
   still holds `#a1`. Spread never looked inside the object to copy it.
3. `copy[0]` and `todos[0]` are different slots in different arrays, but
   both hold the same address.
4. `copy[0].done = true` follows that shared address and mutates the one
   object both arrays point at.
5. `todos[0].done` reads that same object, so it shows `true` too.

The rule: **copy every level of the path you are changing.** Branches you
don't touch can stay shared — that's not a bug, it's what makes this cheap.

## The four update patterns

Almost every state update in React is one of these.

**Add**

```js
setTodos([...todos, newTodo]); // append
setTodos([newTodo, ...todos]); // prepend
```

**Remove**

```js
setTodos(todos.filter(t => t.id !== id));
```

**Update one item**

```js
setTodos(todos.map(t => (t.id === id ? { ...t, done: true } : t)));
```

Note the inner spread — that's the second level of copying from the trap
above. Returning `t` unchanged for every other item is correct and cheap:
those items keep their identity, so React can skip re-rendering them.

**Insert at a position**

```js
setTodos([...todos.slice(0, i), newTodo, ...todos.slice(i)]);
```

Four patterns, and `map` and `filter` cover most of it. There is no fifth
trick.

## Objects follow the same rules

```js
const updated = { ...user, name: 'Kelly' }; // change a field
const { password, ...safe } = user; // remove a field
const patched = { ...user, [field]: value }; // dynamic key
```

There is no `delete` that returns a new object — destructuring with rest is
the idiomatic replacement.

## Why React insists on this

React compares the previous and next state with `Object.is`, which for
objects and arrays means comparing **identity**, not contents. Same
address, no re-render.

```js
// ❌ the array is the same object, so nothing happens
todos.push(newTodo);
setTodos(todos);

// ✅ a new array means a new identity
setTodos([...todos, newTodo]);
```

"Never mutate state" is not a style rule. It's what makes React's change
detection work at all.

## Side-by-side

|                                       | Mutating                                   | Non-mutating                               |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Examples                              | `push`, `pop`, `splice`, `sort`, `reverse` | `map`, `filter`, `slice`, `concat`, spread |
| Returns                               | often the same array, or the removed part  | a new array                                |
| Original after the call               | changed                                    | untouched                                  |
| Safe for React state                  | no                                         | yes                                        |
| Safe for a local array you just built | yes                                        | yes                                        |

## The rule of thumb

Ask one question before calling any array method: **can anything else
already see this array?** If it lives in state, was passed in as an
argument, or sits in a module-level cache, use a method that returns a new
array. If you created it two lines ago and nobody else has it yet, mutate
freely — copying it would just be wasted work. The question works because
it's really asking whether some other part of the app already holds this
exact reference; if it does, mutating changes what that other part sees too.

## Version and environment notes

- `map`, `filter`, `reduce`, `forEach`, `slice`, `concat`, and `indexOf` are
  **ES5 (2009)** — safe everywhere.
- `flat` and `flatMap` are **ES2019**.
- `toSorted`, `toReversed`, `toSpliced`, and `with` are **ES2023**. Node 18
  and 19 do not implement them; Node 20+ does, as do current browsers from
  mid-2023 onward.
- To verify support, run `node -v`, or check the compatibility table for the
  specific method on MDN.

## Check yourself

**1.** What does this print?

```js
const arr = [1, 2, 3, 4, 5];
const result = arr.splice(1, 2);

console.log(result);
console.log(arr);
```

**2.** What does this print?

```js
const todos = [
  { id: 1, done: false },
  { id: 2, done: false },
];
const updated = todos.map(t => (t.id === 1 ? { ...t, done: true } : t));

console.log(updated[0] === todos[0]);
console.log(updated[1] === todos[1]);
```

<details>
<summary>Answers</summary>

**1.** `[2, 3]` then `[1, 4, 5]`. `splice(1, 2)` removes two items starting
at index 1 and returns them; it also mutates `arr` in place, so the
original array is permanently short two items.

**2.** `false` then `true`. `map` builds a new object for the item that
matched (`{ ...t, done: true }`), so `updated[0]` is a different reference
from `todos[0]`. The item that didn't match was returned unchanged, so
`updated[1]` is the exact same object as `todos[1]`.

</details>

## Sources

- MDN Web Docs — [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- MDN Web Docs — [Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
- MDN Web Docs — [Array.prototype.toSorted()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
