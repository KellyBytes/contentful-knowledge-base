# Kelly's Notes — Article authoring

Markdown files under `content/knowledge-base/` are the source of truth for the
`article` content type. Contentful is a delivery target. Nothing here applies to
`post` (the blog) — those are Rich Text and authored in the Contentful web app.

Field definitions: `_reference/content-model.json` Valid category and tag names:
`_reference/categories.json`, `_reference/tags.json`

---

## Layout

```
content/
  knowledge-base/<category-slug>/<article-slug>.md
  _reference/
    content-model.json, categories.json, tags.json, space-meta.json   generated — never hand-edit
    article-template.md                              the authoritative front matter shape
    topic-ownership.md                               hand-maintained
  _ideas/<date>_<category>.md                        /article-ideas proposal runs; /new-article follows them
  _archives/<article-slug>_v1.md                     gitignored personal reference — not part of the repo
```

`_archives/` holds superseded drafts. It is **gitignored personal reference
material, not part of the repository** — nothing in the pipeline reads it, and it
is never a source. Never quote a heading, an analogy, or a claim out of an archived
draft into a live file.

The directory name is Contentful's category slug, not the display name:

| Category         | Directory           |
| ---------------- | ------------------- |
| JavaScript       | `javascript/`       |
| TypeScript       | `typescript/`       |
| React            | `react/`            |
| Next.js          | `next-js/`          |
| CSS & Styling    | `css-and-styling/`  |
| Node.js & APIs   | `node-js-and-apis/` |
| Databases        | `databases/`        |
| Web Fundamentals | `web-fundamentals/` |

Do not derive these from the display name — `Next.js` becomes `next-js`, not
`nextjs`, and `&` becomes `and`. Take them from `_reference/categories.json` or
from the existing directories.

---

## Frontmatter

> The authoritative shape of the front matter is
> `_reference/article-template.md`. What follows is background — the reasoning
> behind the fields and how to choose their values. When drafting, copy the
> template; read this for the why.

```yaml
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
  created in, even after that scope has finished running.
# contentfulEntryId: written back by the push script. Never write it by hand.
order: 400
interviewQuestions:
  - question: What is a closure?
    shortAnswer: >-
      ...
---
```

**Never copy an id out of this sample or out of another article.**
`contentfulEntryId`, `interviewQuestions[].id`, and `gotchas[].id` are all written
back by the push script. A new article and a new child entry carry no id key at
all — a copied id makes the push overwrite whatever entry it belongs to.

| Key                       | Rule                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `contentType`             | Always `article`                                                                             |
| `title`                   | ≤256 chars. Noun phrase, not a question. Not the same wording as the slug                    |
| `slug`                    | lowercase kebab-case only — Contentful rejects anything else                                 |
| `category`                | Exactly one of the eight names below. Never invent one                                       |
| `tag`                     | 1–4 names from the thirteen below. Never invent one                                          |
| `difficulty`              | `Beginner` / `Intermediate` / `Advanced`                                                     |
| `summary`                 | **≤256 chars — this is a Symbol, not a Text field.** 1–2 sentences, plain prose, no markdown |
| `order`                   | Integer. Position within the category                                                        |
| `versionScope`            | ≤256 chars, one line. Which language / runtime versions the article assumes                  |
| `readingTime`             | Integer, minutes                                                                             |
| `prerequisites`           | **Max 3.** Article slugs, not ids. Each must already have a `contentfulEntryId`              |
| `related`                 | **Max 4.** Article slugs, not ids                                                            |
| `gotchas`                 | **Max 6.** A new gotcha has **no `id` key at all** — omit the line                           |
| `contentfulEntryId`       | Written by the push script. **Never write or edit this by hand**                             |
| `interviewQuestions[].id` | Same. A new question has **no `id` key at all** — omit the line                              |

`lastReviewed` is derived by the push script and must not appear in frontmatter.

