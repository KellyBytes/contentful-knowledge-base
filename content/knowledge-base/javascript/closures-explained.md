---
contentType: article
title: Closures Explained
slug: closures-explained
category: JavaScript
tag:
  - scope-and-closures
  - state-management
  - interview-frequent
difficulty: Intermediate
summary: >-
  A closure is a function that keeps access to the variables of the scope it was
  created in, even after that scope has finished running. It is what makes
  private state, factory functions, and most callback patterns possible.
contentfulEntryId: xu0KrzEfJQF2mtgpf3wYd
order: 40
versionScope: ES2015 (ES6) and later; React examples target React 18+
readingTime: 12
prerequisites:
  - var-let-const
related: []
gotchas:
  - id: fcsHcCinsnk9GYrcSAIhA
    symptom: >-
      My loop callbacks all print the same final number, even though the counter
      changed each time.
    slug: var-loop-callback-shares-binding
    cause: >-
      `var` gives the whole loop one shared binding. The callbacks run after the
      loop finishes, so they all read the same finished value.
    fix: >-
      Change the loop counter to `let`. A `for` loop creates a fresh binding per
      iteration, so each callback captures its own.
    category: JavaScript
    tag:
      - scope-and-closures
  - id: 3VVLfbpiP1UjhYpvu9io49
    symptom: >-
      My interval updates the counter once and then stops, even though it keeps
      firing every second.
    slug: stale-closure-in-effect
    cause: >-
      The effect ran once with an empty dependency array, so its callback still
      holds the variables from the first render. It reads the same initial value
      forever, no matter how many times the state has changed since.
    fix: >-
      Use the updater form — `setCount(prev => prev + 1)` — so the callback
      never reads the stale value at all. If the callback genuinely needs the
      current value, add it to the dependency array so the closure is rebuilt.
    category: JavaScript
    tag:
      - scope-and-closures
      - state-management
  - id: 2yBQa64pV2BXhQZ4HSCrxk
    symptom: >-
      Two things that should each have their own private state are overwriting
      each other.
    slug: closure-shared-across-instances
    cause: >-
      The factory was called once, and its result was reused. A closure is
      private to one invocation, not to one function, so everything derived from
      that single call shares the same variables.
    fix: >-
      Call the factory once per instance instead of once per module. If you
      genuinely want shared state, keep the single call and make that intent
      obvious in the name.
    category: JavaScript
    tag:
      - scope-and-closures
      - state-management
  - id: 5SJqngLeg08xNuB7a7J7Ts
    symptom: >-
      My page's memory keeps climbing, and data I created inside a function is
      never freed.
    slug: closure-retains-memory
    cause: >-
      A closure keeps its referenced variables alive for as long as the closure
      itself is reachable. A listener or timer that is never removed holds that
      closure — and everything it captured — for the life of the page.
    fix: >-
      Remove the listener or clear the timer when you are done. In React that is
      what the cleanup function returned from `useEffect` is for.
    category: JavaScript
    tag:
      - scope-and-closures
      - performance
interviewQuestions:
  - id: 5iVimjqCU5OLsi2XcC50yY
    question: What is a closure?
    shortAnswer: >-
      A function that keeps access to the variables of the scope it was defined
      in, even after that scope has finished running. Practically, it gives a
      function private memory that persists between calls and cannot be reached
      from outside. Every function is technically a closure over where it was
      written; it only becomes visible when the function outlives that scope —
      returned from a factory, passed to setTimeout, or registered as an event
      listener. Say what it enables, not just what it is: private state, factory
      functions, and callbacks that remember something.
  - id: 3htbRCmVSJcRoShgenWWBW
    question: Do two closures created by the same function share their variables?
    shortAnswer: >-
      It depends on whether they came from the same call. Two separate calls to
      a factory each create a fresh scope, so their closures are completely
      independent. But two functions returned from a single call close over the
      same variables and see each other's changes — that is exactly how the
      module pattern works, with several methods sharing one private value. So a
      closure is not private to one function; it is private to one invocation.
      Getting this backwards is the usual cause of state leaking between
      instances.
  - id: 2yTDGquZPTb6lANteFfNKk
    question: Does `let` solve every closure problem?
    shortAnswer: >-
      No. `let` fixes one specific case: a for loop creates a fresh binding each
      iteration, so callbacks made inside it capture their own copy. That is all
      it does. It does nothing for a stale closure in React, where the problem
      is that the callback was never recreated, not that the binding was shared.
      It also does not help when a variable genuinely changes and the closure
      legitimately sees the latest value. The fix there is a dependency array or
      an updater function, not a different declaration keyword.
  - id: 1YYkhe4h04rpV0AMyAr2ba
    question: When would you choose a closure over a class?
    shortAnswer: >-
      Closures suit a single behaviour with a little hidden state — a debounce,
      a memoised lookup, a counter. Classes suit something with several related
      methods and an identity you may want to extend or test with instanceof.
      Closures give genuine privacy and read well when there is one obvious
      thing to do. Classes are easier to inspect in a debugger and cheaper at
      scale, since methods live once on the prototype rather than being rebuilt
      on every call. Most of the time it is a readability decision rather than a
      correctness one.
