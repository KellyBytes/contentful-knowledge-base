---
contentType: article
title: Effect Cleanup in React
slug: useeffect-cleanup
category: React
tag:
  - rendering
  - async
  - performance
difficulty: Intermediate
summary: >-
  The function an effect returns runs before every re-run and once more on
  unmount. Skipping it is how timers stack up, listeners pile on, and a slow
  response overwrites a newer one.
order: 10
versionScope: >-
  React 18+ — StrictMode double-invokes effects in development from React 18
  onward; the cleanup contract itself is unchanged in React 19
readingTime: 11
prerequisites:
  - closures-explained
related:
  - promises-and-async-await
gotchas:
  - symptom: >-
      My timer speeds up every time the component re-renders, and it never slows
      back down.
    slug: missing-cleanup-stacks-intervals
    cause: >-
      The effect starts a new interval on every run, but nothing stops the old
      one. Each re-run adds another timer alongside the ones already firing, so
      the callback runs more and more often.
    fix: |-
      Return a function that undoes what the effect created:

      - `return () => clearInterval(id)` for `setInterval`
      - `return () => clearTimeout(id)` for `setTimeout`

      React runs it before the next setup, so at most one timer is ever live.
    category: React
    tag:
      - rendering
      - performance
  - symptom: >-
      My effect runs twice on mount in development, so every fetch and every log
      fires two times.
    slug: strictmode-double-invokes-effects
    cause: >-
      In development, StrictMode mounts the component, unmounts it, and mounts
      it again, so the effect runs setup, cleanup, setup. A production build
      runs it once. This is a probe for missing cleanup, not a defect in itself.
    fix: >-
      Write the cleanup so the second setup undoes the first, and the doubled
      run stops being observable. If it still misbehaves after that, the effect
      is not idempotent and that is the real bug. Do not remove StrictMode to
      hide it.
    category: React
    tag:
      - rendering
  - symptom: >-
      I type quickly in a search box and the results that land are for an older
      query, not the one on screen.
    slug: stale-response-overwrites-newer-state
    cause: >-
      Every keystroke starts a request, and responses arrive in whatever order
      the network delivers them. A slow early request can resolve after a fast
      later one and overwrite it, because nothing tells the older effect that it
      is no longer current.
    fix: |-
      Have the cleanup invalidate the request it belongs to:

      - set an `ignore` flag in the cleanup and check it before the setter
      - or call `controller.abort()` and let the fetch reject

      Either way the stale response is discarded instead of applied.
    category: React
    tag:
      - async
      - rendering
  - symptom: >-
      React warns that my effect returned the wrong thing, and my cleanup never
      runs.
    slug: async-effect-returns-promise-not-cleanup
    errorMessage: >-
      useEffect must not return anything besides a function, which is used for
      clean-up.
    cause: >-
      An `async` function always returns a promise, so `useEffect(async () => {})`
      hands React a promise where it expects a cleanup function. React has
      nothing to call before the next run or on unmount.
    fix: |-
      Keep the effect itself synchronous and move the async work inside it:

      - declare an inner `async` function and call it
      - return the real cleanup from the outer effect

      The outer function then returns a function, which is what React asked for.
    category: React
    tag:
      - async
      - error-handling
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
  - question: What does the function returned from an effect do?
    shortAnswer: >-
      It undoes whatever that run of the effect set up. React calls it before
      the effect runs again and once more when the component unmounts, so every
      setup is paired with exactly one cleanup. The point is not "tear down on
      unmount" — it is that an effect which starts something must also be able
      to stop it, because the effect will run again. Emphasize the pairing: if
      you can name what the effect left behind, you can name what the cleanup
      has to remove.
  - question: When exactly does the cleanup run?
    shortAnswer: >-
      Twice as often as people expect. Before every re-run of the effect, and
      once on unmount. It is not a componentWillUnmount hook, and that is the
      usual misreading. React tears down the previous effect before it sets up
      the next one, never after, so the two are never both live. Getting this
      backwards leads to code that assumes cleanup only fires at the end of the
      component's life — which is the assumption that lets timers and listeners
      stack up on every dependency change.
  - question: StrictMode makes my effect run twice in development. Is that a bug?
    shortAnswer: >-
      Not a bug in React — it is a test React is running on your effect. In
      development it mounts, unmounts, and remounts, so you get setup, cleanup,
      setup. If the double run is visible, your cleanup does not fully undo your
      setup, and the same defect would appear in production the first time a
      dependency changed. The fix is to make the effect idempotent, never to
      remove StrictMode. Say that out loud — reaching for a ref to skip the
      second run is the answer interviewers are listening for.
  - question: How do you decide whether an effect needs cleanup?
    shortAnswer: >-
      Ask what the effect left behind that outlives it. If it started a timer,
      added a listener, opened a socket, subscribed to a store, or fired a
      request whose result it will write into state, something is still running
      when the effect ends and it needs cleanup. If it only read a value or
      wrote to a ref, there is nothing to return. Frame it as a symmetry check
      rather than a list to memorize — every API that hands you a handle is
      telling you it expects the handle back.