**`order` uses increments of 100**, so an article can be inserted between two
existing ones without renumbering. Sequence is pedagogical — the order someone
should read them — not alphabetical. Read the sibling files in the category and
pick a value that puts the new article where it belongs.

### Categories (fixed — eight, never add)

`JavaScript` · `TypeScript` · `React` · `Next.js` · `CSS & Styling` ·
`Node.js & APIs` · `Databases` · `Web Fundamentals`

### Tags (fixed — thirteen, never add)

`scope-and-closures` · `async` · `equality` · `immutability` · `type-system` ·
`state-management` · `rendering` · `performance` · `caching` · `security` ·
`error-handling` · `data-modeling` · `interview-frequent`

`_reference/tags.json` is the authoritative list — it is generated from
Contentful. The names above are repeated here for reading, not as a second
source of truth.

Tags are concept axes and are deliberately orthogonal to category — the same tag
appears across several categories. Pick the ones a reader would actually browse
by, not every one that technically applies. Most articles carry two or three;
four is the ceiling, not a target.

A gotcha carries at most **three** tags, and they describe that gotcha's own
problem rather than being inherited from the article. `interview-frequent` does
not belong on a gotcha — the claim is about a topic, not about a symptom.

### The `interview-frequent` tag

This one costs a slot, so it needs a firmer test than the others. The test is
not "does this come up in interviews" — almost everything does. It is:

> **If a reader skipped this article, would a question they cannot answer be
> likely to come up?**

Not whether the topic is interesting, and not whether it matters day to day. A
topic can be worth writing and still not earn the tag. Floating-point precision
is worth an article; a candidate who has not read it is unlikely to lose an
interview over it.

The judgment is scoped to the kind of role that would touch this topic — a
CSS question does not come up in a back-end screen, and an index-design
question does not come up in a front-end one. Ask whether a candidate for the
roles this article serves would be likely to face it, not whether every
interview everywhere asks it.

It is about those interviews in general, never about one interview someone
happened to sit. A question asked once is not evidence of frequency.

Every article in the knowledge base currently carries this tag. That is expected
while the categories only hold their foundational topics — the tag starts
distinguishing anything once articles exist that do not earn it.

If a topic genuinely has no fitting category or tag, stop and say so. Do not
approximate, and do not add an entry to the reference JSON files — those are
generated from Contentful.

---

## YAML scalar style

- Use `|-` (literal) for any `cause` or `fix` that contains a list or a
  deliberate line break. `>-` (folded) collapses single newlines into spaces,
  which turns a bullet list into one run-on line.
- Use `>-` only for prose with no internal structure.
- `symptom` is a single line with no breaks, so `>-` is always fine there.

---

## Article shape

`_reference/article-template.md` specifies the front matter and the child
entries; the body is specified here. Before drafting, read
`knowledge-base/javascript/closures-explained.md` in full — it is the reference
implementation of everything below. Match its shape and its voice, not its
headings: section titles are specific to each article
(`## The backpack analogy`, `## The tracking number analogy`), never generic.

Every article moves through the same shape. Section names vary and some steps do
not apply to every topic, but the order of the ones that do is stable — the puzzle
opens, with no heading; the analogy follows it when there is one; and steps 9–11
always close, in that order.

