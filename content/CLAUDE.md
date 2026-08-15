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
    topic-ownership.md                               hand-maintained
```

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
contentfulEntryId: xu0KrzEfJQF2mtgpf3wYd
order: 40
interviewQuestions:
  - id: 5iVimjqCU5OLsi2XcC50yY
    question: What is a closure?
    shortAnswer: >-
      ...
---
```

| Key                       | Rule                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------- | ---------- |
| `contentType`             | Always `article`                                                                             |
| `title`                   | ≤256 chars. Noun phrase, not a question. Not the same wording as the slug                    |
| `slug`                    | lowercase kebab-case only — Contentful rejects anything else                                 |
| `category`                | Exactly one of the eight names below. Never invent one                                       |
| `tag`                     | 1–4 names from the thirteen below. Never invent one                                          |
| `difficulty`              | `Beginner`                                                                                   | `Intermediate` | `Advanced` |
| `summary`                 | **≤256 chars — this is a Symbol, not a Text field.** 1–2 sentences, plain prose, no markdown |
| `order`                   | Integer. Position within the category                                                        |
| `contentfulEntryId`       | Written by the push script. **Never write or edit this by hand**                             |
| `interviewQuestions[].id` | Same — leave empty (`""`) for new questions                                                  |

`lastReviewed` is derived by the push script and must not appear in frontmatter.

**`order` uses increments of 10**, so an article can be inserted between two
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

Tags are concept axes and are deliberately orthogonal to category — the same tag
appears across several categories. Pick the 2–3 that a reader would actually
browse by, not every one that technically applies.

`interview-frequent` is reserved for topics asked in a large share of front-end
interviews. It costs one of four tag slots, so it is not a default. 🔧 do you
want a firmer rule here?

If a topic genuinely has no fitting category or tag, stop and say so. Do not
approximate, and do not add an entry to the reference JSON files — those are
generated from Contentful.

---

## Article shape

There is no template file. Before drafting, read
`knowledge-base/javascript/closures-explained.md` in full — it is the reference
implementation of everything below. Match its shape and its voice, not its
headings: section titles are specific to each article
(`## The backpack analogy`, `## The office building analogy`), never generic.

Every article follows the same arc. Section names vary; the sequence does not.

1. **Opening — no heading.** Two to four short paragraphs. Define the thing in
   one sentence, then separate it from the concept it gets confused with (scope
   vs closure; declaration vs assignment). Close by saying when it actually
   becomes visible in real code.
2. **`## The <object> analogy`** — one concrete, physical, non-technical
   metaphor, followed by one or two refinements that keep it honest ("the
   backpack holds the actual variables, not photocopies").
3. **`## The simplest possible example`** — the smallest runnable snippet, then
   an ASCII diagram of what just happened.
4. **Two to four body sections** — progressive, each building on the last.
   Numbered when parallel (`## Difference 1: scope`, `## Use case 2: ...`).
5. **The trap** — the mistake that actually bites people, with the wrong and
   right code side by side.
6. **Where it shows up** — the same idea in React, Node, or the build, so the
   reader sees it in code they'll write.
7. **`## The cost`** or **`## Side-by-side`** — trade-offs in prose, or a
   comparison table when there are three or more things to distinguish.
8. **`## The rule of thumb`** — the closing decision heuristic. Not a summary.
   Give the reader something to _do_ when they next hit this.

Target 1,800–2,200 words. Shorter is fine when the topic is genuinely small;
padding to reach a number is not.

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

- One analogy per article. Never stack a second for the same concept.
- It must be a physical thing the reader can picture: a room, a backpack, a name
  tag.
- If it needs more than two caveats to stay accurate, it is the wrong analogy.
  Find a better one rather than patching it.
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

Rendered by `react-markdown` + `remark-gfm` + `rehype-highlight`
(`components/Markdown.jsx`), styled with `@tailwindcss/typography`. No custom
component overrides — what the plugins support is what you get.

- Allowed: `h2`–`h4`, lists, tables, fenced code, inline code, links,
  blockquotes
- Not available: raw HTML, footnotes, math, images
- **Never use `h1`.** The `title` field renders as the page's `h1`
- Tables: GFM pipe syntax only

### Code blocks

**Real code must declare a language** — ` ```js `, ` ```jsx `, ` ```bash `.
`rehype-highlight` leaves untagged blocks unhighlighted.

**ASCII diagrams must be left untagged.** That is deliberate: an untagged block
renders as plain monospace, which is exactly right for box-drawing characters.
Tagging a diagram makes the highlighter colour it as if it were code.

```
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
3. A closing line on **how to deliver it** — what to emphasise, or what getting
   it backwards causes

Four questions, four different jobs:

|     | Job                            | Example                                                   |
| --- | ------------------------------ | --------------------------------------------------------- |
| 1   | Define it                      | "What is a closure?"                                      |
| 2   | A distinction people get wrong | "Do two closures from the same function share variables?" |
| 3   | Puncture a false shortcut      | "Does `let` solve every closure problem?"                 |
| 4   | A judgement call               | "When would you choose a closure over a class?"           |

Never reference the article itself ("as explained above") — these are read on
their own. Never repeat a body section verbatim.

---

## Workflow

```bash
npm run article:push -- content/knowledge-base/javascript/<slug>.md --dry-run
npm run article:push -- content/knowledge-base/javascript/<slug>.md
```

Push creates or updates a **draft**. Publishing is manual, in the Contentful web
app, after review. Interview question child entries are published automatically
— an unlinked question entry is invisible on the site, and leaving it as a draft makes the parent article render an empty section with no error.

---

## Rules

- Read `_reference/categories.json` and `_reference/tags.json` before writing
  frontmatter. Do not work from memory — they are generated from Contentful.
- Never modify an existing article's body unless explicitly asked.
- Never invent a `contentfulEntryId` or an `interviewQuestions[].id`.
- Verify technical claims against MDN or the relevant spec before asserting
  them. If you cannot source a claim, say so rather than writing it confidently.
- Before drafting, glob `knowledge-base/**/*.md` and read the **frontmatter
  only** of the existing articles — title, slug, category, tag, summary, order.
  Do not read article bodies; they will flood the context and you do not need
  them to check for overlap.
- Check the sibling articles in the category before drafting, so the analogy,
  the examples, and the `order` value do not collide with an existing one.
- When a topic overlaps an existing article, decide which one owns it. Check
  `_reference/topic-ownership.md` first, and add a row when you create a new
  overlap. Give the short version and link to the owner rather than covering it
  twice at depth. If the new article has the better claim to ownership, say so
  and stop — do not silently rewrite the existing one.
- Removing a question from frontmatter unlinks it but does not delete the entry
  in Contentful. Those need manual cleanup.
