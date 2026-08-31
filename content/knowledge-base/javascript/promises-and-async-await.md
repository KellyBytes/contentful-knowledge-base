---
contentType: article
title: Promises and async/await
slug: promises-and-async-await
category: JavaScript
tag:
  - async
  - error-handling
  - interview-frequent
difficulty: Intermediate
summary: >-
  A promise is a placeholder for a value that isn't ready yet, and async/await
  is a flatter syntax for the same machinery. Covers the three states, chaining,
  error handling, and running work in parallel instead of one at a time.
contentfulEntryId: 2x3LhP75tGICTQJFKLkJmf
order: 60
versionScope: >-
  Promise.allSettled: ES2020 (Node 12.9+); Promise.any: ES2021 (Node 15+, the same release that made unhandled rejections fatal in Node). AbortController is broadly supported in current runtimes.
readingTime: 13
prerequisites:
  - the-event-loop-and-microtasks
related: []
gotchas:
  - id: 3m0mBu42cxePfrYcf0XoYZ
    symptom: >-
      I called res.json() inside a `.then()`, but the next `.then()` logged undefined instead of the data.
    slug: forgotten-return-in-then-chain
    errorMessage:
    cause: >-
      A `.then()` callback that doesn't return anything resolves its own promise to `undefined`. The next `.then()` receives that `undefined` instead of waiting for the inner promise.
    fix: >-
      Return the value or promise from every `.then()` callback that should pass a result along — `return res.json()`, not just `res.json()`.
    category: JavaScript
    tag:
      - async
      - error-handling
  - id: 7nrlDi7VXTp3p6gyi33eMC
    symptom: >-
      My `try/catch` around fetch never caught a 404 or 500 response as an error.
    slug: fetch-does-not-reject-on-http-error
    errorMessage:
    cause: >-
      `fetch` only rejects on a network failure. An HTTP error status is a successful round trip as far as `fetch` is concerned, so nothing throws unless you check for it.
    fix: >-
      Check `res.ok` after every `fetch` and throw an error yourself when it's false, so it flows into the same `catch` block as network errors.
    category: JavaScript
    tag:
      - error-handling
  - id: IFramtnLOBWo7yMeER1Xz
    symptom: >-
      My `try/catch` didn't catch an error that happened while parsing the response body.
    slug: missing-await-on-return-skips-catch
    errorMessage:
    cause: >-
      Returning a promise without `await` inside a `try` block lets the function return before that promise settles, so a later rejection happens outside the `try` entirely.
    fix: >-
      Use `return await res.json()` inside a `try` block, not `return res.json()`, so a failure surfaces inside the same `catch`.
    category: JavaScript
    tag:
      - async
      - error-handling
  - id: 5iAXCceruP0OrUWFLFfQe
    symptom: >-
      I used `array.forEach` with an async callback expecting it to wait, but the loop finished before the requests completed.
    slug: foreach-does-not-await-async-callbacks
    errorMessage:
    cause: >-
      `forEach` ignores the promise its callback returns. It never waits for anything — it fires every iteration immediately and moves on.
    fix: >-
      Use a `for...of` loop to await sequentially, or `map()` combined with `Promise.all()` for a parallel version that resolves together.
    category: JavaScript
    tag:
      - async
  - id: 7Mq98MMjvPMXB1RhrHoF7C
    symptom: >-
      My async function never continued past an await and never threw either — it just hung with no error.
    slug: forgotten-executor-callback-hangs-forever
    errorMessage:
    cause: >-
      The promise's executor never called `resolve` or `reject` on that code path, so the promise never settles. `await` waits forever, with no error and no timeout.
    fix: >-
      Make sure every path inside a `new Promise()` executor calls `resolve` or `reject`, or race the promise against a rejecting timer with `Promise.race()` to guarantee it eventually settles.
    category: JavaScript
    tag:
      - async
