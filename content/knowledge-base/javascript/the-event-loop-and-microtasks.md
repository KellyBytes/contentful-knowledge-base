---
contentType: article
title: The Event Loop and Microtasks
slug: the-event-loop-and-microtasks
category: JavaScript
tag:
  - async
  - performance
  - interview-frequent
difficulty: Intermediate
summary: >-
  JavaScript runs one thing at a time, and the event loop decides what runs
  next. Microtasks such as promise callbacks always jump ahead of timers and
  events, which explains most surprising ordering in async code.
contentfulEntryId: 4UBVUBwsXMUrIn86oZVhLU
order: 50
interviewQuestions:
  - id: 5UiPqtRuOCHOwCIROvaMN3
    question: What is the event loop?
    shortAnswer: >-
      JavaScript runs on a single thread, so it can only execute one thing at a
      time. Slow work such as timers, network requests, and DOM events is handed
      to the surrounding environment, which puts a callback in a queue when it
      finishes. The event loop is the mechanism that moves those callbacks onto
      the call stack, and it only does so once the stack is empty. The ordering
      rule that matters is: finish the current synchronous code, drain every
      pending microtask, then run exactly one task.
  - id: 6K59tOcIkwvJYcOrPzLdHK
    question: 'Why do promise callbacks run before setTimeout, even with a delay of zero?'
    shortAnswer: >-
      They sit in different queues, and the microtask queue has absolute
      priority. A promise represents a value that has already been decided, so
      reacting to it should not be delayed by unrelated work that happened to be
      scheduled earlier. Draining the whole microtask queue in one pass also
      keeps a chain of then calls atomic — nothing can slip between the links.
      setTimeout with zero delay does not mean run now; it means run after the
      current work and after everything in the microtask queue.
  - id: 4poKnsTmRS0jzoMxI4EaUu
    question: Can async code freeze the page?
    shortAnswer: >-
      Yes, in two ways. A long synchronous block holds the call stack, so
      nothing else runs and no frame is painted — a spinner set just before it
      will never appear. Less obviously, a microtask that schedules another
      microtask recursively will freeze the page too, because the loop drains
      the queue completely before doing anything else. Timers never get a turn.
      The same recursion built on setTimeout is safe, since each iteration is a
      separate task and the browser can render in between.
  - id: g4OTW9Bep47a8D2mYEzV3
    question: How do you keep a long-running computation from blocking the UI?
    shortAnswer: >-
      First ask whether it belongs on the main thread at all — anything
      genuinely heavy is better in a Web Worker, which has its own thread and
      cannot block rendering. If it must stay on the main thread, split it into
      chunks separated by a task boundary so paint and input can happen in
      between; setTimeout works, and requestIdleCallback is better when the work
      can wait. For visual updates specifically, requestAnimationFrame runs
      immediately before the next paint. Awaiting a promise does not help,
      because microtasks run before rendering.
---
JavaScript has **one thread**. It can only do one thing at a time. Yet a page can fetch data, run a timer, and respond to clicks without ever stopping — because the language hands slow work to the surrounding environment and picks the results up later.

The **event loop** is the mechanism that decides what to pick up, and in what order.

## The restaurant analogy

Picture a restaurant with exactly **one chef**.

- The chef cooks one dish at a time, start to finish. That's the **call stack**.
- Orders waiting to be cooked sit in a queue on the pass. That's the **task queue**.
- The oven, the timer, and the delivery driver all work on their own. Those are **browser APIs** — not the chef, and not part of JavaScript.
- Between dishes, the chef always glances at a small **priority slip holder** first: corrections to the dish just served. That's the **microtask queue**.

The chef never abandons a dish halfway. If one dish takes twenty minutes of active work, every other order waits. That's what "blocking" means.

## The moving parts

```
     ┌──────────────┐
     │  Call stack  │  ← one chef, one dish at a time
     └──────▲───────┘
            │  event loop puts the next callback here
            │  (only when the stack is empty)
   ┌────────┴──────────────────────────┐
   │                                   │
┌──┴───────────────┐        ┌──────────┴────────┐
│ Microtask queue  │        │    Task queue     │
│ promises,        │  ALL   │ setTimeout,       │
│ queueMicrotask,  │ before │ events, I/O,      │
│ MutationObserver │  ANY   │ setInterval       │
└──────────────────┘        └───────────────────┘
        ▲                            ▲
        └──── Web APIs / Node APIs ──┘
              timers, fetch, DOM events
```

