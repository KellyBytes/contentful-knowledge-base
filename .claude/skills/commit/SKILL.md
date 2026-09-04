---
description: Stage and commit work in progress as one or more Conventional Commits.
disable-model-invocation: true
allowed-tools: Bash(git status:*) Bash(git diff:*) Bash(git log:*) Read Glob Grep
---

## Current state

Working tree:

!`git status --short`

Staged and unstaged changes:

!`git diff HEAD --stat`

Recent history, for tone and granularity:

!`git log --oneline -12`

## What to do

1. Read the full diff of everything that changed. Do not commit from the summary alone — the subject line has to describe what actually changed.
2. Decide how many commits the work should be. See below.
3. For each commit, in order:
   - Show the message you are about to use, and the exact paths you will stage.
   - Run `git add` with those paths spelled out. Never a directory when the files inside it are known — `git add a.md b.md`, not `git add dir/`.
   - Run `git commit -m "<message>"`.
4. Print `git log --oneline -N` afterwards, where N is the number of commits made.

Staging and committing each surface as a confirmation before they run. That confirmation is the review step — make the command readable rather than clever, because it is the last thing seen before the write.

## How many commits

Default to one. Split when the work contains changes that a reader would want to find separately, and that stand on their own if the other half is reverted.

When splitting, commit in dependency order: the change that enables or explains the other goes first. A tool before its output, a convention before the data brought in line with it, a fix before the work that relies on it.

When neither depends on the other, the order does not matter. Pick one and say why in the report, rather than reaching for a rule that does not exist. Size is not a reason — a one-line change can be the point of the work and a fifty-line change can be the aside.

The repository's own history is the reference. Recent examples:

- A convention documented in `content/CLAUDE.md` and the article data brought in line with it went in as two commits — `docs(kb):` then `content(kb):`. Documentation and content are different readers.
- A skill gaining a capability, and the output that skill produced, went in as two — `feat(skills):` then `docs(kb):`. The tool is not its output.
- A rule change and the stale sentences it invalidated went in as **one**. Splitting them would have left a self-contradictory file in its own commit.

That last case is the test that matters: **if committing half the work leaves the repository in a state that contradicts itself, it is one commit.**

## Scopes actually in use

| Prefix                                    | For                                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `content(kb):`                            | Article Markdown — body, front matter, gotchas, questions                                                              |
| `style(kb):`                              | Prose and wording changes to articles with no substantive edit                                                         |
| `format:`                                 | Whitespace, fences, line endings — no content change                                                                   |
| `docs(kb):`                               | `content/CLAUDE.md`, `_reference/`, `_ideas/`                                                                          |
| `docs:`                                   | Root `CLAUDE.md`, `README.md`, anything repository-wide                                                                |
| `feat(skills):` / `fix(skills):`          | `.claude/skills/`                                                                                                      |
| `feat(scripts):` / `fix(scripts):`        | `scripts/`                                                                                                             |
| `feat(verify):` / `fix(verify):`          | `verify/package.json`, `verify/package-lock.json`, `verify/.gitignore` — the verification sandbox's pinned environment |
| `docs(verify):`                           | `verify/reports/_template.md` — the report shape                                                                       |
| `feat:` / `fix:` / `refactor:` / `chore:` | Application code, config, tooling                                                                                      |

Nothing else under `verify/` is tracked. Per-run `.mjs` scripts, `react-legacy-*/` installs, and per-article reports are all gitignored by design — if one of them shows up in `git status`, that is a `.gitignore` problem to report, not a file to stage.

Subject line only. English, imperative, no trailing period. Add a body only when the reason would not be recoverable from the diff — a judgement call, a constraint that forced the approach, a trade-off taken knowingly.

Check the recent log before writing the subject. If a similar subject is already there, say what is different about this one rather than repeating it.

## Stop and report instead of committing when

- Changes touch both `scripts/` and `content/` and it is not obvious whether the content change is a consequence of the script change. Ask.
- A change looks unintentional — a file you were not told about, a large reformat, a deleted section.
- The diff contains something that should not be committed: a secret, an absolute path, a `.env` value, a large generated file.
- `content/_reference/*.json` changed. Those are generated by `npm run article:model`. Say so and ask whether the regeneration was intended.
- Any pipeline-managed field of an already-pushed article changed — `body`,
  `summary`, `title`, `tag`, `order`, `versionScope`, `readingTime`,
  `prerequisites`, `related`, or a gotcha or question block. The commit does
  not reach Contentful. Say which fields changed and that a push is needed.
  When a gotcha block changed, say which other articles link it.
- A pinned dependency version changed in `verify/package.json`. Every report already written under `verify/reports/` recorded its results against whatever was pinned at the time — say which package changed, from what to what, and confirm it was intentional. An accidental bump silently invalidates the version comparisons those reports made.
- A file that `verify/.gitignore` is supposed to exclude appears as untracked — a stray `.mjs` from a verification run, a `react-legacy-*/` file, a report other than `_template.md`. Do not stage it. Say which file and that the ignore rule needs checking.
- You cannot describe a change in one line because you do not understand it. Say that, rather than writing a vague subject.

Reporting is not failure. A commit with a wrong or vague message cannot be fixed here — `git commit --amend` and `git reset` are both forbidden.

## Never

- Run `git push`.
- Run `git commit --amend`, `git reset`, `git restore`, `git checkout -- <path>`, or `git clean`.
- Stage with `git add .` or `git add -A`. Pass explicit paths, always.
- Stage a path you were not asked about without saying so first.
- Commit `.env`, `.env.local`, or anything under `content/_archives/` (gitignored, personal reference).
- Commit a `.mjs` script from a `/verify-article` run. They are scratch by design.
- Write a subject that describes the process ("update files", "apply changes") rather than the change.
