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
A **promise** is an object that stands in for a value you don't have yet. You get it immediately, you carry on with other work, and at some point it either delivers a value or reports a failure.

It does not make anything faster, and it does not run code on another thread. It's a receipt.

## The tracking number analogy

You order something online. You don't get the package — you get a **tracking number**.

- The tracking number arrives instantly and is not the package.
- It sits in one of three states: still on the way (**pending**), delivered (**fulfilled**), or failed (**rejected**).
- Once it's settled, it never changes back. A delivered package doesn't become undelivered.
- You can register instructions in advance: *when it arrives, leave it with the neighbour.* That's `.then()`.
```
                    ┌──────────────► fulfilled (value)
                    │                    │
   pending ─────────┤                    ├──► settled: never changes again
                    │                    │
                    └──────────────► rejected (reason)
```

The important consequence: **a promise settles exactly once**, no matter how many places are listening.

## Consuming a promise

Most of the time you're using promises other people created — `fetch`, a database driver, `fs.promises`.

```js
fetch("/api/user")
  .then((res) => res.json())      // runs on success
  .catch((err) => console.error(err))  // runs on any failure above
  .finally(() => setLoading(false));   // runs either way
```

Two things make chaining work:

1. **`.then()` returns a new promise.** That's why you can keep chaining.
2. **What you return inside `.then()` matters.** Return a plain value and the next `.then()` receives it. Return a promise and the chain *waits* for it.

The classic bug is forgetting to return:

```js
fetch("/api/user")
  .then((res) => { res.json(); })   // ❌ returns undefined
  .then((data) => console.log(data)); // logs undefined

fetch("/api/user")
  .then((res) => res.json())        // ✅ returns the promise
  .then((data) => console.log(data));
```

## async/await is the same thing

`async/await` is syntax over promises. Nothing new happens underneath.

```js
async function loadUser() {
  const res = await fetch("/api/user");
  const data = await res.json();
  return data;
}
```

Two rules cover most of it:

- An `async` function **always returns a promise**, even if you return a plain value.
- `await` unwraps a promise: it pauses the function until the promise settles, then gives you the value — or throws if it rejected.

`await` does not block the thread. The function is suspended and the single thread carries on with everything else. Only that one function is paused.

## Error handling

With `await`, a rejected promise becomes a thrown error, so ordinary `try/catch` works:

```js
async function loadUser() {
  try {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to load user", err);
    return null;
  }
}
```

⚠️ `fetch` **does not reject on a 404 or 500.** It only rejects on a network failure. An HTTP error status is a successful round trip as far as `fetch` is concerned, so you have to check `res.ok` yourself. This catches almost everyone once.

Note also `return await res.json()` rather than `return res.json()`. Without the `await`, the promise is returned before the `try` block ends, so a failure inside it escapes your `catch`.

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

Use sequential `await` only when a later call genuinely needs the earlier result. If the calls are independent, `Promise.all` is not an optimization — it's the correct code.

The same trap inside a loop:

```js
// ❌ one at a time
for (const id of ids) {
  results.push(await fetchItem(id));
}

// ✅ all at once
const results = await Promise.all(ids.map((id) => fetchItem(id)));
```

⚠️ `array.forEach(async (x) => ...)` does **not** wait. `forEach` ignores the returned promise, so the loop finishes instantly and the work continues in the background. Use `for...of` for sequential, or `map` + `Promise.all` for parallel.

## The four combinators

| | Settles when | Gives you |
|---|---|---|
| `Promise.all` | all fulfil, or **one rejects** | array of values, or the first error |
| `Promise.allSettled` | all settle, whatever happens | array of `{status, value/reason}` |
| `Promise.race` | the first one settles, either way | that result |
| `Promise.any` | the first one **fulfils** | that value, or `AggregateError` |

`Promise.all` fails fast — one rejection discards every other result. When you want every outcome regardless, reach for `allSettled`.

```js
const results = await Promise.allSettled(urls.map(fetchJson));
const ok = results.filter((r) => r.status === "fulfilled");
```

⚠️ `allSettled` is ES2020 and `any` is ES2021. Both need Node 15+ and modern browsers. Check your build target.

## Side-by-side

| | `.then()` chain | `async/await` |
|---|---|---|
| Underlying mechanism | promises | promises |
| Error handling | `.catch()` | `try/catch` |
| Reads like | a pipeline | ordinary sequential code |
| Conditionals and loops | awkward | natural |
| Best for | short transformations, fire-and-forget | anything with branching |

## The rule of thumb

Write `async/await` by default — it reads like normal code and gives you real `try/catch`. Then check two things before moving on: **is anything waiting that didn't need to**, and **is there any promise here with nothing attached to catch a failure?** Those two questions catch most async bugs before they ship.
