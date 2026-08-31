---
description: Propose knowledge base article topics for a category, excluding anything the existing articles already own.
argument-hint: [category]
arguments: category
disable-model-invocation: true
allowed-tools: Read Glob Grep
---

Propose article topics for category `$category`.

## Existing articles

!`git ls-files content/knowledge-base`

## What to read

| File                                                  | For                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `content/_reference/topic-ownership.md`               | What the existing articles already own. The primary input.                                                                      |
| `content/_reference/categories.json`                  | Confirm `$category` exists.                                                                                                     |
| `content/_reference/tags.json`                        | The tags a proposal can draw on.                                                                                                |
| Every `.md` under `content/knowledge-base/$category/` | Read the front matter: `title`, `slug`, `summary`, `difficulty`, `order`, and the `gotchas` block.                              |
| `content/_ideas/*.md`                                 | Previous proposal runs, if any. Note where this run's judgement differs from an earlier one for the same category, and say why. |

Read the `gotchas` of the existing articles in the category. A gotcha already covered there is not a topic — it is a sign the problem is owned.

If `$category` is not in `categories.json`, stop and say so.

## Output

Print to chat. **Write no files.**

### Proposals

A table of 8–10 rows:

| # | slug | One line | difficulty | Overlap risk | prerequisites |

Below the table, one or two sentences per row on why it is worth writing — what a reader would come away able to do that they cannot now.

### Considered and rejected

Every topic that came up and was dropped, with the reason. When it was dropped because an existing article owns it, name the article and say what section it would go in instead.

**This section is the point of the command.** A proposal list without it is half the answer. If nothing was rejected, say the category is genuinely empty and explain what you searched for.

### Sequencing

If some proposals depend on others, say which order they should be written in and why. Suggest an `order` value for each, consistent with the existing articles in the category.

## Constraints

- Do not propose a topic that `topic-ownership.md` assigns to an existing article.
- Do not propose "an introduction to X" or "the complete guide to X". A topic is one question a reader arrives with.
- Slugs are lowercase kebab-case, noun phrases rather than verbs, matching the existing naming.
- If a topic would run past ~2,200 words, propose the split instead of the topic.
- If a topic would run under ~1,000 words, it is a section of an existing article. Put it in the rejected list, not the table.
- Difficulty is decided by prerequisite knowledge, not by length. A category with no Beginner article yet needs one before it needs an Intermediate.

## Never

- Write, create, or edit any file, including `topic-ownership.md`.
- Touch Contentful.
- Invent a tag or a category.
- Propose a topic without having read the existing articles' front matter. Say which files you read.