1. **Opening — no heading. Start with a puzzle, not a definition.** One line
   inviting a prediction ("Run this and predict what it logs before reading
   on."), then a fenced `js` block short enough to hold in your head. Follow it
   with one paragraph on what actually happens and why it surprises, and only
   then one paragraph that names and defines the thing — the reader has to see
   the behavior before a definition means anything. Close by declaring the
   shape of what follows when there is one ("those are the only three
   differences"). `knowledge-base/javascript/closures-explained.md` is the
   reference implementation.

   When the topic is routinely confused with a neighbor, that separation is
   its own section straight after the opening, not part of it
   (`## Scope and closure are not the same thing`).

2. **`## The <object> analogy` — when one genuinely helps.** One concrete,
   physical, non-technical metaphor, followed by one or two refinements that keep
   it honest ("the backpack holds the actual variables, not photocopies"). **This
   step is optional.** Some topics resist a physical metaphor, and a strained one
   costs more than it gives — the two-caveat rule below is the same judgment made
   earlier. `var-let-const` has no analogy and is right not to.
3. **The diagram** — an ASCII diagram in a `text` block showing what the opening
   snippet just did. Sometimes its own section (`## What actually happens` in
   `closures-explained`, `## The simplest possible example` in
   `useeffect-cleanup`), sometimes folded into the analogy or the first body
   section. Where it sits varies; that the reader gets a picture before the body
   starts does not.
4. **Two to four body sections** — progressive, each building on the last.
   Numbered when parallel (`## Difference 1: scope`, `## Use case 2: ...`). They
   are not confined to one block: an article can return to a body section after
   the trap or after where-it-shows-up when the material calls for it
   (`## Closures vs classes` sits between steps 6 and 7 in `closures-explained`).
5. **The trap** — the mistake that actually bites people, with the wrong and
   right code side by side.
6. **Where it shows up** — the same idea in React, Node, or the build, so the
   reader sees it in code they'll write.
7. **`## The cost`** or **`## Side-by-side`** — trade-offs in prose, or a
   comparison table when there are three or more things to distinguish.
8. **`## The rule of thumb`** — the closing decision heuristic. Not a summary.
   Give the reader something to _do_ when they next hit this.
9. **`## Version and environment notes`** — which language, runtime, or library
   versions the article assumes, and what changes outside them. Mirrors the
   `versionScope` field.
10. **`## Check yourself`** — two code-prediction exercises ("What does this
    print?", each followed by a snippet), with the answers inside a `<details>` /
    `<summary>Answers</summary>` block. Not the same thing as
    `interviewQuestions`, which are spoken answers and live in frontmatter.
11. **`## Sources`** — MDN or specification links for the claims made.

### Length

There is no target. Existing articles run roughly 1,300–1,900 words including
code, and the length follows from how wide the topic is — it is not a number to
write towards. A word count stated as a goal only ever produces padding.

Two boundaries are worth checking, because each usually means the **scope** is
wrong rather than the prose:

- **Under ~1,000 words** the topic is probably too thin to stand alone. Check
  `_reference/topic-ownership.md` and consider making it a section of an
  existing article instead.
- **Over ~2,200 words** it probably wants to be two articles. Look for the
  natural split rather than cutting sentences.

### Difficulty

`difficulty` is decided by **how much the reader has to know already**, never by
length. A long Beginner article and a short Intermediate one are both normal —
`primitive-vs-reference-types` (Beginner, 1,593 words) is longer than four of the
five Intermediate articles in the JavaScript category.

- **Beginner** — needs nothing beyond basic JavaScript syntax.
- **Intermediate** — assumes the reader has understood the Beginner articles in
  the same category.
- **Advanced** — for a reader who already knows the topic's fundamentals; goes
  into edge cases, performance, or specification detail.

**`Advanced` is provisional** — no article has used it yet. Revisit the
definition when one does.

### Overlapping topics

Articles are read one at a time, not in sequence, so each must stand on its own.
Some overlap is therefore correct — the `var` loop trap belongs in both
`var-let-const` and `closures-explained`, because a reader arriving at either
one needs it.

What is not correct is two articles treating the same thing at the same depth.
One article owns each concept; the others give the short version and link to it.

- **The owner** is the article where the concept is the subject, not a symptom.
  The loop trap is owned by `closures-explained`: `var` is how it happens, but
  the captured binding is what it _is_.
- **The others** cover it in a few sentences and a minimal snippet — enough that
  the reader is not blocked — then link out:
  `See [Closures Explained](/kb/javascript/closures-explained) for why the binding is shared.`
- Never restate the owner's analogy or reuse its diagram. Different framing,
  same fact, so a reader who reads both is not reading the same paragraphs
  twice.

Links are root-relative: `/kb/<category-slug>/<article-slug>`.

### Analogy rules

- At most one analogy per article — none is fine. Never stack a second for the
  same concept.
- It must be a physical thing the reader can picture: a room, a backpack, a name
  tag.
- If it needs more than two caveats to stay accurate, it is the wrong analogy.
  Find a better one, or go without, rather than patching it.
- Reuse the analogy's vocabulary later in the article ("reaches into the
  backpack") so it does the work of a shared mental model instead of sitting as
  decoration.

---

## Voice

- Second person. `you`, never `we`.
- Short paragraphs — one to three sentences. No walls of prose.
- Direct, unhedged. "This trips up almost everyone once." Not "this may
  sometimes be confusing to some developers."
- **Bold** a term on first substantive use, once. Not for emphasis generally.
- No "In this article we'll look at…", no "Conclusion" heading, no section that
  opens by restating its own heading.
- Explain _why_, not just _what_. Every rule stated should be followed by the
  mechanism that makes it true.
- **US spelling.** `behavior`, `color`, `initialize`, `memoized`, `canceled`.
  Not `behaviour`, `colour`, `initialise`. Articles written before this rule may
  still use British forms — leave them alone unless you are already editing that
  file for another reason.

---

## Markdown

Rendered by `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-highlight`
(`components/Markdown.jsx`), styled with `@tailwindcss/typography`. No custom
component overrides — what the plugins support is what you get.

- Allowed: `h2`–`h4`, lists, tables, fenced code, inline code, links,
  blockquotes
- **Raw HTML is enabled, but only `<details>` and `<summary>` are sanctioned** —
  the "Answers" block in every article's `## Check yourself` section. Reaching for
  any other tag needs a reason; if Markdown can express it, write Markdown
- **Leave a blank line after `<summary>` and before `</details>`.** Without them
  the inner Markdown is swallowed — the answers render as nothing, with no error
  anywhere
- Also renders but unused: GFM footnotes, task lists, images. Introducing one is
  a decision, not a default
- Not available: math — `remark-math` is not installed, so `$x$` renders as
  literal text
- Images render as a bare `<img>` with no optimization and no Contentful asset
  behind them. KB bodies do not use images — the diagrams are `text` blocks
- **Never use `h1`.** The `title` field renders as the page's `h1`
- Tables: GFM pipe syntax only

### Code blocks

**Real code must declare a language** — ` ```js `, ` ```jsx `, ` ```bash `.
`rehype-highlight` leaves untagged blocks unhighlighted.

**Every fenced block declares a language. There is no exception.** Anything that
is not code — an ASCII diagram, a decision list, a terminal transcript — uses
`text`. There is nothing to weigh up: `text` maps to highlight.js `plaintext`,
which emits no highlighting markup at all, so a diagram's characters are
untouched. What it does add is the padding and horizontal scrolling every code
block already has, which is why a wide diagram scrolls instead of overflowing.

```text
        scope starts            declaration line          scope ends
             │                        │                        │
var  y:      │◄──── undefined ───────►│◄──────── 5 ───────────►│
let  x:      │◄──── TDZ ✗ ───────────►│◄──────── 5 ───────────►│
```

Code comments carry the result, on the same line as the expression:

```js
console.log(y); // undefined  ← looks like it "works"
console.log(x); // ReferenceError: Cannot access 'x' before initialization
```

Use `// ❌` and `// ✅` when showing a wrong/right pair. Keep snippets under
about 25 lines — trim to what the point needs.

---

## Common questions

`interviewQuestions` renders as the "Common questions" section
(`components/kb/ArticleFaq.jsx`). Three to five per article; four is the norm.

**`shortAnswer` is capped at 600 characters by Contentful validation.**

Write them as _spoken_ answers, not prose. The reader is rehearsing what to say
out loud in an interview.

Structure of one answer:

1. The direct answer, first sentence, no wind-up
2. The mechanism, or the distinction that matters
3. A closing line on **how to deliver it** — what to emphasize, or what getting
   it backwards causes

Four questions, four different jobs:

|     | Job                            | Example                                                   |
| --- | ------------------------------ | --------------------------------------------------------- |
| 1   | Define it                      | "What is a closure?"                                      |
| 2   | A distinction people get wrong | "Do two closures from the same function share variables?" |
| 3   | Puncture a false shortcut      | "Does `let` solve every closure problem?"                 |
| 4   | A judgment call                | "When would you choose a closure over a class?"           |

Never reference the article itself ("as explained above") — these are read on
their own. Never repeat a body section verbatim.

---

## Gotcha blocks

- `cause` and `fix` are rendered through `components/Markdown.jsx`, so the same
  rules apply: fenced code blocks must declare a language, and `#` headings are
  never used. Keep them to prose, lists, and inline code.
- A new gotcha has **no `id` key at all** — omit the line. The push script
  creates the entry and writes the id back into the file.
- A reused gotcha carries the existing id and a copy of the block that is
  **identical** to the article it came from. Copy it verbatim; the push aborts
  if any two copies disagree.
- `category` is required on every gotcha, and it is the gotcha's own category —
  not necessarily the article's.
- A gotcha allows **three** tags. An article allows four. Different limits.
- Gotcha slugs are unique across the whole space. Grep `content/knowledge-base/`
  before inventing one.

---

## Cross-references

- `prerequisites` (max 3) and `related` (max 4) hold article **slugs**, not ids.
- A referenced article must already have a `contentfulEntryId`. Referencing an
  article that has never been pushed aborts the push.
- An article cannot reference itself.
- An empty list is sent as an empty list. Removing a slug removes the link.

---

## Workflow

```bash
npm run article:push -- content/knowledge-base/javascript/<slug>.md --dry-run
npm run article:push -- content/knowledge-base/javascript/<slug>.md
```

Push creates or updates a **draft**. Publishing is manual, in the Contentful web
app, after review.

**Child entries are the exception — both `interviewQuestion` and `gotcha` entries
are published automatically by the push script.** That is necessary rather than a
shortcut: the Delivery API omits `fields` for an unpublished reference, so a child
left as a draft makes the parent article render an empty section with no error
anywhere.

---

## Rules

- Read `_reference/categories.json` and `_reference/tags.json` before writing
  frontmatter. Do not work from memory — they are generated from Contentful.
- Never modify an existing article's body unless explicitly asked.
- Never invent a `contentfulEntryId`, an `interviewQuestions[].id`, or a
  `gotchas[].id`. A gotcha entry is shared by several articles, so a wrong id
  there changes every article that links it.
- Verify technical claims against MDN or the relevant spec before asserting
  them. If you cannot source a claim, say so rather than writing it confidently.
- Before drafting, glob `knowledge-base/**/*.md` and read the **frontmatter
  only** of the existing articles — title, slug, category, tag, summary, order,
  difficulty, and gotchas. The first five are for overlap; `order` and
  `difficulty` place the new article against its siblings; `gotchas` is how you
  find out whether a pitfall already has an entry to reuse rather than a
  duplicate to create. Do not read article bodies; they will flood the context
  and you do not need them to check for overlap.
- Check the sibling articles in the category before drafting, so the analogy,
  the examples, and the `order` value do not collide with an existing one.
- When a topic overlaps an existing article, decide which one owns it. Check
  `_reference/topic-ownership.md` first, and add a row when you create a new
  overlap. Give the short version and link to the owner rather than covering it
  twice at depth. If the new article has the better claim to ownership, say so
  and stop — do not silently rewrite the existing one.
- Removing a question or a gotcha from frontmatter unlinks it but does not delete
  the entry in Contentful. Those need manual cleanup.
- **A gotcha is shared, so unlinking is not removal.** Dropping one from an
  article leaves the entry published and still on the site for as long as any
  other article links it — four of the twenty-eight gotcha entries are currently
  linked by two articles each. Check `links_to_entry` before assuming an unlink
  took something off the site.