---

Read this and explain how it is possible.

```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
```

`makeCounter()` finished running on the very first line. Its local variable `count` should have been cleaned up along with everything else in that call. Instead it is still there, still counting, and there is no way to reach it from the outside.

That is a **closure**: a function bundled together with the variables that surrounded it when it was created. The function carries that bundle wherever it goes, so it can still read and update those variables long after the outer function has returned.

## Scope and closure are not the same thing

These two get mixed up constantly, and the distinction is worth one sentence each.

- **Scope** is the set of variables available at a particular place in the code.
- **A closure** is a function that carries that scope with it when it travels somewhere else.

Every function in JavaScript is a closure. Most of the time you never notice, because the outer scope is still around. It becomes visible the moment the outer function finishes and the inner function keeps working anyway.

## The backpack analogy

Think of a function as a person leaving a room.

On the way out, they pack a **backpack** containing every variable they could see inside that room. The room gets demolished, but the backpack goes with them. Whenever they need one of those variables, they reach into the backpack — not into the room, which no longer exists.

Two details make the analogy accurate:

- The backpack holds **the actual variables, not photocopies**. Change one, and it stays changed for everyone holding that backpack.
- Two people leaving the same room at different times get **their own separate backpacks**.

And one detail where the analogy breaks, which matters later:

> Nothing is actually packed. The backpack is a live connection to variables that are still sitting where they always were — the engine simply refuses to clean them up while someone can still reach them. And it only keeps the variables the function genuinely mentions, not everything that was in the room.

Keep that in mind when you get to the memory section. "The bag is heavy" is the wrong picture; "the room can't be demolished" is the right one.

## What actually happens

```text
   makeCounter() runs and returns
  ┌─────────────────────────┐
  │  makeCounter scope      │  ← gone from the call stack
  │    count: 3             │  ← but this variable survives
  └──────────▲──────────────┘
             │ backpack
        ┌────┴─────┐
        │ counter  │  ← the returned function holds on to it
        └──────────┘
```

Normally, when a function returns, its local variables become unreachable and the garbage collector takes them. Here the returned function still refers to `count`, so `count` is still reachable, so it stays.

Note that `count` is unreachable from the _outside_. There is no way to write `counter.count = 100`. That property is the foundation of the next section.

## Use case 1: private state

Before `#private` class fields existed, closures were _the_ way to hide data in JavaScript.

```js
function createAccount(initial) {
  let balance = initial; // private

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error('Invalid amount');
      balance += amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createAccount(100);
account.deposit(50); // 150
account.getBalance(); // 150
account.balance; // undefined — no way in
```

The only paths to `balance` are the two functions you deliberately exposed. Validation cannot be bypassed, because there is no back door.

Notice that `deposit` and `getBalance` share one `balance`. They came from the same call, so they got the same backpack. **A closure is private to one invocation, not to one function.**

## Use case 2: every call gets its own backpack

```js
const a = makeCounter();
const b = makeCounter();

a();
a(); // 2
b(); // 1  — completely independent
```

Every invocation of `makeCounter` creates a fresh scope with a fresh `count`. This is why factory functions work at all, and it is the same mechanism behind two React components each having their own state.

Together with the previous section, this gives you the whole rule: **same call, shared variables; different calls, separate variables.** Getting this backwards is the usual cause of state leaking between things that should have been independent.

## Use case 3: pre-loading a function with configuration

```js
function createLogger(prefix) {
  return message => console.log(`[${prefix}] ${message}`);
}

const apiLog = createLogger('API');
const dbLog = createLogger('DB');

apiLog('request sent'); // [API] request sent
dbLog('query failed'); // [DB] query failed
```

`prefix` is baked in once and never has to be passed again. The same idea powers `debounce`, `throttle`, memoization caches, and most middleware in Express. Currying is this trick taken to its conclusion — each returned function closes over the arguments supplied so far, until enough have been collected to run.

Closures can also remember what already happened:

```js
function once(fn) {
  let called = false;
  let result;

  return function (...args) {
    if (called) return result;
    called = true;
    result = fn(...args);
    return result;
  };
}
```

`called` and `result` are the closure's private memory between calls.

## The loop trap

This is the closure question most likely to come up in an interview.

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
// 3, 3, 3
```

All three callbacks closed over **the same variable**, because `var` creates one binding for the whole function. By the time the timers fire, that one variable holds `3`.

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));
}
// 0, 1, 2
```

