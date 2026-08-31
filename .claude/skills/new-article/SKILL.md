---
description: Draft a knowledge base article at content/knowledge-base/<category>/<slug>.md. Takes a category and a slug.
argument-hint: [category] [slug]
arguments: category slug
disable-model-invocation: true
allowed-tools: Read Glob Grep Write
---

Draft an article for category `$category` with slug `$slug`.

## What to read first

| File                                                      | For                                                                                                                                                                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/_reference/article-template.md`                  | The shape of the front matter. Copy it and fill it in.                                                                                                                                                                |
| `content/CLAUDE.md`                                       | How the body is written — opening, length, difficulty, tag selection, YAML scalar style.                                                                                                                              |
| `content/knowledge-base/javascript/closures-explained.md` | The reference implementation. Match its voice and structure. **Read it in full.**                                                                                                                                     |
| `content/_reference/categories.json`                      | The authoritative category names.                                                                                                                                                                                     |
| `content/_reference/tags.json`                            | The authoritative tag names.                                                                                                                                                                                          |
| `content/_reference/topic-ownership.md`                   | What the existing articles already cover.                                                                                                                                                                             |
| `content/_ideas/*.md`                                     | If a proposal for this slug exists, it already decided `difficulty`, `prerequisites`, `related` and `order`. Follow it. If you would decide differently, say so and why before writing — do not silently override it. |

If any two of these contradict each other, stop and report it. Do not pick one and write the article anyway.

## Pre-flight checks

Fail any one of these and the article is not written. Report and stop.

1. `$category` exists in `categories.json`.
2. `content/knowledge-base/$category/$slug.md` does not already exist.
3. The topic is not already owned by an existing article. Read `topic-ownership.md`. If it overlaps, say which article should absorb it instead.

## Gotchas

**Search before writing a new one.** A gotcha entry is shared across articles, and a duplicate entry with a fresh slug is worse than a reused one — it splits the same problem into two entries that then drift apart.

1. Grep `content/knowledge-base/` for anything covering the same problem. Search by the slug you were going to use, and again by the symptom's keywords.
2. If one exists, copy the whole block **verbatim**, id included. Do not reword it, tighten it, or improve it. The push aborts if any two copies of a shared gotcha disagree.
3. If none exists, it is new: write the block with **no `id` key at all**. Omit the line.

Gotcha slugs are unique across the whole Contentful space. Do not invent a slug that already exists somewhere in `content/knowledge-base/`.

## Output

Create exactly one file: `content/knowledge-base/$category/$slug.md`.

If the article overlaps an existing one, append a single row to `content/_reference/topic-ownership.md`. Report the row you added.

## Never

- Edit or delete any existing file. The one exception is `content/_reference/topic-ownership.md`: when the new article creates an overlap with an existing one, append a row for it. Append only — never edit or remove an existing row.
- Touch Contentful in any way.
- Write a `contentfulEntryId`, an `interviewQuestions[].id`, or a `gotchas[].id`. The push script writes all three back. The one exception is the id carried by a gotcha block copied verbatim from another article.
- Copy an id out of the template or out of a sample. A copied id overwrites whatever entry it belongs to.
- Invent a tag or a category. Use only what is in `tags.json` and `categories.json`.
- Put a slug in `prerequisites` or `related` unless that article already has a `contentfulEntryId`. Referencing an unpushed article aborts the push.
- Treat a word count as a target. Length follows from how wide the topic is.

## Report when done

Print this checklist with the measured value filled in on every line. A bare "OK" is not a report.

**Front matter**

- [ ] `summary`: \_\_\_\_ chars (max 256, no backticks)
- [ ] `versionScope`: \_\_\_\_ chars (max 256)
- [ ] `tag`: \_\_\_\_ entries (1–4), all present in `tags.json`
- [ ] `prerequisites`: \_\_\_\_ entries (max 3), all already pushed
- [ ] `related`: \_\_\_\_ entries (max 4), all already pushed
- [ ] `difficulty`: \_\_\_\_ — one line on why
- [ ] `readingTime`: \_\_\_\_ minutes
- [ ] No `contentfulEntryId` written
- [ ] `order`: \_\_\_\_ — how it sits among its siblings in the same category
- [ ] `interview-frequent`: applied / not applied — one line on why

**Gotchas** — \_\_\_\_ entries (max 6)

- [ ] Search terms used: \_\_\_\_
- [ ] Reused: slug + the file it was copied from (or "none")
- [ ] New ones: every block has no `id` line
- [ ] Each `symptom`: \_\_\_\_ chars (10–120, single line)
- [ ] Each `cause`: \_\_\_\_ chars (max 600)
- [ ] Each `fix`: \_\_\_\_ chars (max 900)
- [ ] Any `errorMessage`: \_\_\_\_ chars (max 200)
- [ ] Each gotcha's `tag`: \_\_\_\_ entries (max 3 — not the article's 4)
- [ ] Any `cause` or `fix` containing a list uses `|-`, not `>-`

**Interview questions** — \_\_\_\_ entries (max 5)

- [ ] Each `shortAnswer`: \_\_\_\_ chars (max 600)
- [ ] Every block has no `id` line

**Body**

- [ ] Opens as: one line inviting a prediction → fenced `js` block → a paragraph on what actually happens → a paragraph that names and defines it
- [ ] Total words: \_\_\_\_ (code included; under ~1,000 is likely too thin, over ~2,200 likely wants splitting)
- [ ] No `#` anywhere — h1 belongs to the `title` field
- [ ] Every fenced code block declares a language
- [ ] If a metaphor is used, there is a paragraph naming where it breaks

**Then**

Tell the user to run:

```bash
npm run article:push -- content/knowledge-base/$category/$slug.md --dry-run
```