---

Run this and predict how fast the counter climbs after `speed` has changed three times.

```jsx
function Ticker({ speed }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setInterval(() => setCount(c => c + 1), speed);
  }, [speed]);

  return <p>{count}</p>;
}
```

Four intervals are now running at once, all incrementing the same state. The effect re-ran on each new `speed` and started another timer, but nothing ever stopped the previous ones. The counter is not four times faster because of a bug in the arithmetic — it is four times faster because there are four timers.

The missing piece is the **cleanup function**: the function an effect returns, which React calls to undo what that run of the effect set up. Adding `return () => clearInterval(id)` turns four timers back into one.

That is the whole topic. Cleanup is one idea with two moments where it runs, and one mistake that accounts for almost every symptom.

## The library book analogy

Every effect borrows something that lives outside React — a slot in the browser's timer list, a place in an element's listener array, an open connection. Borrowing is easy, and nothing ever asks for the item back.

Think of each effect run as **checking out a library book**. Setup is the checkout. Cleanup is the return. The library will happily lend you a second copy of the same title while the first one is still at home, which is exactly what happens when an effect re-runs without returning anything.

Two details make the analogy accurate:

- **You return the old copy before you borrow the next one.** React runs the previous effect's cleanup before the next setup, never after, so the two are never both live.
- **The due date is the dependency array.** You do not choose when to return the book; you choose what makes it due.

And one detail where the analogy breaks:

> No one comes to collect, and there is no fine. The copies just quietly accumulate, every one of them still working. That is why this is nearly invisible on a page you reload constantly, and obvious in a tab someone left open all afternoon.

## The simplest possible example

```jsx
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000);
  return () => clearInterval(id); // ✅ the checkout is returned
}, []);
```

The effect captures the handle it created, and the returned function is the only thing that can still reach it. Here is the sequence over a component's life:

```text
  mount        deps change        deps change        unmount
    │               │                  │                │
    ▼               ▼                  ▼                ▼
  setup ──►  cleanup ─► setup ──► cleanup ─► setup ──► cleanup
   (1)         (1)       (2)        (2)       (3)        (3)
```

Every setup is paired with exactly one cleanup, and the numbers never cross. That pairing is the entire contract.

## Cleanup runs more often than you think

The most common misreading is that the returned function is a "component will unmount" hook. It is not. It runs:

- **before every re-run of the effect**, and
- **once when the component unmounts.**

Nowhere else. An effect with `[query]` in its dependency array, and a user who types ten characters, runs its cleanup ten times before the component ever goes away.

This is also why an empty dependency array does not excuse you. `[]` changes how often the effect re-runs; it does nothing about unmount, which still happens.

## What actually needs returning

If the effect handed you a handle, the API is telling you it expects the handle back.

| The effect did this                       | The cleanup returns this                       |
| ----------------------------------------- | ---------------------------------------------- |
| `setInterval` / `setTimeout`              | `clearInterval` / `clearTimeout`               |
| `addEventListener`                        | `removeEventListener`, same function reference |
| `new WebSocket(url)`                      | `socket.close()`                               |
| subscribed to a store or an observable    | the unsubscribe function it gave you           |
| `IntersectionObserver` / `ResizeObserver` | `observer.disconnect()`                        |
| `fetch` whose result goes into state      | `controller.abort()`, or an `ignore` flag      |

`removeEventListener` is the one that fails silently. It matches on the function reference, so an inline arrow function passed to both calls creates two different functions and removes nothing. Name the handler inside the effect and pass that same name twice.

If an effect only reads a value or writes to a ref, it left nothing behind and returns nothing. Not every effect needs cleanup — only the ones that started something.

## The trap: StrictMode double-runs your effect

In development, StrictMode mounts a component, immediately unmounts it, and mounts it again. Your effect runs setup, cleanup, setup. Every log appears twice, and every request fires twice.

```jsx
// ❌ nothing is undone, so the dev double-mount fires two requests
useEffect(() => {
  fetch(`/api/user/${id}`)
    .then(r => r.json())
    .then(setUser);
}, [id]);
```

```jsx
// ✅ the second run invalidates the first
useEffect(() => {
  let ignore = false;

  fetch(`/api/user/${id}`)
    .then(r => r.json())
    .then(data => {
      if (!ignore) setUser(data);
    });

  return () => {
    ignore = true;
  };
}, [id]);
```

