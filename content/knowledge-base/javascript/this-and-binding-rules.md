---
contentType: article
title: '`this` and Binding Rules'
slug: this-and-binding-rules
category: JavaScript
tag:
  - scope-and-closures
  - interview-frequent
difficulty: Intermediate
summary: >-
  The value of `this` is decided by how a function is called, not by where it
  was written. Covers the four binding rules and their priority, why extracting
  a method loses its this, and how arrow functions opt out entirely.
contentfulEntryId: 3hVNkdnTSIZt7tThVEZJoQ
order: 70
versionScope: >-
  Arrow functions and lexical this are ES2015. Public class field syntax was standardized in ES2022, though React tooling (Babel) has supported it since long before that.
readingTime: 11
prerequisites:
  - var-let-const
related: []
gotchas:
  - id: 39Uo8nXT5ZZvecFvySWEk0
    symptom: I extracted a method from an object, called it alone, and `this` was undefined.
    slug: extracted-method-loses-this
    errorMessage:
    cause: Rule 3 needs something immediately left of the dot at the moment of the call. Copying the function to a variable or passing it to a callback removes the dot, so the call falls through to rule 4 instead.
    fix: Bind the method (`user.greet.bind(user)`), wrap it in an arrow function at the call site, or call it through the object instead of extracting it.
    category: JavaScript
    tag:
      - scope-and-closures
  - id: 26uHkdeNHAHYH8t0R11aLt
    symptom: My arrow function method on an object read `this` from outside the object entirely.
    slug: arrow-function-as-object-method-loses-this
    errorMessage:
    cause: An object literal doesn't create a scope. An arrow function used as a method looks straight past the object to whatever scope surrounds it, so `this` is never the object.
    fix: Use a regular function (or shorthand method syntax) for the method itself. Save arrow functions for callbacks written inside that method.
    category: JavaScript
    tag:
      - scope-and-closures
  - id: 60VmgBgIz8Xe8KdSfwSpMZ
    symptom: Calling `.bind()` a second time on my function didn't change what `this` was.
    slug: bind-is-permanent-and-cannot-be-rebound
    errorMessage:
    cause: Binding locks `this` in permanently. A function that has already been bound ignores any later `.call()`, `.apply()`, or a second `.bind()` — the first binding always wins.
    fix: If you need a different `this`, bind the original unbound function again rather than re-binding an already-bound one.
    category: JavaScript
    tag:
      - scope-and-closures
interviewQuestions:
  - id: 26DekgskOxCopJGOylCpew
    question: How is the value of `this` determined?
    shortAnswer: >-
      By **how the function is called**, not where it's written. Four rules, in
      priority order:


      1. `new Fn()` → a brand-new object

      2. `fn.call(obj)` / `fn.bind(obj)` → whatever you passed

      3. `obj.method()` → `obj`

      4. anything else → `undefined` in strict mode and modules, `globalThis`
      otherwise


      Arrow functions skip all four: they have no `this` of their own and take
      it from the enclosing scope, fixed where they're written.


      The shortcut when reading code is to look at what sits immediately left of
      the dot at the call site.
  - id: E4VZuRXIVNxrTICCvecpO
    question: >-
      Why is `this` decided by the call site rather than where the function is
      written?
    shortAnswer: >-
      Because functions in JavaScript are standalone values, not members of a
      class. The same function can be attached to any object, borrowed by
      another, or passed around on its own — so `this` can't be resolved until
      you know which object is doing the calling.


      That's what makes prototype methods work: one shared function serves every
      instance, with `this` supplying the instance at call time. If `this` were
      fixed where the function was written, every object would need its own copy
      of every method.


      The cost is that detaching a method loses its `this`.
  - id: 6qQ39dgH9jc6DL2O5Oz57q
    question: 'What is the difference between `call`, `apply`, and `bind`?'
    shortAnswer: >-
      All three set `this` explicitly. `call` and `apply` invoke the function
      immediately and differ only in argument shape — `call(obj, a, b)` takes
      them separately, `apply(obj, [a, b])` takes an array.


      `bind` invokes nothing. It returns a **new function** with `this` locked
      in, which is why it suits callbacks. It also does partial application:
      `fn.bind(obj, 1)` pre-fills the first argument.


      The catch worth knowing: binding is permanent. Calling `.bind()` again on
      an already-bound function has no effect, and neither does `.call()`
  - id: 1X5ZBhyxFUZkcTSiODI0LI
    question: Do you still need to worry about `this` in modern JavaScript?
    shortAnswer: >-
      Less than you used to, but you still have to read it. Hooks replaced class
      components, modules replaced `this`-heavy patterns, and arrow functions
      removed most `bind` calls — plenty of React codebases never write `this`
      at all.


      It still turns up in older class components, DOM event handlers where
      `this` is the element, library APIs such as Mocha's `this.timeout()`, and
      anything using prototypes directly.


      So it's rarely written in new code and regularly met in existing code,
      which is exactly why interviews keep asking.
