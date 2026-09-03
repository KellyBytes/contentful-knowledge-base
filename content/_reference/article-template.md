# Knowledge Base Article Front Matter

Last updated: 2026-08-28
Applied to: every article under `content/knowledge-base/`

This file specifies the **front matter and the child entries** — the fields, their
limits, and the shape of a gotcha or an interview question block.

**It does not cover how to write the body.** Structure, voice, and length live in
`content/CLAUDE.md`, and that file is the only authority on them.

Related reference:

- `content/CLAUDE.md` — authoring rules: body structure, voice, length, Markdown
- `content/_reference/content-model.json` — exported Contentful content model
- `content/_reference/categories.json` — the fixed category list
- `content/_reference/tags.json` — the fixed tag list
- `content/_reference/topic-ownership.md` — which topic belongs to which article

---

## 1. How front matter reaches Contentful

The Markdown is the source of truth. `scripts/article-push.mjs` reads the front
matter and sends it to Contentful; nothing is pulled back in the normal flow.

A key whose name does not match a field on the `article` content type is **not
sent**, and the dry run names it:

```
warning: content/knowledge-base/javascript/<slug>.md: unknown frontmatter key(s): …
warning:   not a field on the `article` content type — not sent, and nothing reads it.
```

Always run the dry run and read the report before pushing:

```bash
npm run article:push -- content/knowledge-base/javascript/<slug>.md --dry-run
```

### Field order

The order below is the order `scripts/article-push.mjs` sends the fields, which is
also the order they appear on the dry run's `unchanged` line. Two of them are never
written by hand:

- **`body`** is the Markdown below the closing `---`, not a front matter key
- **`lastReviewed`** is derived on every push. **It must never appear in front matter**

Two keys are pipeline bookkeeping rather than content type fields, and come first:
`contentType` is the marker the script validates, and `contentfulEntryId` is how it
finds the entry.

---

## 2. Skeleton

```yaml
---
contentType: article
# contentfulEntryId: written back by the push script. Never write it by hand.
title: Closures Explained # required, max 256
slug: closures-explained # required, unique, lowercase kebab-case
summary: >- # required, max 256 — folded: prose with no internal structure
  A closure is a function that keeps access to the variables of the scope it
  was created in, even after that scope has finished running.
difficulty: Intermediate # required: Beginner | Intermediate | Advanced
category: JavaScript # required, one of the eight in categories.json
tag: # required, 1–4 from tags.json
  - scope-and-closures
  - state-management
interviewQuestions: # max 5
  - question: What is a closure? # a new question has no `id` key at all
    shortAnswer: >- # required, max 600
      A function that keeps access to the variables of the scope it was
      defined in, even after that scope has finished running.
gotchas: # max 6
  - symptom: >- # a new gotcha has no `id` key at all
      My loop callbacks all print the same final number, even though the
      counter changed each time.
    slug: var-loop-callback-shares-binding
    cause: >- # folded — one paragraph, no structure
      `var` gives the whole loop one shared binding. The callbacks run after
      the loop finishes, so they all read the same finished value.
    fix: |- # literal — this one has a list, so it must not be folded
      Change the loop counter to `let`:

      - a `for` loop creates a fresh binding per iteration
      - each callback then captures its own
    category: JavaScript # the gotcha's own category
    tag: # max 3 — a gotcha allows three, an article four
      - scope-and-closures
prerequisites: # max 3, article slugs
  - var-let-const
related: [] # max 4, article slugs
order: 400 # optional, integer, increments of 100
versionScope: ES2015 (ES6) and later # optional, max 256
readingTime: 12 # optional, integer, minutes
---
The body starts here.
```

`order`, `versionScope`, and `readingTime` sit after the arrays because that is
where the script appends them. Front matter key order does not affect what
Contentful receives, so an existing article that groups them differently is fine
and should be left alone.

---

## 3. Article fields

