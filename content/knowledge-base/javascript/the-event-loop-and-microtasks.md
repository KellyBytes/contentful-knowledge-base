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
order: 500
versionScope: >-
  Promises: ES2015; async/await: ES2017; queueMicrotask(): Node.js 11+ (2018), browsers same era. Node's phased event loop differs from the browser model described here.
readingTime: 12
prerequisites:
  - closures-explained
related:
  - promises-and-async-await
gotchas:
  - id: 4w4rBurWeZ9errvRFryb5F
    symptom: >-
      My `setTimeout(fn, 0)` callback ran after other code and promise callbacks that were scheduled later than it.
    slug: immediate-timeout-runs-after-microtasks
    errorMessage:
    cause: >-
      A zero-delay timeout still goes through the task queue. Every pending microtask — including ones scheduled after the timeout — drains completely before any task gets a turn.
    fix: >-
      Don't use `setTimeout` to sequence something that must run before a promise callback. Use synchronous code, or restructure the logic so it doesn't depend on timer ordering.
    category: JavaScript
    tag:
      - async
  - id: 7gTTXUqmVk1CtDanHZP4yT
    symptom: >-
      My page froze completely, even though the recursive function I wrote uses Promises, which I thought were asynchronous.
    slug: microtask-recursion-freezes-page
    errorMessage:
    cause: >-
      A microtask that reschedules itself is drained immediately along with every other microtask, before the loop is allowed to move on. The browser never gets a turn to render or handle input.
    fix: >-
      Insert a real task boundary — schedule the next iteration with `setTimeout` instead of a promise — so the browser can breathe between iterations.
    category: JavaScript
    tag:
      - async
      - performance
  - id: 2144NQqo69gMlfBDlMD1kc
    symptom: >-
      My code after `await` ran later than the code right after calling the async function, with no timer involved.
    slug: await-yields-a-microtask-turn
    errorMessage:
    cause: >-
      Everything after an `await` runs as a microtask. The async function only runs synchronously up to its first `await` — the caller's next line runs before that microtask does.
    fix: >-
      Treat everything after an `await` like the body of a `.then()`. It will never run before the code that follows the function call itself.
    category: JavaScript
    tag:
      - async
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

Run this and predict the order the four lines print, before reading on.

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
```

The order is `1, 4, 3, 2` — not `1, 2, 3, 4`, and not `1, 4, 2, 3` either.
`setTimeout` with a delay of zero still finishes dead last, behind a promise
callback that was scheduled after it.

JavaScript runs on **one thread** — it can only do one thing at a time —
yet a page fetches data, runs timers, and responds to clicks without ever
fully stopping. The **event loop** is the mechanism that decides what runs
next, and getting that four-line puzzle right comes down to exactly one
rule, which the rest of this article unpacks.

## The restaurant analogy

Picture a restaurant with exactly **one chef**.

- The chef cooks one dish at a time, start to finish. That's the **call
  stack**.
- Orders waiting to be cooked sit in a queue on the pass. That's the **task
  queue**.
- The oven, the timer, and the delivery driver all work on their own. Those
  are **browser APIs** — not the chef, and not part of JavaScript.
- Between dishes, the chef always glances at a small **priority slip
  holder** first: corrections to the dish just served. That's the
  **microtask queue**.

The chef never abandons a dish halfway. If one dish takes twenty minutes of
active work, every other order waits. That's what "blocking" means.

Where the analogy breaks: a human chef, even a disciplined one, would
eventually get tired of the priority slips and serve the next full order
anyway. The event loop has no such judgment call — it drains the microtask
queue completely, no matter how many new slips arrive while it's looking,
before it will ever glance at the task queue. That's not a minor detail.
It's exactly why a microtask that keeps generating more microtasks can
freeze a page forever, which the starvation trap below covers directly.

## The moving parts

```text
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

The rule the whole article rests on: **when the call stack empties, drain
the entire microtask queue. Only then take one task from the task queue.**

## Reading the order

```js
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');
```

Walking through it:

1. `"1"` runs immediately — synchronous code goes straight onto the stack.
2. `setTimeout` hands its callback to the browser's timer. It is _not_ on
   the stack, and it goes to the task queue once the timer fires.
3. `.then` schedules a **microtask** — it goes to the microtask queue, not
   the task queue.
4. `"4"` runs immediately, same as step 1.
5. The stack is now empty. The event loop drains microtasks first → `"3"`.
6. Only now does a task run → `"2"`.

`setTimeout(fn, 0)` does not mean "run now." It means "run after the
current work and all pending microtasks."

## Why microtasks come first

A promise represents a value that has already been decided. Callbacks
reacting to that decision should not be delayed by unrelated work such as a
timer that happened to be scheduled earlier.

Draining the whole microtask queue in one go keeps a chain of `.then` calls
**atomic** — nothing else can slip between the links.

