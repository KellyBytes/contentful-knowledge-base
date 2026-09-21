---
contentType: article
title: Primitive vs Reference Types
slug: primitive-vs-reference-types
category: JavaScript
tag:
  - equality
  - immutability
  - interview-frequent
difficulty: Beginner
summary: >-
  Primitives hold a value directly, while objects and arrays hold a reference to
  one. That single difference explains how copying, comparing, and passing them
  into functions behave.
contentfulEntryId: D9w0y4iWJrIKtynKlVWw8
order: 200
versionScope: >-
  ES2015 (ES6) and later; structuredClone requires Node.js 17+ or a modern browser
readingTime: 9
prerequisites:
  - array-methods-and-immutable-updates
related: []
gotchas:
  - id: 4reA6kTi5MRN1eNmPvFTWs
    symptom: >-
      I mutated my array in state directly, but React never re-rendered.
    slug: state-mutation-no-rerender
    errorMessage:
    cause: >-
      Mutating the existing object or array keeps the same reference. React compares old and new state with `Object.is`, so it sees no change and skips the re-render.
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
  - id: 4M6zFk7OYcjSi8RQLBUP9z
    symptom: >-
      Two objects with identical contents compared as false with ===.
    slug: reference-equality-false-for-identical-contents
    errorMessage:
    cause: >-
      === compares objects by identity, not contents. Two separately created
      objects are never equal even when every property matches.
    fix: >-
      Compare contents explicitly — JSON.stringify works for simple,
      order-stable data; otherwise use a deep-equal helper like lodash's
      isEqual.
    category: JavaScript
    tag:
      - equality
  - id: 4OcUEX84pwaIX1mGpWZ2Aj
    symptom: >-
      I tried to change one character in a string directly, and nothing
      happened — no error, no change.
    slug: primitive-index-assignment-silently-ignored
    errorMessage:
    cause: >-
      Strings are immutable primitives. Index assignment writes to a
      temporary autoboxed wrapper object that is discarded immediately.
    fix: >-
      Use a string method that returns a new string (slice, concatenation, or
      converting to an array and back) and reassign the result.
    category: JavaScript
    tag:
      - immutability
interviewQuestions:
  - id: 5yIE4htZED4d0LMdwD0BHO
    question: Is JavaScript pass by value or pass by reference?
    shortAnswer: >-
      Always pass by value. For objects, the value being copied is the reference
      itself, which is why a function can mutate the object the caller sees but
      cannot make the caller's variable point at something new. Reassigning the
      parameter only rebinds the local copy. Some people call this "pass by
      sharing" to sidestep the ambiguity, but "pass by value, where the value is
      a reference" is the precise description.
  - id: 63NDr24jlqIFDcrB16Tsh7
    question: Why does `typeof null` return "object"?
    shortAnswer: >-
      A bug from the first version of JavaScript that was never fixed, because
      too much existing code depends on the current behavior. Values carried a
      small type tag in their leading bits, and null was represented as a null
      pointer — all zeros — which happened to match the tag used for objects. A
      proposal to correct it was rejected precisely because it would break the
      web. To test for it, compare strictly against null.
  - id: 2UJp03V1Z5h1l48XLUC8E4
    question: How do I check whether two objects have equal contents?
    shortAnswer: >-
      There's no built-in deep equality. For simple, order-stable data,
      comparing `JSON.stringify` output works, but it's fragile: it ignores
      `undefined` and functions, it's sensitive to key order, and it throws on
      circular references. `structuredClone` handles more types but doesn't
      compare. In practice I'd reach for a library helper like lodash's
      `isEqual`, or write a recursive comparison if the shape is known and
      small.
  - id: 48mYmPieXaXctak0yPzDqS
    question: Is mutating an object always wrong?
    shortAnswer: >-
      No. The rule applies to values something else might already be holding a
      reference to — React state, function arguments, module-level caches. An
      object you created locally and have not handed to anyone is safe to
      mutate, and copying it would be wasted work. The real question is not
      whether mutation is allowed, but whether anything else can see this object
      yet. Building an array in a loop before returning it is fine; pushing into
      an array that already lives in state is not, because React compares by
      reference and sees no change.
---

Run this and predict the output before reading on.

```js
let a = 5;
let b = a;
b = 10;
console.log(a); // ?

let x = { n: 5 };
let y = x;
y.n = 10;
console.log(x.n); // ?
```

The first block prints `5` — changing `b` never touched `a`. The second prints
`10` — changing `y` changed `x` too, even though you never wrote `x` anywhere
on that line. Same pattern, same `=`, two different outcomes.