| Field                | Required | Type              | Limit     | Notes                                                                   |
| -------------------- | -------- | ----------------- | --------- | ----------------------------------------------------------------------- |
| `contentType`        | ✔        | —                 |           | Always `article`. Bookkeeping, not a content type field                 |
| `contentfulEntryId`  |          | —                 |           | **Written back by the push script. Never write or edit it by hand**     |
| `title`              | ✔        | Symbol            | max 256   | Noun phrase, not a question. Quote titles containing code               |
| `slug`               | ✔        | Symbol, unique    |           | Lowercase kebab-case only — Contentful rejects anything else            |
| `summary`            | ✔        | Symbol            | max 256   | **A Symbol, not a Text field.** 1–2 sentences, plain prose, no Markdown |
| `difficulty`         | ✔        | Symbol            |           | `Beginner` / `Intermediate` / `Advanced`                                |
| `body`               | ✔        | Text              |           | The Markdown below the closing `---`. Not a front matter key            |
| `category`           | ✔        | Link → category   | exactly 1 | One of the eight names in `categories.json`. Never invent one           |
| `tag`                | ✔        | Array&lt;Link&gt; | 1–4       | **Field ID is singular.** Not `tags`. Names from `tags.json`            |
| `interviewQuestions` |          | Array&lt;Link&gt; | max 5     | See §5. A new question carries no `id`                                  |
| `gotchas`            |          | Array&lt;Link&gt; | max 6     | See §4. A new gotcha carries no `id`                                    |
| `prerequisites`      |          | Array&lt;Link&gt; | max 3     | Article **slugs**, not ids. See §6                                      |
| `related`            |          | Array&lt;Link&gt; | max 4     | Article **slugs**, not ids. See §6                                      |
| `lastReviewed`       | ✔        | Date              |           | **Derived on every push. Never write it in front matter**               |
| `order`              |          | Integer           |           | Position within the category                                            |
| `versionScope`       |          | Symbol            | max 256   | e.g. `ES2015 (ES6) and later; React examples target React 18+`          |
| `readingTime`        |          | Integer           |           | Minutes                                                                 |

**`order` uses increments of 100**, so an article can be inserted between two
existing ones without renumbering. The sequence is pedagogical — the order someone
should read them — not alphabetical.

---

## 4. Gotcha blocks

**Never inline a gotcha in the body.** It is a separate entry, linked by reference.

| Field          | Required | Type              | Limit        | Notes                                                                                                         |
| -------------- | -------- | ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| `id`           |          | —                 |              | Present only on a reused gotcha. **Omit the key entirely** on a new one                                       |
| `symptom`      | ✔        | Symbol            | 10–120 chars | The **display field**. Write it in the **first person**                                                       |
| `slug`         | ✔        | Symbol, unique    |              | **Describes the symptom, never the article**                                                                  |
| `errorMessage` |          | Symbol            | max 200      | Only when the console prints something verbatim. **Otherwise omit the key** — an empty value parses as `null` |
| `cause`        | ✔        | Text              | max 600      | One or two sentences                                                                                          |
| `fix`          | ✔        | Text              | max 900      | Concrete. If there are several fixes, say when each applies                                                   |
| `category`     | ✔        | Link → category   | exactly 1    | **The gotcha's own category** — not necessarily the article's                                                 |
| `tag`          |          | Array&lt;Link&gt; | max 3        | **Three, where an article allows four.** Different limits                                                     |

`cause` and `fix` are rendered through `components/Markdown.jsx`, so fenced code
blocks must declare a language and `#` headings are never used. Keep them to prose,
lists, and inline code.

### A new gotcha

No `id` key at all. The push script creates the entry, publishes it, and writes the
id back into this file.

```yaml
gotchas:
  - symptom: I mutated my array in state directly, but React never re-rendered.
    slug: state-mutation-no-rerender
    cause: >-
      Mutating the existing object or array keeps the same reference. React
      compares old and new state with `Object.is`, so it sees no change.
    fix: |-
      Build a new array instead of mutating:

      - spread — `[...arr, item]`
      - `concat()`
      - `map()` / `filter()`

      Then pass the new array to the setter.
    category: JavaScript
    tag:
      - rendering
      - immutability
```

