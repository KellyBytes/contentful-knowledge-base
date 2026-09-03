---
contentType: article
title: State as a Snapshot in React
slug: state-as-a-snapshot
category: React
tag:
  - rendering
  - state-management
  - interview-frequent
difficulty: Beginner
summary: >-
  Every render gets its own fixed copy of state. The setter schedules the next
  render rather than changing the value your handler is already holding, which
  is why three increments in one click add up to one.
order: 100
versionScope: >-
  React 18+ — automatic batching covers promises, timeouts and native handlers
  from React 18 onward; before that, only React event handlers batched. Snapshot
  semantics are unchanged in React 19.
readingTime: 8
prerequisites: []
related:
  - closures-explained
  - useeffect-cleanup
gotchas:
  - symptom: >-
      I called the setter three times in one handler and the value only went up
      by one.
    slug: repeated-setter-calls-collapse-to-one
    cause: >-
      All three calls read the same `count` from the render they belong to, so
      all three compute the same number and schedule the same value. The last
      one wins, and it is identical to the first.
    fix: |-
      Use the updater form so each update receives the result of the one before
      it:

      - `setCount(c => c + 1)` instead of `setCount(count + 1)`
      - the argument is the pending value, not the render's value

      React applies the queued functions in order, so three calls produce three
      increments.
    category: React
    tag:
      - rendering
      - state-management
    id: 5OkHVv4pIAiuxxI1ynj4C5
  - symptom: >-
      I logged my state on the line right after calling the setter and it
      printed the old value.
    slug: state-read-after-setter-is-stale
    cause: >-
      The state variable is a `const` belonging to the render that is currently
      running. The setter asks React to render again with a new value; it does
      not reassign the variable you are holding.
    fix: |-
      Use the value you just computed rather than re-reading state:

      - keep it in a local variable and use that for the rest of the handler
      - or read the new value on the next render, in the body or in an effect

      There is no synchronous way to observe the update from inside the handler
      that caused it.
    category: React
    tag:
      - rendering
      - state-management
    id: 7iv7vwyN1zp6pAS8cYu9Cg
  - symptom: >-
      After an await in my click handler, the state I read is the value from
      before the click.
    slug: state-after-await-is-from-the-old-render
    cause: >-
      The handler is a closure over the render it was created in. Awaiting
      suspends it and resumes it later, but it resumes inside that same render,
      so every variable it reads is still that render's copy.
    fix: |-
      Do not read state after the await. Instead:

      - capture what you need into a local variable before the await
      - use the updater form when the new value depends on the previous one
      - keep it in a ref when a callback genuinely needs the live value

      Adding the await did not move the handler to a newer render.
    category: React
    tag:
      - rendering
      - async
    id: 6jE75cReyq5FCrqNtBRR97
interviewQuestions:
  - question: >-
      Why does the state variable still hold the old value right after you call
      the setter?
    shortAnswer: >-
      Because it is a `const` that belongs to the render currently running.
      Calling the setter does not assign to it — it asks React to render the
      component again, and the new value only exists in that next render. The
      phrase worth saying out loud is that state is a snapshot: a render sees
      one fixed value from its first line to its last. Frame it as "the variable
      cannot change" rather than "the update is slow", because the usual
      follow-up is whether awaiting or a timeout would help, and neither does.
    id: 1oEQIsNEJQISbklH5ELCK6
  - question: When do you need the updater form?
    shortAnswer: >-
      Whenever the new value depends on the previous one and you might be
      queuing more than one update, or when the code runs later than the render
      it was written in — a timer, a subscription, an effect with an empty
      dependency array. `setCount(c => c + 1)` receives the pending value rather
      than the render's value, so consecutive calls stack instead of colliding.
      If the new value is independent of the old one, such as setting a field
      from an input event, the plain form is fine and clearer.
    id: g0Ao0ya3h5W2POAKfIei6
  - question: Does React batch every state update?
    shortAnswer: >-
      Since React 18, yes — updates are batched wherever they happen, including
      inside promises, timeouts, and native event listeners. Before 18 only
      React event handlers batched, so a pair of updates inside a `fetch` then
      would render twice. This is the detail most likely to date someone's
      answer, so name the version. Batching is also why several setter calls in
      one handler produce one render, not one render each.
    id: 5vr7WzJh6WrBPd8viMvwqE
  - question: >-
      If state is a snapshot, how do you read the latest value when you
      genuinely need it?
    shortAnswer: >-
      Pick by what you need it for. If you are computing the next state, the
      updater form hands you the pending value with no extra machinery. If some
      long-lived callback needs the live value to read rather than to set, a ref
      holds a mutable box that is not tied to a render. If you want to react to
      the new value, do it in an effect keyed on that state, which runs after
      the render that has it. Reaching for a ref first is the common mistake —
      it opts out of rendering entirely.
    id: 330pILwjbSJlq5A780icoP
