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
A **closure** is a function bundled together with the variables that surrounded it when it was created. The function carries that bundle wherever it goes, so it can still read and update those variables long after the outer function has returned.

Scope and closure are easy to mix up. **Scope** is the set of variables available at a particular place in the code. A **closure** is a function that carries that scope with it when it travels somewhere else.

Every function in JavaScript is a closure. Most of the time you never notice, because the outer scope is still around. It becomes visible the moment the outer function finishes and the inner function keeps working anyway.

## The backpack analogy

Think of a function as a person leaving a room.

On the way out, they pack a **backpack** containing every variable they could see inside that room. The room gets demolished, but the backpack goes with them. Whenever they need one of those variables, they reach into the backpack — not into the room, which no longer exists.

Two more details make the analogy accurate:

- The backpack holds **the actual variables, not photocopies**. Change one, and it stays changed for everyone holding that backpack.
- Two people leaving the same room at different times get **their own separate backpacks**.

## The simplest possible example

```js
function makeCounter() {
  let count = 0;                  // lives in makeCounter's scope

  return function () {
    count++;                      // reaches into the backpack
    return count;
  };
}

const counter = makeCounter();
counter();   // 1
counter();   // 2
counter();   // 3
```

`makeCounter()` finished on the very first line. Normally its local variables would be cleaned up. But the returned function still refers to `count`, so the engine keeps that variable alive.

```
   makeCounter() runs and returns
  ┌─────────────────────────┐
  │  makeCounter scope      │  ← the "room" is gone from the call stack
  │    count: 3             │  ← but this variable survives
  └──────────▲──────────────┘
             │ backpack
        ┌────┴─────┐
        │ counter  │  ← the returned function holds on to it
        └──────────┘
```

Note that `count` is unreachable from the outside. There is no way to write `counter.count = 100`. That's the foundation of the next section.

## Use case 1: private state

Before `#private` class fields existed, closures were *the* way to hide data in JavaScript.

```js
function createAccount(initial) {
  let balance = initial;                 // private

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Invalid amount");
      balance += amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const account = createAccount(100);
account.deposit(50);      // 150
account.getBalance();     // 150
account.balance;          // undefined — no way in
```

The only paths to `balance` are the two functions you deliberately exposed. Validation cannot be bypassed, because there's no back door.

## Use case 2: every call gets its own backpack

```js
const a = makeCounter();
const b = makeCounter();

a(); a();   // 2
b();        // 1  — completely independent
```

Every invocation of `makeCounter` creates a fresh scope with a fresh `count`. This is why factory functions work at all, and it's the same mechanism behind two React components each having their own state.

## Use case 3: pre-loading a function with configuration

```js
function createLogger(prefix) {
  return (message) => console.log(`[${prefix}] ${message}`);
}

const apiLog = createLogger("API");
const dbLog  = createLogger("DB");

apiLog("request sent");   // [API] request sent
dbLog("query failed");    // [DB] query failed
```

`prefix` is baked in once and never has to be passed again. The same idea powers `debounce`, `throttle`, memoization caches, and most middleware in Express. Currying is the same trick taken to its conclusion — each returned function closes over the arguments supplied so far until enough have been collected to run.

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

This is the closure question most likely to come up.

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

`let` creates a **fresh binding per iteration**, so each callback gets its own backpack.

Before ES6, the workaround was to manufacture a new scope by hand with an immediately-invoked function:

```js
for (var i = 0; i < 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j));
  })(i);
}
// 0, 1, 2
```

The key insight: closures capture **variables, not values**. If the variable changes later, the closure sees the new value.

## Where closures show up in React

Every event handler and every effect callback is a closure over that render's variables.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);   // ❌ always closes over count = 0
    }, 1000);
    return () => clearInterval(id);
  }, []);                    // empty deps — this callback never gets recreated
}
```

The effect ran once, on the first render, so its callback carries a backpack containing `count = 0` forever. The counter goes to 1 and stops. This is known as a **stale closure**.

Two fixes:

```jsx
setCount((prev) => prev + 1);   // ✅ don't read count at all
```

```jsx
useEffect(() => { /* ... */ }, [count]);  // ✅ rebuild the closure each time count changes
```

The dependency array is essentially a list of "which variables in my backpack need to be refreshed."

## The cost

Closed-over variables can't be garbage collected while the closure is alive. That's the point — but it becomes a leak if you forget to release the closure.

```js
function attach() {
  const bigData = new Array(1_000_000).fill("x");

  const handler = () => console.log(bigData.length);
  window.addEventListener("resize", handler);
  // bigData stays in memory for the life of the page
}
```

Removing the listener when you're done drops the last reference, and both the closure and `bigData` become collectable. This is exactly what a `useEffect` cleanup function is for.

Note that engines only retain the variables a closure actually references, not the entire outer scope, so the practical cost is usually small.

## The rule of thumb

Whenever a function outlives the scope it was defined in — returned from a factory, passed to `setTimeout`, registered as an event listener, stored in a hook — it is carrying a backpack. Ask yourself two questions: **is the data in there still current, and is anything holding this function alive longer than it should be?**