interviewQuestions:
  - id: 5STUqzdaW47H4nmhemoRje
    question: What is a promise?
    shortAnswer: >-
      An object representing a value that isn't available yet. It starts
      *pending* and settles exactly once — either **fulfilled** with a value or
      **rejected** with a reason — and never changes after that.


      You register what happens next with `.then()` and `.catch()`, or with
      `await` inside an `async` function, which is the same mechanism written
      flatter.


      The part people miss: a promise doesn't make anything faster and doesn't
      use another thread. It's a placeholder that lets the single thread carry
      on while the result is pending.
  - id: 2FdwcVCyAdXHnA9FY1bmuF
    question: Why doesn't try/catch always catch async errors?
    shortAnswer: >-
      `try/catch` only catches what happens while that stack frame still exists.


      `await` works because it suspends the function and resumes it *inside* the
      same `try`, so a rejection surfaces as a thrown error. Anything you don't
      await escapes — a callback handed to `setTimeout`, a promise fired without
      `await` or `.catch()`, an error thrown after the function already
      returned. Those run on a fresh stack long after the `try` block finished.


      Fix it by awaiting the promise, attaching `.catch()`, or handling the
      error inside the callback itself.
  - id: 4y4gxD4BzDVgiUx6KQi7S7
    question: Can you cancel a promise?
    shortAnswer: >-
      No. A promise only *reads* a result — it has no control over the work
      producing it, and it settles once regardless of who's listening.


      What you can cancel is the underlying operation. `AbortController` is the
      standard way: pass its `signal` into `fetch`, call `abort()`, and the
      promise rejects with an `AbortError`.


      `Promise.race()` can stop you *waiting*, but the original request keeps
      running and its result is quietly discarded. That's a timeout, not a
      cancellation.
  - id: 4H6w75egk11CU8oWsh2oCQ
    question: Where should error handling live in an async application?
    shortAnswer: >-
      Where you can actually do something about it — usually the layer that can
      show a message or retry. Wrapping every `await` in `try/catch` creates
      noise and tends to swallow errors that should have surfaced.


      Let them bubble to one boundary per layer instead: an error boundary in
      React, error-handling middleware in Express.


      The exception is any promise you deliberately don't await. Attach
      `.catch()` to it, because an unhandled rejection is silent in the browser
      and terminates the process in Node 15 and later.
---

Run this and predict what it logs before reading on.

```js
function loadUser() {
  return fetch('/api/user')
    .then(res => {
      res.json();
    }) // no return here
    .then(data => console.log(data));
}

loadUser();
```

It logs `undefined`. `res.json()` really does parse the response — but the
first `.then()` callback never returns it, so the second `.then()` receives
whatever the first one returned instead: nothing.

A **promise** is an object that stands in for a value you don't have yet. It
doesn't make anything faster and doesn't run on another thread — it's a
receipt that lets the rest of the program carry on while the real value is
still pending. `async`/`await` is a flatter syntax for exactly the same
mechanism. This article covers the states a promise moves through, how
chaining actually works, the sharpest edges of error handling, and running
things in parallel instead of one at a time.

## The tracking number analogy

You order something online. You don't get the package — you get a
**tracking number**.

- The tracking number arrives instantly and is not the package.
- It sits in one of three states: still on the way (**pending**), delivered
  (**fulfilled**), or failed (**rejected**).
- Once it's settled, it never changes back. A delivered package doesn't
  become undelivered.
- You can register instructions in advance: _when it arrives, leave it with
  the neighbour._ That's `.then()`.

```text
                    ┌──────────────► fulfilled (value)
                    │                    │
   pending ─────────┤                    ├──► settled: never changes again
                    │                    │
                    └──────────────► rejected (reason)
```

The important consequence: **a promise settles exactly once**, no matter
how many places are listening.

Where the analogy breaks: a real tracking number belongs to a shipment
that's already moving — even a lost package eventually gets flagged and
refunded. A promise has no such guarantee. If the code that creates it
never calls `resolve` or `reject` on every path, the promise simply never
settles — no error, no timeout, just a permanently pending placeholder.
`await` on it hangs forever with no signal that anything went wrong.

## Consuming a promise

Most of the time you're using promises other people created — `fetch`, a
database driver, `fs.promises`.

```js
fetch('/api/user')
  .then(res => res.json()) // runs on success
  .catch(err => console.error(err)) // runs on any failure above
  .finally(() => setLoading(false)); // runs either way
```

Two things make chaining work, and both explain the opening bug:

1. `.then()` returns a new promise. That's why you can keep chaining.
2. What you return inside `.then()` matters. Return a plain value and the
   next `.then()` receives it. Return a promise and the chain _waits_ for
   it.

Walking through the opening example with that in mind:

1. `loadUser()` calls `fetch()`, which returns a promise for the response.
2. The first `.then()` callback runs once that settles, calls
   `res.json()` — which itself returns a promise — but never returns it.
3. Because nothing was returned, the first `.then()`'s own promise resolves
   with `undefined`.
4. The second `.then()` receives that `undefined`, not the parsed data.
5. The fix is `return res.json()`, so the chain waits for the real value.

## async/await is the same thing

`async/await` is syntax over promises. Nothing new happens underneath.

```js
async function loadUser() {
  const res = await fetch('/api/user');
  const data = await res.json();
  return data;
}
```

Two rules cover most of it:

- An `async` function **always returns a promise**, even if you return a
  plain value.
