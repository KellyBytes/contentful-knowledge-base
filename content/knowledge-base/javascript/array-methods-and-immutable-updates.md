---
contentType: article
title: Array Methods and Immutable Updates
slug: array-methods-and-immutable-updates
category: JavaScript
tag:
  - immutability
  - state-management
  - interview-frequent
difficulty: Beginner
summary: >-
  Some array methods change the original array and some return a new one, and
  mixing them up is the most common cause of state that silently fails to
  update. Covers which is which, the four update patterns, and the shallow copy
  trap.
contentfulEntryId: 5l0Rl3y9jlgZXHrLDokCcq
order: 30
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
Array methods come in two families. One family **edits the array you already have**. The other **leaves it alone and hands you a new one**. Knowing which is which is the difference between state that updates and state that mysteriously doesn't.

## The shared document analogy

Imagine a document that several people have open at once.

- A **mutating** method is editing that document in place. Everyone holding it sees the change immediately — including code you forgot was holding it.
- A **non-mutating** method is choosing *Save As*. The original is untouched, and you get a new file with a new name.

The second part matters more than it sounds. Anything watching for changes is usually watching the **file name, not the contents**. Edit in place and the name never changes, so nothing notices. That is exactly React's situation.

```
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
push()      // add to the end
pop()       // remove from the end
shift()     // remove from the front
unshift()   // add to the front
splice()    // remove or insert anywhere
sort()      // reorder
reverse()   // flip
fill()      // overwrite a range
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

An easy first pass: if the name sounds like an instruction to the array, it probably mutates. If it sounds like a description of a result, it probably doesn't.

## The three that catch everyone

**`sort()` and `reverse()` mutate — and also return the array.** That return value makes the code look functional when it isn't.

```js
const scores = [3, 1, 2];
const sorted = scores.sort();

console.log(sorted);   // [1, 2, 3]
console.log(scores);   // [1, 2, 3]  ← the original changed too
console.log(sorted === scores);  // true — it's the same array
```

**`splice()` mutates, `slice()` does not.** One letter apart, opposite behaviour.

```js
const a = [1, 2, 3, 4];
a.slice(1, 3);    // [2, 3]     → a is still [1,2,3,4]
a.splice(1, 3);   // [2, 3, 4]  → a is now [1]
```

Since **ES2023** each mutating method has a non-mutating twin:

```js
arr.toSorted()          // instead of sort()
arr.toReversed()        // instead of reverse()
arr.toSpliced(1, 2)     // instead of splice()
arr.with(0, "new")      // instead of arr[0] = "new"
```

⚠️ These are recent. They need Node 20+ and browsers from mid-2023 onward. Check your build target before relying on them — if you support older environments, `[...arr].sort()` does the same job everywhere.

## The four update patterns

Almost every state update in React is one of these.

**Add**

```js
setTodos([...todos, newTodo]);          // append
setTodos([newTodo, ...todos]);          // prepend
```

**Remove**

```js
setTodos(todos.filter((t) => t.id !== id));
```

**Update one item**

```js
setTodos(
  todos.map((t) => (t.id === id ? { ...t, done: true } : t))
);
```

Note the inner spread. Returning `t` unchanged for every other item is correct and cheap — those items keep their identity, so React can skip re-rendering them.

**Insert at a position**

```js
setTodos([...todos.slice(0, i), newTodo, ...todos.slice(i)]);
```

Four patterns, and `map` and `filter` cover most of it. There is no fifth trick.

## The shallow copy trap

Spreading an array copies the array, **not the objects inside it**.

```js
const todos = [{ id: 1, done: false }];
const copy = [...todos];

copy[0].done = true;
console.log(todos[0].done);   // true  ← the original object changed
```

The new array holds the *same references*. That's why the update pattern above spreads the item too:

```js
todos.map((t) => (t.id === id ? { ...t, done: true } : t))
//                              ^^^^^ a new object, not the old one
```

The rule: **copy every level of the path you are changing.** Branches you don't touch can stay shared — that's not a bug, it's what makes this cheap.

## Objects follow the same rules

```js
const updated = { ...user, name: "Kelly" };        // change a field
const { password, ...safe } = user;                 // remove a field
const patched = { ...user, [field]: value };        // dynamic key
```

There is no `delete` that returns a new object — destructuring with rest is the idiomatic replacement.

## Why React insists on this

React compares the previous and next state with `Object.is`, which for objects and arrays means comparing **identity**, not contents. Same address, no re-render.

```js
// ❌ the array is the same object, so nothing happens
todos.push(newTodo);
setTodos(todos);

// ✅ a new array means a new identity
setTodos([...todos, newTodo]);
```

"Never mutate state" is not a style rule. It's what makes React's change detection work at all.

## Side-by-side

| | Mutating | Non-mutating |
|---|---|---|
| Examples | `push`, `pop`, `splice`, `sort`, `reverse` | `map`, `filter`, `slice`, `concat`, spread |
| Returns | often the same array, or the removed part | a new array |
| Original after the call | changed | untouched |
| Safe for React state | no | yes |
| Safe for a local array you just built | yes | yes |

## The rule of thumb

Ask one question before calling any array method: **can anything else already see this array?** If it lives in state, was passed in as an argument, or sits in a module-level cache, use a method that returns a new array. If you created it two lines ago and nobody else has it yet, mutate freely — copying it would just be wasted work.