JavaScript stores values in one of two ways. A **primitive** variable holds the
value itself. A **reference** variable holds an address that points to the
value, and copying the variable only copies the address. That one distinction
is the entire article — everything below is it playing out in a different
situation.

## The box-and-label analogy

Imagine a warehouse. Every variable is a labeled box on a shelf in your office.

- A **primitive** is like a box that holds the value itself, right inside it.
  Copy the box and you get a second, independent value.
- A **reference** is like a box that holds a sticky note instead of the value.
  The note just says "Shelf 3B" — the actual item (the object) lives out in
  the warehouse. Copy the box and you get two boxes, but the sticky notes both
  say "Shelf 3B": they point at the same item. Change what's on Shelf 3B, and
  every box holding that note now describes the changed item.

There's also a **warehouse janitor** (the garbage collector). The janitor
periodically walks the floor and checks: for each item on a shelf, is there
still at least one sticky note anywhere in the office pointing to it? If a
shelf has zero notes pointing to it, the janitor clears it out and frees the
space. An item only gets cleared once every note referencing it is gone — not
the moment any single note is removed.

Two things worth knowing:

- **You don't control when the janitor makes rounds.** Setting a variable to
  `null` just removes one sticky note; it doesn't force an immediate cleanup.
  The actual reclaiming happens on the engine's own schedule.
- **A note you forgot to remove keeps an item alive.** This is a common
  real-world cause of memory leaks — a stale event listener, a closure still
  holding a reference — not "the janitor being lazy," but a sticky note still
  sitting on a box you stopped using.

## Which is which

There are seven primitives:

```js
'hello'; // string
42; // number
true; // boolean
undefined; // undefined
null; // null
Symbol('id'); // symbol
9007199254740993n; // bigint
```

**Everything else is an object**, and objects are always handled by
reference: `{}`, `[]`, `function () {}`, `new Date()`, `new Map()`,
`/regex/`. A quick test: if you can add a property to it, it's a reference
type.

## How they sit in memory

A simplified picture — variable names live on one board, objects live in
separate storage.

```text
   Variables (the label board)        Object storage
  ┌──────────┬────────────┐          ┌────────────────────────┐
  │ age      │ 30         │          │ #a1  { name: "Kelly",  │
  │ name     │ "Kelly"    │          │        age: 30 }       │
  │ user     │ #a1 ───────┼─────────►│                        │
  └──────────┴────────────┘          └────────────────────────┘
       value is here                      value is over there
```

`age` and `name` carry their values directly on the board. `user` only
carries a sticky note pointing elsewhere.

## Copying: the moment it starts to matter

```js
let a = 10;
let b = a;
b = 20;
console.log(a); // 10 — untouched

let x = { n: 1 };
let y = x;
y.n = 2;
console.log(x.n); // 2 — same object!
```

Walking through what each line actually does:

1. `let a = 10` — the board gets a slot for `a` holding `10` directly.
2. `let b = a` — `b` gets its own slot, and `10` is copied into it.
3. `b = 20` — only `b`'s slot changes. It was never connected to `a`.
4. `let x = { n: 1 }` — an object is created in storage; `x`'s slot holds its
   address.
5. `let y = x` — `y` gets its own slot, but the value copied into it is that
   same address.
6. `y.n = 2` — this follows the address, and the address is shared, so
   `x.n` shows `2` too.

Assignment always copies **what's in the variable**. For `a` that's the
number. For `x` that's the address.

## Comparing: value vs identity

`===` compares primitives by value, and objects by **whether they are the
same object**.

```js
console.log('abc' === 'abc'); // true  — same value
console.log(1 === 1); // true

console.log({} === {}); // false — two different objects
console.log([1, 2] === [1, 2]); // false
```

Two items can look identical and still be two different items. If you need
to compare contents, `===` won't do it for you — you have to walk through the
structure yourself.

## Passing into functions

JavaScript is always **pass by value**. For objects, the value being passed
happens to be an address.

```js
function rename(user) {
  user.name = 'Bytes'; // follows the address, edits the real object
}

function replace(user) {
  user = { name: 'Bytes' }; // rewrites the local copy of the address only
}

const person = { name: 'Kelly' };

rename(person);
console.log(person.name); // "Bytes"  ← changed

replace(person);
console.log(person.name); // "Bytes"  ← unchanged by replace
```

`rename` follows the note to the shelf and changes the item there. `replace`
writes a different shelf number on its own copy of the note and throws it away
when the function returns — the caller's box never changed.

## Primitives are immutable

You can't modify a primitive — only replace it with a new one.