---

Run this and predict what each call does before reading on.

```js
const user = {
  name: 'Kelly',
  greet() {
    return `Hi, ${this.name}`;
  },
};

const greet = user.greet;

user.greet(); // ?
greet(); // ?
```

`user.greet()` returns `"Hi, Kelly"`. `greet()` throws — `this` is
`undefined` inside it, even though `greet` is the exact same function,
copied verbatim.

Almost everything else in JavaScript is decided by **where you write it** —
variables, scope, and closures are all fixed at the moment the code is
written. `this` is the exception. It's decided by **how the function is
called**, and the same function can produce a different `this` on every
call. Four rules decide it, and they always resolve in the same order.

## The pronoun analogy

`this` behaves like the word **"my"** in a sentence.

Write on a card: _"The meeting is in my office."_

The card doesn't change, but its meaning does. If Kelly reads it aloud,
"my" means Kelly's office. Hand the card to someone else and the same
words now point somewhere completely different. Leave the card on a table
with nobody reading it, and "my" refers to nothing at all.

A function is that card. `this` is the pronoun. **Whoever calls the
function is the one speaking.**

Where the analogy breaks: a real pronoun can't be permanently pinned to
one meaning. Even if you told someone "when you read this card, my always
means Kelly's office," the next person to read it aloud would still hear
their own meaning. `bind()` does something no pronoun can — it locks
`this` in permanently, and once bound, no later call can override it
again. That permanence is the entire point of `bind`, covered below.

## The four rules, in priority order

Work down the ladder and stop at the first match.

```text
1. Called with `new`?              → this = the brand-new object
2. Called with .call/.apply/.bind? → this = what you passed
3. Something left of the dot?      → this = that object
4. None of the above?              → undefined  (strict mode / modules)
                                     globalThis (sloppy mode)
```

```js
function whoAmI() {
  return this;
}

const obj = { name: 'obj', whoAmI };

new whoAmI(); // 1 → a new empty object
whoAmI.call(obj); // 2 → obj
obj.whoAmI(); // 3 → obj
whoAmI(); // 4 → undefined in a module
```

Walking through why each line lands on a different rule:

1. `new whoAmI()` matches rule 1 immediately — `new` always wins, regardless
   of anything else about the call.
2. `whoAmI.call(obj)` wasn't called with `new`, so the ladder moves to rule
   2 — `this` is whatever was explicitly passed, here `obj`.
3. `obj.whoAmI()` has something immediately left of the dot, which matches
   rule 3 before rule 4 is ever considered — `this` is `obj`.
4. `whoAmI()` alone matches none of the first three rules, so it falls
   through to rule 4 — `undefined` in a module or strict-mode function.

Rule 2 is **explicit binding**: you state the value directly with `call`,
`apply`, or `bind`. Rule 3 is **implicit binding**, and it's the one that
breaks.

## Losing `this`

Rule 3 depends entirely on the dot being there **at the moment of the
call**. The opening example already showed the core failure: take the
function out of the object, and the dot disappears with it.

```js
setTimeout(user.greet, 100); // ❌ same problem — the dot never happens
```

Nothing was copied or modified. `greet` is the exact same function
object — it just isn't being called _through_ `user` anymore. This is why
callbacks are where `this` bugs live: passing `user.greet` to
`setTimeout`, `addEventListener`, or `.map()` hands over the function and
leaves the object behind.

## Arrow functions opt out