### A reused gotcha

One gotcha entry is linked by several articles, so writing it changes every article
that references it. Carry the existing id **and a copy of the block that is
identical to the article it came from**. Copy it verbatim — never reword, tighten,
or improve it.

```yaml
gotchas:
  - id: fcsHcCinsnk9GYrcSAIhA
    symptom: >-
      My loop callbacks all print the same final number, even though the counter changed each time.
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
```

### What the push script refuses

- **Copies that disagree.** If any two articles carry different copies of the same
  gotcha id, the push aborts without writing and names the disagreeing files. Which
  copy is correct is a human decision
- **A duplicate slug.** Gotcha slugs are unique across the whole space. Creating one
  whose slug already exists aborts and reports the existing id to link instead
- A gotcha with an `id` is resolved by `sys.id` only, never by slug

Before inventing a slug, grep `content/knowledge-base/` for it. A hit means the
gotcha already exists and should be reused.

### When something is a gotcha

**Is there a reproducible symptom?** An error message or a surprising output makes
it a gotcha. A general "be careful here" note stays in the body.

When the concept itself is the gotcha, split the jobs: the **body explains why it
happens**, the **gotcha gives symptom → fix**.

**Do not add an article reference field to Gotcha.** Get the reverse lookup with
`links_to_entry`; a two-way reference will drift out of sync.

---

## 5. Interview question blocks

| Field         | Required | Type   | Limit   | Notes                                            |
| ------------- | -------- | ------ | ------- | ------------------------------------------------ |
| `id`          |          | —      |         | **Omit the key entirely** on a new question      |
| `question`    | ✔        | Symbol |         | Reads like something a person would actually ask |
| `shortAnswer` | ✔        | Text   | max 600 | What you could say out loud in 30–60 seconds     |

Unlike a gotcha, an interview question belongs to one article and is never shared.

Removing a question from front matter unlinks it but does not delete the entry in
Contentful. Those need manual cleanup.

---

## 6. Cross-references

`prerequisites` and `related` hold article **slugs**, not entry ids. The push script
resolves them against the other files under `content/knowledge-base/` — it never
asks Contentful.

- `prerequisites` — max 3
- `related` — max 4
- A referenced article must already have a `contentfulEntryId`. Referencing one that
  has never been pushed aborts with `Push <file> first.`
- An article cannot reference itself
- **An empty list is sent as an empty list.** Removing a slug removes the link

**Never put the same article in both `prerequisites` and `related`.** If A lists B
as a prerequisite, B lists A as related. Keep the relationship one-directional —
this is an authoring convention, not something the script enforces.

---

## 7. YAML scalar style

- **`|-` (literal)** for any `cause` or `fix` that contains a list or a deliberate
  line break. `>-` collapses single newlines into spaces, which turns a bullet list
  into one run-on line
- **`>-` (folded)** only for prose with no internal structure
- `symptom` is a single line with no breaks, so `>-` is always fine there

The two copies of a shared gotcha are compared by their **parsed values**, so a
folded block and a literal block holding the same text are not the same thing. That
difference alone will abort a push.

---

## 8. Pre-publish checklist

- [ ] `versionScope` is filled in
- [ ] Four tags or fewer on the article, under the field ID `tag`
- [ ] Three tags or fewer on each gotcha
- [ ] Every gotcha `symptom` is first person and 10–120 characters
- [ ] No gotcha `slug` names an article
- [ ] Checked whether an existing gotcha can be reused, and copied it verbatim if so
- [ ] New gotchas and questions carry no `id` key
- [ ] No article appears in both `prerequisites` and `related`
- [ ] `lastUpdated` and `lastReviewed` do not appear in front matter
- [ ] `npm run article:push -- <path> --dry-run` reports no warnings and no surprises

For everything about the body — structure, voice, length, Markdown — see
`content/CLAUDE.md`.