The rule the whole article rests on:

**When the call stack empties, drain the entire microtask queue. Only then take one task from the task queue.**

## Reading the order

```js
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");
```

The output is `1, 4, 3, 2`.

Walking through it:

1. `"1"` runs immediately — synchronous code goes straight onto the stack.
2. `setTimeout` hands the callback to the browser's timer. It is *not* on the stack.
3. `.then` schedules a **microtask**.
4. `"4"` runs immediately.
5. Stack is now empty. The event loop drains microtasks first → `"3"`.
6. Only now does a task run → `"2"`.

`setTimeout(fn, 0)` does not mean "run now." It means "run after the current work and all pending microtasks."

## Why microtasks come first

A promise represents a value that has already been decided. Callbacks reacting to that decision should not be delayed by unrelated work such as a timer that happened to be scheduled earlier.

Draining the whole microtask queue in one go keeps a chain of `.then` calls **atomic** — nothing else can slip between the links.

```js
Promise.resolve()
  .then(() => console.log("a"))
  .then(() => console.log("b"));

setTimeout(() => console.log("timer"));

// a, b, timer
```

Note that each `.then` schedules the *next* microtask only when the previous one finishes, and the loop keeps draining until the queue is genuinely empty — including microtasks added while draining.

## The starvation trap

Because the queue is drained **completely**, a microtask that schedules another microtask forever will freeze the page. Timers never get a turn, and neither does rendering.

```js
function spin() {
  Promise.resolve().then(spin);   // ❌ page is now frozen
}
spin();
```

The same loop with `setTimeout` is harmless — each iteration is a separate task, so the browser gets a chance to render and handle input in between.

```js
function spin() {
  setTimeout(spin, 0);   // ✅ slow, but the page stays responsive
}
spin();
```

This is the practical reason to know the difference. Anything recursive that runs on promises needs a task boundary somewhere.

## Where rendering fits

In a browser, painting happens **between tasks**, never in the middle of one, and never during a microtask drain.

```
┌─ task ─┐ ┌ microtasks ┐ ┌─ render ─┐ ┌─ task ─┐ ┌ microtasks ┐ ...
```

Two consequences worth remembering:

- A long synchronous loop blocks paint. The spinner you set just before it will never appear.
- Splitting heavy work across `setTimeout` calls lets frames render in between. `requestAnimationFrame` is the precise tool when the work is visual, since it runs immediately before the next paint.

## async/await is the same machinery

`await` is promise callbacks with different syntax. Everything after an `await` is effectively the body of a `.then`, so it runs as a **microtask**.

```js
async function run() {
  console.log("A");
  await null;              // yields here
  console.log("B");        // microtask
}

run();
console.log("C");

// A, C, B
```

The function runs synchronously until the first `await`, then returns control. `"C"` runs, the stack empties, and only then does `"B"` resume.

This is why `await` inside a loop is slow — each iteration waits a full turn before the next begins.

## Node.js differs in the details

The concept is identical, but Node splits tasks into phases (timers, I/O callbacks, check, close) and adds two queues of its own.

| | Runs when |
|---|---|
| `process.nextTick` | before other microtasks, after the current operation |
| promise callbacks | after `nextTick`, before the next phase |
| `setImmediate` | in the check phase, after I/O |

For interview purposes, the browser model is what's being asked about. Mention that Node has phases only if the question goes there.

## Side-by-side

| | Microtask | Task (macrotask) |
|---|---|---|
| Examples | `.then`, `await`, `queueMicrotask` | `setTimeout`, events, I/O |
| How many run per turn | all of them, including newly added ones | exactly one |
| Can starve the page | yes | no |
| Rendering can happen before | no | yes |

## The rule of thumb

If ordering surprises you, ask two questions in order: **has the call stack emptied yet**, and **is this a microtask or a task?** Synchronous code finishes first, microtasks drain completely, then one task runs. Almost every "why did this log out of order" bug resolves against those three steps.
