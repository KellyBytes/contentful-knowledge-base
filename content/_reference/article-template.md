# Knowledge Base Article Template

Last updated: 2026-08-23
Applied to: `var-let-const`, `closures-explained`

This is the canonical specification for a knowledge base article. The `new-article`
skill reads it before drafting; a human reads it before reviewing. When this file
and a published article disagree, this file is right and the article needs fixing.

Related reference:

- `content/_reference/categories.json` — the fixed category list
- `content/_reference/tags.json` — the fixed tag list and entry IDs
- `content/_reference/content-model.json` — exported Contentful content model
- `content/_reference/topic-ownership.md` — which topic belongs to which article

---

## 1. Front matter

Pulled from the Contentful Article entry by `scripts/article-pull.mjs`. When adding
fields by hand, match the Contentful field ID exactly — a mismatch is silently
dropped on the next pull.

### Scalar fields

| Field               | Type                    | Notes                                                                                 |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| `contentType`       | —                       | Always `article`                                                                      |
| `title`             | Short text              | Quote titles containing code: `'var, let, and const'`                                 |
| `slug`              | Short text (unique)     | Lowercase, hyphenated                                                                 |
| `category`          | Reference               | Single. Links to a Category entry                                                     |
| `tag`               | Reference (many, max 3) | **Field ID is singular.** Not `tags`                                                  |
| `difficulty`        | Short text              | `Beginner` / `Intermediate` / `Advanced`                                              |
| `summary`           | Long text               | 2–3 sentences. **Doubles as the article's TL;DR**, so the body has no summary section |
| `contentfulEntryId` | —                       | Auto-generated. Read it from the entry URL                                            |
| `order`             | Integer                 | List position. Number in tens so entries can be inserted between                      |
| `versionScope`      | Short text              | e.g. `ES2015 (ES6) and later; React examples target React 18+`                        |
| `lastUpdated`       | Date                    |                                                                                       |
| `readingTime`       | Integer                 | Minutes                                                                               |

### Reference fields (many)

| Field                | Links to                 | Max |
| -------------------- | ------------------------ | --- |
| `prerequisites`      | Article (self-reference) | 3   |
| `related`            | Article (self-reference) | 4   |
| `gotchas`            | Gotcha                   | 6   |
| `interviewQuestions` | InterviewQuestion        | —   |

**Never put the same article in both `prerequisites` and `related`.** If A lists B as
a prerequisite, B lists A as related. Keep the relationship one-directional.

---

## 2. Body sections

★ required / ☆ conditional

### ★ Opening (no heading)

**Do not open with a definition.** Show working code or a symptom, and let the
reader predict before you answer.

- Good: "Run this and guess the output before you read on."
- Good: "Read this and explain how it is possible."
- Bad: "A closure is a function that…"