contentfulEntryId: 5u0PdTSO12pRAiLCKH2GJW
---

Run this and predict what the counter shows after one click.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

It shows `1`, not `3`. The three lines are not redundant and they are not being collapsed by an optimization. Each one reads `count`, finds `0`, and asks React to render again with `1`. Three identical requests, one result.

The reason is that **state is a snapshot**: for the whole life of one render, the state variable holds a single fixed value, and nothing that happens during that render can change it. The setter does not assign to the variable — it schedules the next render, and the new value only exists there.

That single idea explains three things that otherwise look unrelated: why repeated updates collapse, why logging state right after setting it shows the old value, and why awaiting inside a handler does not help.

## The order ticket analogy

Picture a kitchen. A customer orders, and a **ticket** is printed and handed to the cook. The cook works from the ticket in their hand — not from the customer, who is out of sight in the dining room.

A render is one printed ticket. Everything that runs during that render — the component body, the event handlers it creates — reads the ticket, never the kitchen's current situation.

Two details make the analogy accurate:

- **The ticket cannot be edited.** Calling the setter is telling the front of house to print a new one, and the cook keeps holding the old one until it arrives.
- **Three notes saying "add one to the number on this ticket" all produce the same number**, because they all read the same printed value.

And one detail where it breaks:

> A cook can walk out and look at the dining room. A handler cannot. There is no call that returns the current state from inside the render that is holding an older copy — the only way to see the new value is to be running in the render that has it.

## What actually happens

```text
   render #1                          render #2
  ┌────────────────────────┐         ┌────────────────────────┐
  │ count = 0              │         │ count = 1              │
  │                        │         │                        │
  │ handleClick reads  ────┼──► 0    │ handleClick reads  ────┼──► 1
  └────────────────────────┘         └────────────────────────┘
             │                                  ▲
             │  setCount(0 + 1) three times     │
             └───── all three schedule 1 ───────┘
```

`count` is declared with `const`. That is not a stylistic choice — it is the literal truth about the value. Each render is a fresh call to the component function, producing a fresh `const` that never changes while that call is on the stack.

So the handler is not reading a stale copy of a variable that has since moved on. It is reading the only value that variable ever had.

## The updater form

To escape the snapshot, stop naming the value and describe the change instead.

```jsx
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);
// 3
```

React queues the three functions and applies them in order. The first receives `0` and returns `1`; the second receives that `1` and returns `2`; the third returns `3`. None of them ever looks at `count`.

The two forms answer different questions:

```jsx
setCount(count + 1); // ❌ "make it one more than the render's value"
setCount(c => c + 1); // ✅ "make it one more than whatever is pending"
```

Use the updater form whenever the new value depends on the old one. When it does not — setting a field from an input event, resetting to zero — the plain form says what it means and is easier to read.

## Several updates, one render

The other half of the surprise is that React does not re-render between the calls.

```jsx
function handleClick() {
  setCount(c => c + 1);
  setName('Ada');
  setOpen(true);
  // one render, not three
}
```

React collects the updates queued during an event and processes them together. This is **batching**, and it is why the handler runs to completion before anything re-renders — which in turn is why the snapshot stays fixed for the whole handler.

Batching is a feature, not a limitation. Without it, the component would render in intermediate states where `count` had changed but `name` had not.

