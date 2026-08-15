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
order: 20
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
Every value in JavaScript is stored in one of two ways. A **primitive** variable holds the value itself. A **reference** variable holds an address that points to the value. Almost every confusing thing about copying, comparing, and mutating in JavaScript comes back to this one distinction.

## The house analogy

Imagine you have a notebook where you write things down.

- A **primitive** is like writing down a phone number. The number is right there on the page. Copy the page and you have a second, completely independent phone number.
- A **reference** is like writing down a house address. The house isn't on the page — only directions to it. Copy the page and you now have two pages pointing at the **same house**. Repaint the house, and both pages describe a repainted house.

Nothing else about the two categories matters as much as this.

## Which is which

There are seven primitives:

```js
"hello"      // string
42           // number
true         // boolean
undefined    // undefined
null         // null
Symbol("id") // symbol
9007199254740993n // bigint
```

**Everything else is an object**, and objects are always handled by reference:

```js
{}, [], function () {}, new Date(), new Map(), /regex/
```

An easy way to remember it: if you can add a property to it, it's a reference type.

## How they sit in memory

A simplified picture — the variable names live in one place, and objects live in another.

```
   Variables (the label board)        Object storage
  ┌──────────┬────────────┐          ┌────────────────────────┐
  │ age      │ 30         │          │ #a1  { name: "Kelly",  │
  │ name     │ "Kelly"    │          │        age: 30 }       │
  │ user     │ #a1 ───────┼─────────►│                        │
  └──────────┴────────────┘          └────────────────────────┘
       value is here                      value is over there
```

`age` and `name` carry their values on the board. `user` only carries a ticket number.

## Copying: the moment it starts to matter

```js
let a = 10;
let b = a;
b = 20;
console.log(a);   // 10 — untouched

let x = { n: 1 };
let y = x;
y.n = 2;
console.log(x.n); // 2 — same object!
```

Assignment always copies **what's in the variable**. For `a` that's the number itself. For `x` that's the address.

```
let a = 10;      let b = a;        b = 20;
┌────────┐       ┌────────┐        ┌────────┐
│ a │ 10 │  ──►  │ a │ 10 │  ──►   │ a │ 10 │   a is unaffected
└────────┘       │ b │ 10 │        │ b │ 20 │
                 └────────┘        └────────┘

let x = {n:1};   let y = x;        y.n = 2;
┌────────┐       ┌────────┐        ┌────────┐
│ x │ #1 ┼──┐    │ x │ #1 ┼──┐     │ x │ #1 ┼──┐
└────────┘  │    │ y │ #1 ┼──┤     │ y │ #1 ┼──┤
         ┌──▼──┐ └────────┘  │     └────────┘  │
         │ n:1 │          ┌──▼──┐           ┌──▼──┐
         └─────┘          │ n:1 │           │ n:2 │  both see 2
                          └─────┘           └─────┘
```

## Comparing: value vs identity

`===` compares primitives by their value, and objects by **whether they are the same object**.

```js
"abc" === "abc";        // true  — same value
1 === 1;                // true

{} === {};              // false — two different objects
[1,2] === [1,2];        // false
```

Two houses can look identical and still be two different houses. If you need to compare contents, you have to walk through them yourself — `===` will never do it for you.

## Passing into functions

JavaScript is always **pass by value**. The subtlety is that for objects, the value being passed is the address.

```js
function rename(user) {
  user.name = "Bytes";   // follows the address, edits the real object
}

function replace(user) {
  user = { name: "Bytes" };  // rewrites the local copy of the address only
}

const person = { name: "Kelly" };

rename(person);
console.log(person.name);  // "Bytes"  ← changed

replace(person);
console.log(person.name);  // "Bytes"  ← unchanged by replace
```

`rename` walks to the house and repaints it. `replace` scribbles a different address onto its own scrap of paper and throws it away when the function ends. The caller's paper never changed.

## Primitives are immutable

You can't modify a primitive — you can only replace it with a new one.

```js
let s = "hello";
s[0] = "H";
console.log(s);           // "hello" — silently ignored

s = s.toUpperCase();      // this works because it RETURNS a new string
console.log(s);           // "HELLO"
```

Every string method returns a new string rather than editing the original. This is also why `.trim()` or `.replace()` does nothing unless you assign the result to something.

If a string is a primitive with no properties, how does it have methods at all? The engine temporarily wraps the value in a `String` object, runs the method, and throws the wrapper away. That's **autoboxing**, and it applies to numbers, booleans, and symbols too. It also explains the silent failure above: `s[0] = "H"` lands on a wrapper object that stops existing on the very next line.

## Copying an object for real

Since assignment only copies the address, you need an explicit copy:

```js
const original = { name: "Kelly", tags: ["js", "react"] };

const shallow = { ...original };
shallow.name = "Bytes";
console.log(original.name);      // "Kelly"  ✅ top level is independent

shallow.tags.push("next");
console.log(original.tags);      // ["js","react","next"]  ❌ still shared
```

The spread operator (and `Object.assign`) makes a **shallow** copy: one level deep. Nested objects are still copied by address.

For a true deep copy, modern browsers and Node 17+ have:

```js
const deep = structuredClone(original);
```

It handles nested structures, `Date`, `Map`, `Set`, and circular references — but not functions.

## Why React developers hit this constantly

React decides whether to re-render by comparing the old and new state with `Object.is`, which behaves like `===` for everything except `NaN` and `-0`. For objects that means reference comparison.

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

"Never mutate state directly" isn't a stylistic preference. It's a direct consequence of reference semantics.

## Side-by-side

| | Primitive | Reference |
|---|---|---|
| What the variable holds | the value | an address |
| Types | string, number, boolean, undefined, null, symbol, bigint | object, array, function, Date, Map, Set... |
| Assignment copies | the value | the address |
| `===` compares | value | identity |
| Mutable | no | yes |
| Function receives | a copy of the value | a copy of the address |
| Cost of copying | trivial | grows with the structure |

## The rule of thumb

If a bug looks like "I changed one thing and something unrelated changed too," you shared a reference by accident. If it looks like "I changed it and nothing happened," you replaced a local copy of an address, or you tried to mutate a primitive.