Close the opening by declaring how many things the article covers ("those are the
only three differences"). It gives the reader a shape to hang the rest on.

### ☆ Term disambiguation

Only for topics routinely confused with a neighbour. One sentence each.
Examples: scope vs closure, CSR vs SSR, authentication vs authorization.

### ★ How it works

Name the heading after the topic — `Difference 1: scope`, `The backpack analogy`.

**Deciding whether to use a metaphor:**

1. Is the subject an invisible runtime mechanism? If yes, a metaphor helps
   (closures, the event loop, hoisting).
2. Is the subject a choice between ways of writing something? If yes, a table and
   real examples are faster (var/let/const, Grid vs Flexbox).
3. **Can you write one paragraph on where the metaphor breaks?** If not, do not use it.

Rule 3 is not optional. Naming the boundary often connects otherwise separate parts
of the article — in `closures-explained`, the paragraph explaining that nothing is
literally packed into the backpack sets up the memory section later.

Diagrams are judged separately from metaphors. ASCII timelines and structure
diagrams earn their place even in articles that use no metaphor at all.

### ★ Code examples

- One minimal runnable example, with output in comments
- Short enough to fit on one screen
- Follow it with a numbered walkthrough so each step is traceable

### ☆ Use cases

Number them (`Use case 1:` …). Three is the ceiling.
**Three use cases push an article long** — check the length budget below.

### ☆ Side-by-side comparison

**Only when a real comparison exists.** Four to six axes.

- Alternatives in one category: `var` / `let` / `const`, Grid / Flexbox
- Opposed design choices: closures / classes, JWT / sessions

Do not manufacture one for a standalone concept.

### ★ The rule of thumb

One or two lines, or three numbered items. Leave no ambiguity.
Add one sentence on _why_ it works — that is what makes it stick (e.g. it is a
signal to the next reader).

### ☆ The cost / trade-offs

Performance, memory, readability. Only when there is a real cost to name.

### ★ Version and environment notes

If nothing applies, write `No version-specific caveats.` **Never leave it blank.**
Worth covering:

- Which spec version introduced it (ES2015, ES2022, …)
- Behaviour that changes by version (React 18 StrictMode double-invoking effects)
- Script vs module, strict vs sloppy mode differences
- Post-build behaviour, where compiled output diverges from source
- How to verify — which DevTools panel, `node -v`, and so on

### ★ Check yourself

Two questions asking for the output of a snippet. Wrap answers in `<details>`.
Each answer carries one or two sentences of _why_.

### ★ Sources

MDN, official documentation, the specification. Prefer primary sources.

---

## 3. Referenced entries

### Gotcha

**Never inline these in the body.** They are separate entries, linked by reference.

| Field          | Notes                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| `symptom`      | The **display field**. Write it in the **first person**. Max 120 chars            |
| `slug`         | **Describes the symptom, never the article** — gotchas are shared across articles |
| `errorMessage` | Only when the console prints something verbatim. Otherwise leave empty            |
| `cause`        | One or two sentences                                                              |
| `fix`          | Concrete. If there are several fixes, say when each applies                       |
| `category`     | Reference. Same taxonomy as articles                                              |
| `tag`          | Reference (many, max 3)                                                           |

**Extraction test: is there a reproducible symptom?** An error message or a
surprising output makes it a Gotcha. A general "be careful here" note stays in the body.

**Overlap with the body:** when the concept itself is the gotcha, split the jobs —
the **body explains why it happens**, the **Gotcha gives symptom → fix**. Keep the
❌/✅ correction block out of the body; that belongs to the card.

**Expect reuse.** One Gotcha can be referenced by several articles.
`var-loop-callback-shares-binding` is shared by `var-let-const` and `closures-explained`.

**Get the reverse lookup with `links_to_entry`.** Do not add an article reference
field to Gotcha. A two-way reference will drift out of sync.

### InterviewQuestion

- `question` reads like something a person would actually search or ask
- `shortAnswer` is what you could say out loud in 30–60 seconds
- Cover what it _enables_, not only what it _is_

---

## 4. Length and style

### Budget by difficulty

| Difficulty   | Words       | Reading time       |
| ------------ | ----------- | ------------------ |
| Beginner     | 1,200–1,800 | 8–10 min           |
| Intermediate | 1,800–2,500 | 10–13 min          |
| Advanced     | 2,500+      | consider splitting |

### Style

- Paragraphs of two to three sentences
- Sentences under 25 words, active voice
- Define a term in plain words the first time it appears
- Target Flesch-Kincaid Grade 8–9
- Give the one sentence worth memorising its own bolded line
  (e.g. **closures capture variables, not values**)

---

## 5. File locations

| Artifact            | Path                                             |
| ------------------- | ------------------------------------------------ |
| English article     | `content/knowledge-base/<category>/<slug>.md`    |
| Japanese study note | `notes/ja/<category>/<slug>_ja.md` (git-ignored) |
| Superseded draft    | `content/_archives/<slug>_v<n>.md`               |
| This template       | `content/_reference/article-template.md`         |

The Japanese note is a 1:1 mirror kept for the author's own understanding. It is not
a published translation, so Contentful stays single-locale. Its front matter carries
`slug` as the shared key and `sourceUpdated` as the English `lastUpdated` it was
written against, which makes drift detectable with a short script.

---

## 6. Pre-publish checklist

- [ ] The opening poses a problem rather than a definition
- [ ] If a metaphor is used, its breaking point is written out
- [ ] `versionScope` and the version notes section are both filled in
- [ ] Check yourself has two questions
- [ ] Every Gotcha `symptom` is first person and under 120 characters
- [ ] No Gotcha `slug` names an article
- [ ] Three tags or fewer, under the field ID `tag`
- [ ] No article appears in both `prerequisites` and `related`
- [ ] Checked whether an existing Gotcha can be reused
- [ ] In-body links match the real route (`/kb/[category]/[slug]`)
- [ ] Length is within budget for the stated difficulty