The instinct is to silence the double run with a ref. Resist it. StrictMode is not creating the problem — it is running the same test React will run on you in production the first time `id` changes. An effect whose second run is observable is an effect that breaks on any dependency change.

`ignore` works because each effect run closes over its own variable, so a cleanup can only ever invalidate its own request. See [Closures Explained](/kb/javascript/closures-explained) for why each run gets a separate one.

## Where it shows up: the race you cannot reproduce locally

The double-mount is the visible version of a much quieter bug. Type `re`, `rea`, `reac`, `react` into a search box and you have started four requests. They come back in whatever order the network decides, and on a fast local connection that order is almost always the order you sent them. On a real connection it is not.

Without cleanup, the response for `re` can land after the response for `react` and overwrite it. The screen shows results for a query the user finished typing half a second ago, and nothing anywhere reports an error.

The `ignore` flag above already fixes this — the cleanup fires on every keystroke, so only the last request is still allowed to write. `AbortController` goes one step further and stops the request itself:

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(err => {
      if (err.name !== 'AbortError') throw err; // a canceled fetch is not a failure
    });

  return () => controller.abort();
}, [query]);
```

Note the `catch`. Aborting rejects the promise with a `DOMException` named `AbortError`, so a bare `.catch(setError)` would render "the operation was aborted" as a real error on every keystroke. See [Promises and async/await](/kb/javascript/promises-and-async-await) for why that rejection has to be handled rather than ignored.

## Side-by-side

|                             | `ignore` flag  | `AbortController`               |
| --------------------------- | -------------- | ------------------------------- |
| Discards the stale result   | yes            | yes                             |
| Stops the request in flight | no             | yes                             |
| Works with any async API    | yes            | only if it accepts a `signal`   |
| Error handling              | nothing extra  | must filter `AbortError`        |
| Cost                        | two lines      | three lines and a `catch`       |

Reach for `ignore` by default — it is shorter, and it cannot mislead you with an error that is not one. Reach for `AbortController` when the request is expensive enough that not sending it matters, or when you fire them fast enough to saturate the browser's connection limit.

## The rule of thumb

For every effect you write, ask one question: **what is still running when this function returns?**

If the answer is "nothing", return nothing. If you can name it — a timer, a listener, a socket, a request whose result you plan to use — then you have borrowed something, and the effect is not finished until you have written down how to give it back.

Then check the second question, which catches the rest: **would running this effect twice in a row be visible?** If yes, the cleanup is incomplete, and StrictMode is about to tell you so.

## Version and environment notes

- **StrictMode's double-invocation of effects is React 18+ and development only.** It was not the behavior in React 17. Production builds run each effect once per mount, in every version.
- The cleanup contract is unchanged in **React 19**. Nothing here depends on the version beyond the StrictMode note.
- `AbortController` and the `signal` option on `fetch` are available in all current browsers and in **Node.js 18+**. The rejection is a `DOMException` whose `name` is `AbortError`, not a `TypeError`.
- React's own documentation uses the `ignore` flag as the default pattern for fetching in an effect, and suggests moving data fetching to a framework or a caching library once an app has more than a few of them.

## Check yourself

**1.** How many times does `cleanup` log, and with which color?

```jsx
function Box({ color }) {
  useEffect(() => {
    console.log('setup', color);
    return () => console.log('cleanup', color);
  }, [color]);
}
```

The component mounts with `color="red"`, re-renders with `"blue"`, re-renders with `"blue"` again, then unmounts.

**2.** What is wrong with this, and what does it do at runtime?

```jsx
useEffect(() => {
  window.addEventListener('resize', () => setWidth(window.innerWidth));
  return () =>
    window.removeEventListener('resize', () => setWidth(window.innerWidth));
}, []);
```

<details>
<summary>Answers</summary>

**1.** Twice. `setup red` on mount, then on the change to `"blue"` you get `cleanup red` followed by `setup blue`. The second `"blue"` render does not re-run the effect at all, because the dependency did not change. On unmount you get `cleanup blue`. Each cleanup logs the color from its own run, not the current one — the cleanup closes over the render that created it.

**2.** The listener is never removed. `removeEventListener` matches on the function reference, and these are two separately created arrow functions that merely happen to share a body. Every mount adds a listener that stays for the life of the page, and each one holds a closure over that mount's `setWidth`. Assign the handler to a `const` inside the effect and pass that same name to both calls.

</details>

## Sources

- React — [`useEffect`](https://react.dev/reference/react/useEffect)
- React — [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- React — [`StrictMode`](https://react.dev/reference/react/StrictMode)
- MDN Web Docs — [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