`let` creates **a fresh binding per iteration**, so each callback gets its own backpack. See [var, let, and const](/kb/javascript/var-let-const) for why the two keywords differ.

Before ES2015, the workaround was to manufacture a new scope by hand with an immediately-invoked function:

```js
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j));
  })(i);
}
// 0, 1, 2
```

The key insight, and the sentence worth memorising: **closures capture variables, not values.** If the variable changes later, the closure sees the new value.

## Where closures show up in React

Every event handler and every effect callback is a closure over that render's variables.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1); // ❌ always closes over count = 0
    }, 1000);
    return () => clearInterval(id);
  }, []); // empty deps — this callback is never recreated
}
```

The effect ran once, on the first render, so its callback carries a backpack containing `count = 0` forever. The counter goes to 1 and stops. This is a **stale closure**.

Two fixes, and they are not interchangeable:

```jsx
setCount(prev => prev + 1); // ✅ never read count at all
```

```jsx
useEffect(() => {
  /* ... */
}, [count]); // ✅ rebuild the closure whenever count changes
```

Use the updater form when you only need the previous value. Add the dependency when the callback genuinely needs the current value for something else. The dependency array is essentially a list of "which variables in my backpack need refreshing."

This is also where `let` stops helping. The loop trap was one shared binding; a stale closure is a callback that was never rebuilt. Same symptom, different cause, different fix.

## Closures vs classes

Both give you state attached to behaviour, so the choice comes up often.

|                     | Closure                          | Class                                |
| ------------------- | -------------------------------- | ------------------------------------ |
| Privacy             | genuine — no outside path in     | `#private` fields, or convention     |
| Best fit            | one behaviour, a little state    | several related methods, an identity |
| Cost per instance   | methods rebuilt on every call    | methods live once on the prototype   |
| Debugger visibility | awkward — inspect the scope pane | straightforward — inspect the object |
| `instanceof` checks | not available                    | available                            |

Reach for a closure for a debounce, a memoised lookup, a counter. Reach for a class when there are several related methods and you may want to extend or type-check it. Most of the time this is a readability decision, not a correctness one.

## The cost

Closed-over variables cannot be garbage collected while the closure is alive. That is the entire point — but it becomes a leak if you forget to release the closure.

```js
function attach() {
  const bigData = new Array(1_000_000).fill('x');

  const handler = () => console.log(bigData.length);
  window.addEventListener('resize', handler);
  // bigData stays in memory for the life of the page
}
```

Removing the listener drops the last reference, and both the closure and `bigData` become collectable. This is exactly what a `useEffect` cleanup function is for.

Engines only retain the variables a closure actually references, not the entire outer scope, so the practical cost is usually small. The leaks that matter are the ones where something long-lived — a listener, a timer, a subscription, a module-level cache — is holding a closure over something large.

## The rule of thumb

Whenever a function outlives the scope it was defined in — returned from a factory, passed to `setTimeout`, registered as an event listener, stored in a hook — it is carrying a backpack.

Ask two questions:

1. **Is the data in there still current?** If not, you have a stale closure.
2. **Is anything holding this function alive longer than it should be?** If so, you have a leak.

## Version and environment notes

- The per-iteration binding for `let` in a `for` loop arrived with **ES2015 (ES6)**. Before that, the IIFE workaround above was the only option. Closures themselves have existed since the first version of JavaScript.
- `#private` class fields, the main alternative to closure-based privacy, are **ES2022**. Check your build target before relying on them.
- The React examples target **React 18+**. In development, StrictMode mounts effects twice, so an interval example may look like it is running at double speed. That is StrictMode, not a stale closure — verify in a production build before debugging it.
- Chrome DevTools shows captured variables under **Scope → Closure** while paused inside the function. This is the fastest way to confirm what a callback is actually holding.

## Check yourself

**1.** What does this print?

```js
function make() {
  let n = 0;
  return { inc: () => ++n, get: () => n };
}

const a = make();
const b = make();

a.inc();
a.inc();
console.log(a.get(), b.get());
```

**2.** What is in the array, and what changes if `var` becomes `let`?

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map(f => f()));
```

<details>
<summary>Answers</summary>

**1.** `2 0`. `inc` and `get` came from the same call, so they share one `n` — that is why `a.get()` sees the increments. `b` came from a different call, so its `n` is a separate variable that was never touched.

**2.** `[3, 3, 3]`. All three functions closed over the one `var i`, which is `3` by the time any of them runs. With `let`, each iteration gets its own binding and the result is `[0, 1, 2]`.

</details>

## Sources

- MDN Web Docs — [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- MDN Web Docs — [Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- React — [`useEffect`](https://react.dev/reference/react/useEffect)