- `await` unwraps a promise: it pauses the function until the promise
  settles, then gives you the value — or throws if it rejected.

`await` does not block the thread. The function is suspended and the
single thread carries on with everything else. Only that one function is
paused.

## Error handling

With `await`, a rejected promise becomes a thrown error, so ordinary
`try/catch` works:

```js
async function loadUser() {
  try {
    const res = await fetch('/api/user');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load user', err);
    return null;
  }
}
```

⚠️ `fetch` **does not reject on a 404 or 500.** It only rejects on a
network failure. An HTTP error status is a successful round trip as far as
`fetch` is concerned, so you have to check `res.ok` yourself. This catches
almost everyone once.

Note also `return await res.json()` rather than `return res.json()`.
Without the `await`, the promise is returned before the `try` block ends,
so a failure inside it escapes your `catch`.

## Sequential vs parallel

This is the most common performance mistake in async code.

```js
// ❌ 3 seconds — each await waits for the previous one
const user = await fetchUser();
const posts = await fetchPosts();
const tags = await fetchTags();

// ✅ 1 second — all three start immediately
const [user, posts, tags] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchTags(),
]);
```

Use sequential `await` only when a later call genuinely needs the earlier
result. If the calls are independent, `Promise.all` is not an
optimization — it's the correct code.

The same trap inside a loop:

```js
// ❌ one at a time
for (const id of ids) {
  results.push(await fetchItem(id));
}

// ✅ all at once
const results = await Promise.all(ids.map(id => fetchItem(id)));
```

⚠️ `array.forEach(async (x) => ...)` does **not** wait. `forEach` ignores
the returned promise, so the loop finishes instantly and the work continues
in the background. Use `for...of` for sequential, or `map` + `Promise.all`
for parallel.

## The four combinators

|                      | Settles when                      | Gives you                           |
| -------------------- | --------------------------------- | ----------------------------------- |
| `Promise.all`        | all fulfil, or **one rejects**    | array of values, or the first error |
| `Promise.allSettled` | all settle, whatever happens      | array of `{status, value/reason}`   |
| `Promise.race`       | the first one settles, either way | that result                         |
| `Promise.any`        | the first one **fulfils**         | that value, or `AggregateError`     |

`Promise.all` fails fast — one rejection discards every other result. When
you want every outcome regardless, reach for `allSettled`.

```js
const results = await Promise.allSettled(urls.map(fetchJson));
const ok = results.filter(r => r.status === 'fulfilled');
```

## Side-by-side

|                        | `.then()` chain                        | `async/await`            |
| ---------------------- | -------------------------------------- | ------------------------ |
| Underlying mechanism   | promises                               | promises                 |
| Error handling         | `.catch()`                             | `try/catch`              |
| Reads like             | a pipeline                             | ordinary sequential code |
| Conditionals and loops | awkward                                | natural                  |
| Best for               | short transformations, fire-and-forget | anything with branching  |

## The rule of thumb

Write `async/await` by default — it reads like normal code and gives you
real `try/catch`. Then check two things before moving on: **is anything
waiting that didn't need to**, and **is there any promise here with nothing
attached to catch a failure?** Both questions target the same failure
mode — a promise nobody is watching, whether that costs time nobody needed
to lose or hides an error nobody will see.

## Version and environment notes

- `Promise.allSettled` is **ES2020**, available from **Node.js 12.9+**.
- `Promise.any` is **ES2021**, available from **Node.js 15+** — the same
  release that made an unhandled rejection terminate the Node process
  instead of just warning.
- `AbortController`, used to cancel the operation behind a promise, is
  broadly supported in current browsers and Node 15+.
- To verify support for a specific method, run `node -v`, or check its
  compatibility table on MDN.

## Check yourself

**1.** What does this log?

```js
Promise.resolve(1)
  .then(val => {
    throw new Error('bad');
  })
  .then(val => console.log('A', val))
  .catch(err => console.log('B', err.message));
```

**2.** `fetchA()` and `fetchB()` each take 1 second and don't depend on
each other. Roughly how long does each version take?

```js
// Version 1
const a = await fetchA();
const b = await fetchB();

// Version 2
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

<details>
<summary>Answers</summary>

**1.** `B bad`. The error thrown in the first `.then()` skips every
`.then()` in between — the second one included — and jumps straight to the
nearest `.catch()`. `console.log("A", val)` never runs.

**2.** Version 1 takes roughly **2 seconds** — `fetchB()` isn't even called
until `fetchA()` finishes. Version 2 takes roughly **1 second** — both
calls start immediately and run at the same time, since neither depends on
the other's result.

</details>

## Sources

- MDN Web Docs — [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- MDN Web Docs — [Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- MDN Web Docs — [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