An arrow function has **no `this` of its own**. It looks outward to the
enclosing scope, exactly the way it would look up any other variable — and
that lookup is fixed where the arrow is written.

In other words, arrow functions treat `this` lexically, like a closure
variable. The four rules don't apply to them at all.

This makes them right for callbacks inside a method:

```js
const timer = {
  seconds: 0,
  start() {
    setInterval(() => {
      this.seconds++; // ✅ `this` is still `timer`
    }, 1000);
  },
};
```

And wrong for the method itself:

```js
const timer = {
  seconds: 0,
  start: () => {
    this.seconds++; // ❌ `this` came from outside the object
  },
};
```

An object literal doesn't create a scope, so the arrow reaches straight
past it to whatever surrounds the whole object.

**The pattern to remember: regular function for the method, arrow for the
callbacks inside it.**

## Class fields are the modern fix

In React class components, this used to require binding every handler by
hand:

```js
constructor() {
  this.handleClick = this.handleClick.bind(this);   // the old way
}
```

A class field holding an arrow function does the same thing without the
ceremony:

```js
class Button extends React.Component {
  handleClick = () => {
    this.setState({ clicked: true }); // `this` is the instance
  };
}
```

The arrow is created once per instance, while the constructor runs, so it
captures that instance permanently.

Function components sidestep the whole topic — there's no `this` to lose.

## `this` in the DOM

In a regular event listener, `this` is the element the handler is
attached to. In an arrow function it isn't.

```js
button.addEventListener('click', function () {
  this; // the button
});

button.addEventListener('click', () => {
  this; // whatever surrounded this code
});
```

Use `event.currentTarget` instead of `this` and the distinction stops
mattering.

## Side-by-side

|                                         | Regular function | Arrow function     |
| --------------------------------------- | ---------------- | ------------------ |
| Has its own `this`                      | yes              | no                 |
| `this` decided                          | at call time     | where it's written |
| Works as an object method               | yes              | no                 |
| Works as a callback inside a method     | needs binding    | yes                |
| Usable with `new`                       | yes              | no                 |
| `call` / `apply` / `bind` affect `this` | yes              | no                 |

## The rule of thumb

When `this` surprises you, don't look at where the function was
defined — that's the wrong end of the problem. Look at the **call site**
and ask what sits immediately left of the dot. If there's no dot, `this`
is `undefined`, and the fix is either an arrow function, a `bind`, or
passing the value in as an ordinary argument instead. That diagnostic
works because `this` is resolved at the call site, not the definition
site — asking anywhere else only tells you where the function was
written, which `this` never cared about in the first place.

## Version and environment notes

- Arrow functions and lexical `this` are **ES2015**.
- Public class field syntax (`handleClick = () => {}`) was standardized in
  **ES2022**, though Babel and Create React App enabled it years earlier,
  which is why it shows up in codebases well older than the spec date.
- Strict mode is automatic inside modules and classes, which is why rule 4
  resolves to `undefined` in almost all modern code. Sloppy-mode scripts
  are the exception, where it falls back to `globalThis`.
- To check which mode applies, log `this` directly at the top level of the
  file in question — a module logs `undefined`, a classic script logs the
  global object.

## Check yourself

**1.** What does this print?

```js
const counter = {
  count: 0,
  increment() {
    this.count++;
    return this.count;
  },
};

const inc = counter.increment;

console.log(counter.increment());
console.log(inc());
```

**2.** What does this print?

```js
function sayName() {
  return this.name;
}

const boundSayName = sayName.bind({ name: 'A' });
const reboundSayName = boundSayName.bind({ name: 'B' });

console.log(reboundSayName());
```

<details>
<summary>Answers</summary>

**1.** `1` then a `TypeError`. `counter.increment()` matches rule 3, so
`this` is `counter` and `count` becomes `1`. `inc()` is called with
nothing to the left of the dot, so it falls to rule 4 — `this` is
`undefined`, and `this.count++` throws.

**2.** `"A"`. Binding is permanent: `boundSayName` already has `this`
locked to `{ name: "A" }`, so calling `.bind()` on it again has no effect.
The second binding is silently ignored.

</details>

## Sources

- MDN Web Docs — [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- MDN Web Docs — [Function.prototype.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
- MDN Web Docs — [Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