## The trap: reading state after an await

This is where the snapshot catches people who have already understood the rest.

```jsx
async function handleSave() {
  setSaving(true);
  await api.save(draft);
  console.log(saving); // ❌ still false
}
```

Awaiting suspends the function and resumes it later — but it resumes inside the same render, holding the same ticket. `saving` was `false` when this handler was created and it is `false` on every line of it, forever.

The fix is not to await differently. It is to stop asking:

```jsx
async function handleSave() {
  setSaving(true);
  await api.save(draft);
  setSaving(false); // ✅ tell React what to do, do not read back
}
```

The same mechanism makes a callback in `setInterval` see one frozen value — the effect that created it belongs to one render. See [Closures Explained](/kb/javascript/closures-explained) for why the captured variable behaves that way, and [Effect Cleanup in React](/kb/react/useeffect-cleanup) for what to do about the interval itself.

## Where it shows up: the value you send to the server

The bug that costs real time is not a counter. It is sending the wrong data.

```jsx
function handleSubmit() {
  setQuantity(quantity + 1);
  api.createOrder({ quantity }); // ❌ sends the old quantity
}
```

The order goes out with the value from before the click, while the screen updates to the new one a moment later. Nothing throws, the UI looks right, and the mismatch only surfaces in the database.

```jsx
function handleSubmit() {
  const next = quantity + 1; // ✅ compute once
  setQuantity(next);
  api.createOrder({ quantity: next });
}
```

Compute the value once, into a local variable, then use that local for both the update and everything else in the handler.

## Side-by-side

| You want                            | Reach for                        |
| ----------------------------------- | -------------------------------- |
| A value that depends on the old one | the updater form, `setX(x => …)` |
| The new value later in this handler | a local variable you computed    |
| To act once the new value is on screen | an effect keyed on that state  |
| A live value a timer can read       | a ref, not state                 |
| To read state right after setting it | nothing — it cannot be done      |

## The rule of thumb

Whenever you are about to read a state variable, ask which render you are standing in. If the answer is "the one before the update I just queued", you are reading a snapshot and it will not have changed.

Two moves cover almost every case:

1. **Computing the next value?** Use the updater form.
2. **Need the value again in this handler?** Put it in a local variable first, and never re-read the state.

## Version and environment notes

- **Automatic batching is React 18.** From 18 onward, updates batch wherever they happen — promises, `setTimeout`, native event listeners. Before that, only React event handlers batched, so two updates inside a `fetch` callback rendered twice.
- Snapshot semantics themselves have not changed. They are the same in React 19, and were the same in class components, where `this.setState` took an updater function for exactly this reason.
- In development, StrictMode renders each component twice. A `console.log` in the body appearing twice is StrictMode, not a double update — check a production build before chasing it.
- `flushSync` from `react-dom` forces a synchronous re-render and is the documented escape hatch. It is rarely the right answer; reach for it only when you must read the DOM between two updates.

## Check yourself

**1.** What does this print, and what does the button show?

```jsx
function App() {
  const [n, setN] = useState(0);

  function onClick() {
    setN(n + 1);
    setN(n + 2);
    console.log(n);
  }

  return <button onClick={onClick}>{n}</button>;
}
```

**2.** What is on screen after one click?

```jsx
function App() {
  const [n, setN] = useState(0);

  function onClick() {
    setN(c => c + 1);
    setN(n + 10);
    setN(c => c + 1);
  }

  return <button onClick={onClick}>{n}</button>;
}
```

<details>
<summary>Answers</summary>

**1.** It logs `0` and the button shows `2`. Both setters read the render's `n`, which is `0`, so they schedule `1` and then `2` — the last one wins. The log runs during the same render, so it also sees `0`.

**2.** `11`. The queue is applied in order: the updater takes `0` to `1`; the plain call ignores the pending value and replaces it with the render's `n` plus ten, which is `10`; the second updater takes that to `11`. Mixing the two forms is how a queue quietly discards work.

</details>

## Sources

- React — [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- React — [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- React — [`useState`](https://react.dev/reference/react/useState)
- React — [React 18: Automatic batching](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