```js
let s = 'hello';
s[0] = 'H';
console.log(s); // "hello" — silently ignored in sloppy mode.
// In strict mode (including ES modules), this throws instead:
// TypeError: Cannot assign to read only property '0' of string 'hello'

s = s.toUpperCase(); // returns a NEW string
console.log(s); // "HELLO"
```

Every string method returns a new string instead of editing the original.
That's also why `.trim()` or `.replace()` does nothing unless you assign the
result to something.

If a string has no properties, how does it have methods at all? The engine
temporarily wraps the value in a `String` object, runs the method, and
discards the wrapper. That's **autoboxing**, and it applies to numbers,
booleans, and symbols too — it's also why `s[0] = "H"` above lands on a
wrapper that stops existing on the very next line.

## Copying an object for real

Assignment only copies the address, so a real copy needs to be explicit.

```js
const original = { name: 'Kelly', tags: ['js', 'react'] };

const shallow = { ...original };
shallow.name = 'Bytes';
console.log(original.name); // "Kelly"  ✅ top level is independent

shallow.tags.push('next');
console.log(original.tags); // ["js", "react", "next"]  ❌ still shared
```

Spread (and `Object.assign`) makes a **shallow** copy — one level deep.
Nested objects are still copied by address. For a true deep copy:

```js
const deep = structuredClone(original);
```

It handles nested structures, `Date`, `Map`, `Set`, and circular
references — but not functions.

## Why React developers hit this constantly

React decides whether to re-render by comparing old and new state with
`Object.is`, which behaves like `===` for everything except `NaN` and `-0`.
For objects that means reference comparison.

```js
// ❌ nothing re-renders — same address, React sees no change
const handleAdd = () => {
  todos.push(newTodo);
  setTodos(todos);
};

// ✅ a new array means a new address, so React notices
const handleAdd = () => {
  setTodos([...todos, newTodo]);
};
```

"Never mutate state directly" isn't a style preference. It's a direct
consequence of reference semantics.

## Side-by-side

|                         | Primitive                                                | Reference                                      |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| What the variable holds | the value                                                | an address                                     |
| Types                   | string, number, boolean, undefined, null, symbol, bigint | object, array, function, Date, Map, Set...     |
| Assignment copies       | the value                                                | the address                                    |
| `===` compares          | value                                                    | identity                                       |
| Mutable                 | no                                                       | yes                                            |
| Function receives       | a copy of the value                                      | a copy of the address                          |
| Cost of copying         | trivial, O(1)                                            | grows with the structure, O(n) for a deep copy |

## The rule of thumb

If a bug looks like "I changed one thing and something unrelated changed
too," you shared a reference by accident. If it looks like "I changed it and
nothing happened," you replaced a local copy of an address, or tried to
mutate a primitive. That diagnostic works because every reference bug comes
back to whether two variables point at the same address — the symptom just
tells you which side of the mistake you're on.

## Version and environment notes

- `Symbol` is ES2015; `BigInt` is ES2020. Both are primitives.
- Object spread (`{ ...obj }`) is ES2018; array spread is ES2015.
- `structuredClone` needs **Node.js 17+** or a current browser. (Node's own
  docs list only `v17.0.0` for this API — an earlier proposal to back-port it
  to the 16.x line doesn't appear to have landed.) On an older Node version,
  use a polyfill or a library like lodash's `cloneDeep` instead.
- `Object.is`, which React's reconciliation uses, differs from `===` only for
  `NaN` (`Object.is(NaN, NaN)` is `true`) and `-0` vs `0`.
- To verify support, run `node -v`, or check the compatibility table on MDN
  for the feature in question.

## Check yourself

**1.** What does this print?

```js
function double(arr) {
  arr = arr.map(n => n * 2);
  return arr;
}

const nums = [1, 2, 3];
const result = double(nums);
console.log(nums, result);
```

**2.** What does this print?

```js
const original = { count: 0, tags: ['a'] };
const copy = { ...original };

copy.count = 5;
copy.tags.push('b');

console.log(original.count, original.tags);
```

<details>
<summary>Answers</summary>

**1.** `[1, 2, 3] [2, 4, 6]`. `arr.map()` returns a brand-new array, and
reassigning the parameter `arr` only rebinds the function's local copy of the
address — it never touches what `nums` points to.

**2.** `0 ["a", "b"]`. Spread makes a shallow copy: the top-level `count` is
independent, but `tags` is a nested array, so `copy.tags` and
`original.tags` are still the same reference.

</details>

## Sources

- MDN Web Docs — [JavaScript data types and data structures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures)
- MDN Web Docs — [Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)
- MDN Web Docs — [structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- MDN Web Docs — [typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
- MDN Web Docs — [Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- MDN Web Docs — [WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)
- MDN Web Docs — [Structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