```js
Promise.resolve()
  .then(() => console.log('a'))
  .then(() => console.log('b'));

setTimeout(() => console.log('timer'));

// a, b, timer
```

Each `.then` schedules the _next_ microtask only when the previous one
finishes, and the loop keeps draining until the queue is genuinely empty —
including microtasks added while draining.

## The starvation trap

Because the queue is drained **completely**, a microtask that schedules
another microtask forever will freeze the page. Timers never get a turn,
and neither does rendering.

```js
function spin() {
  Promise.resolve().then(spin); // ❌ page is now frozen
}
spin();
```

The same loop with `setTimeout` is harmless — each iteration is a separate
task, so the browser gets a chance to render and handle input in between.

```js
function spin() {
  setTimeout(spin, 0); // ✅ slow, but the page stays responsive
}
spin();
```

This is the practical reason to know the difference. Anything recursive
that runs on promises needs a task boundary somewhere.

## Where rendering fits

In a browser, painting happens **between tasks**, never in the middle of
one, and never during a microtask drain.

```text
┌─ task ─┐ ┌ microtasks ┐ ┌─ render ─┐ ┌─ task ─┐ ┌ microtasks ┐ ...
```

Two consequences worth remembering:

- A long synchronous loop blocks paint. The spinner you set just before it
  will never appear.
- Splitting heavy work across `setTimeout` calls lets frames render in
  between. `requestAnimationFrame` is the precise tool when the work is
  visual, since it runs immediately before the next paint.

## async/await is the same machinery

`await` is promise callbacks with different syntax. Everything after an
`await` is effectively the body of a `.then`, so it runs as a **microtask**.

```js
async function run() {
  console.log('A');
  await null; // yields here
  console.log('B'); // microtask
}

run();
console.log('C');

// A, C, B
```

The function runs synchronously until the first `await`, then returns
control. `"C"` runs, the stack empties, and only then does `"B"` resume.
This is why `await` inside a loop is slow — each iteration waits a full
turn before the next one begins.

## Side-by-side

|                             | Microtask                               | Task (macrotask)          |
| --------------------------- | --------------------------------------- | ------------------------- |
| Examples                    | `.then`, `await`, `queueMicrotask`      | `setTimeout`, events, I/O |
| How many run per turn       | all of them, including newly added ones | exactly one               |
| Can starve the page         | yes                                     | no                        |
| Rendering can happen before | no                                      | yes                       |

## The rule of thumb

If ordering surprises you, ask two questions in order: **has the call stack
emptied yet**, and **is this a microtask or a task?** Synchronous code
finishes first, microtasks drain completely, then one task runs. That
sequence is fixed and has no exceptions, which is exactly why it works as a
diagnostic — almost every "why did this log out of order" bug resolves
against those three steps.

## Version and environment notes

- Promises are **ES2015**; `async`/`await` is **ES2017**.
- `queueMicrotask()` shipped in **Node.js 11+** (2018) and reached browsers
  around the same time — safe to assume in any current environment.
- Node.js splits tasks into phases (timers, I/O callbacks, check, close)
  and adds two queues that don't exist in the browser model:

  |                    | Runs when                                            |
  | ------------------ | ---------------------------------------------------- |
  | `process.nextTick` | before other microtasks, after the current operation |
  | promise callbacks  | after `nextTick`, before the next phase              |
  | `setImmediate`     | in the check phase, after I/O                        |

  For interview purposes, the browser model above is almost always what's
  being asked about. Bring up Node's phases only if the question goes
  there specifically.

- To verify behavior for a given runtime, log the order directly — this
  article's opening snippet is a fast way to check any environment.

## Check yourself

**1.** What does this print?

```js
console.log('start');

setTimeout(() => console.log('timeout'), 0);

Promise.resolve()
  .then(() => console.log('promise 1'))
  .then(() => console.log('promise 2'));

console.log('end');
```

**2.** What does this print?

```js
async function log() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}

console.log('1');
log();
console.log('2');
```

<details>
<summary>Answers</summary>

**1.** `start, end, promise 1, promise 2, timeout`. The two synchronous
lines run first. Then the microtask queue drains completely, including the
second `.then`, which was only scheduled once the first one finished. Only
after both microtasks run does the timer's task get a turn.

**2.** `1, A, 2, B`. `log()` runs synchronously up to its first `await`, so
`"A"` prints before `console.log("2")` ever runs. The rest of `log` resumes
as a microtask, so `"B"` prints last, after the synchronous code following
the call has finished.

</details>

## Sources

- MDN Web Docs — [The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- MDN Web Docs — [In depth: Microtasks and the JavaScript runtime environment](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)
- Node.js Docs — [The Node.js Event Loop, Timers, and process.nextTick()](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
