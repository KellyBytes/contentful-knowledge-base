---
description: Verify the technical claims in a published knowledge-base article — execute its code, check version-specific claims against primary sources, confirm cited sources actually support what they're cited for, and confirm gotcha fixes remove the stated symptom. Writes a Japanese report under verify/reports/. Never edits content/knowledge-base/.
argument-hint: [slug]
arguments: slug
disable-model-invocation: true
allowed-tools: Read Glob Grep WebFetch WebSearch Bash(node:*) Bash(cd verify && *) Bash(ls verify:*) Write(verify/reports/*) Write(verify/*.mjs)
---

Verify `content/knowledge-base/**/$slug.md` against four layers of evidence. Report only — this command never edits an article and never touches Contentful.

## Current state

Does the shared sandbox already exist?

!`ls verify/ 2>/dev/null || echo "verify/ does not exist yet"`

Which legacy React versions are already installed?

!`ls -d verify/react-legacy-*/node_modules/react 2>/dev/null || echo "no legacy React install yet"`

## What to read first

| File                                 | For                                                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `content/knowledge-base/**/$slug.md` | The article itself. Read the whole thing, front matter included.                                                           |
| `content/CLAUDE.md`                  | Field meanings, so a claim is read in the right context.                                                                   |
| `verify/reports/_template.md`        | The authoritative shape of the report. Copy it and fill it in — do not invent a different structure.                       |
| `verify/reports/*-verify.md`         | Reports from earlier runs, if any. Useful for how a similar claim was set up before — but each run writes its own scripts. |

If `$slug` does not resolve to exactly one file under `content/knowledge-base/`, stop and report which of "no match" or "multiple matches" happened.

## Pre-flight checks

Fail any one of these and stop before touching anything:

1. The article file exists and has a `category` this skill can act on (see the table below — a category with no Layer 1 method is not a failure, just skip straight to Layer 2).
2. `verify/` exists, or you have explicit approval to create it. Creating the sandbox and running `npm install` for the first time is an environment change — stop and ask before doing it, same as any other install.
3. If a claim in this article is version-differential (the article says "before X, ...; from X, ..."), work out which older major version X-1 (or whichever version the article actually names) the comparison needs, and check for `verify/react-legacy-<that-version>/`. If it doesn't exist, **stop and ask**, naming the exact version — do not default to whatever legacy install happens to already be there. A React 17 comparison is not satisfied by a React 18 legacy install just because one exists.

## Scope by category

| Category                                 | Layer 1 method                                            |
| ---------------------------------------- | --------------------------------------------------------- |
| React                                    | jsdom + `react-dom/client` + `act()`                      |
| JavaScript / TypeScript / Node.js & APIs | plain Node (`esbuild-register` transpiles `.ts`)          |
| Databases                                | `sqlite3` if the claim is a runnable SQL query, else none |
| CSS & Styling                            | none — go straight to Layer 2/3                           |
| Web Fundamentals                         | judge per-article; state the decision in the report       |

## Environment

Reuse one shared sandbox at the repo root. Do not create a fresh npm project per article.

```
verify/
  package.json                # react, react-dom, jsdom pinned to CURRENT (React 19)
  .gitignore                   # node_modules/, react-legacy-*/, *.mjs, reports/* except _template.md
  react-legacy-18/              # installed on demand, kept once installed
  react-legacy-17/              # installed on demand, only when an article
                                 # actually compares against 17 (e.g. state-as-a-snapshot)
  reports/
    _template.md                # tracked — the report shape
    <slug>-verify.md            # gitignored — per-article results, Japanese
```

**Execution scripts are written fresh for each run, dropped in `verify/` as `.mjs` files, and never committed.** There is deliberately no shared harness: too few articles have been verified so far to know which parts are actually common, and a wrong abstraction here would shape every future run around it. Write what this article needs, name the files after the claim they test (e.g. `state-snapshot-main-example.mjs`), and let them be thrown away. If the same setup turns up in three or four runs unchanged, that is the moment to propose extracting it — not before.

`verify/package.json` and `verify/.gitignore` are tracked in GitHub (English, part of the KB's tooling). Everything else under `verify/` — scripts, legacy installs, per-article reports — is gitignored. Never create a `react-legacy-<N>/` on the spot without the approval called for in Pre-flight check 3; once one exists, reuse it rather than reinstalling.

## Re-running a slug

If `verify/reports/$slug-verify.md` already exists, this run appends a new dated
section at the bottom; the earlier section is never edited. Read the earlier run
before starting — but treat it as context, not as a baseline to argue with.

- Re-measure everything. A new section must stand on its own, so that reading it
  alone is enough. Do not write "same as the first run" and skip a measurement.
- Say at the top of the new section what changed since the last run — commits to
  the article, commits to this skill — and which measurements are new because of it.
- You may note that a finding in an earlier section is not reproduced under the
  current rules, and you should, since a reader comparing the two sections needs
  to know. State it as what the current run measured or found, and leave the
  earlier finding standing as written. Do not write that the earlier finding was
  wrong, unfounded, or resolved — grading a previous run is a verdict, and
  verdicts are Kelly's.

## Workflow

### Step 0 — Inventory

Before running anything, list every candidate claim in the report:

- Code blocks with a stated predicted output (an inline comment, a sentence right before or after the block, or a `<details>` answer)
- Sentences in `versionScope` or "Version and environment notes" that name a specific version or a behavior change across versions
- **Testable assertions inside front-matter fields.** A `fix` that claims a
  particular approach does or does not work, a `cause` that states a mechanism, an
  `interviewQuestion` answer that names a behavior — these are Layer 1 candidates
  even though no code block accompanies them, and they are easy to miss precisely
  because there is nothing fenced to extract. List them with the field and line
  they came from, and carry them into Layer 1 alongside the code blocks.
- Concept-level claims that would need a citation to back them — a term introduced and bolded for the first time, a mechanism stated in a gotcha's `cause`, a claim about _why_ something behaves the way it does. List these as their own set, separate from the URLs below. Layer 3 checks this set against that one as two independent lists, not as pairs matched by position.
- Every URL under `## Sources`
- Every entry in `gotchas[]`

If a code block's predicted output is ambiguous — no comment, no adjacent sentence — list it as "判定不能" (not checkable) rather than guessing what it's supposed to prove.

### Step 1 — Execute (Layer 1)

For each candidate from Step 0 that the category table allows:

1. Extract the fenced code block **verbatim**. Never retype, "clean up", or convert it to `React.createElement` calls by hand — a hand-transcribed version verifies a different program than the one that's published.
2. Write a script under `verify/` that mounts or calls it with the minimal wrapper needed, and nothing more. For React: jsdom, `createRoot`, `act()`, `dispatchEvent`. Set `global.IS_REACT_ACT_ENVIRONMENT = true`, and do not assign `global.navigator` — it is getter-only on current Node and will throw. **The one exception is a batching measurement — see Known pitfalls before reaching for `act()` there.**
3. Run it. Capture the actual output.
4. **If the claim is negative — "X has no effect", "this does not help", "the value does not change" — pair it with a positive control in the same script.** A null result is what a broken measurement produces too, so a measurement that can only ever return "no difference" proves nothing on its own. Add a case the same harness should show a difference on, and report it next to the main result. See Known pitfalls.
5. If the claim is version-differential, run it under **both** `verify/package.json` (current) and the specific `verify/react-legacy-<N>/` identified in Pre-flight check 3, and report both. Testing a claim like this under one version only proves nothing about what the other version does — and if the code only exercises a React event handler, it won't distinguish the versions at all, since handlers always batched even before automatic batching existed. Test the specific location the claim is actually about (timeout, promise, native listener), and test **every** location the claim names, not a representative subset.
6. Report each claim as: quoted claim → the script path and what it does → actual output → environment (version, runtime). No verdict.

### Step 2 — Version claims vs. primary sources (Layer 2)

For every version-scoped claim Step 1 couldn't test directly (most can't — a claim about _why_ something changed isn't code-testable, only _what_ changed is):

1. Search for and fetch the primary source (react.dev, MDN, the relevant spec, or the project's own release notes).
2. Quote the relevant passage (short excerpt; paraphrase the rest).
3. Place it directly under the article's claim in the report.
4. **A claim that something did _not_ change is not established by a release note
   that fails to mention it.** Absence of mention is weak evidence and must be
   labelled as such in the report: say what the page does list, say the claim's
   subject is not among it, and say plainly that this is an absence and nothing
   more. Where Layer 1 can run the same code on the named version, pair the
   absence with that measurement — a direct run on the version in question is
   stronger than any amount of silence in a changelog.

Lay the two texts side by side. Do not write "確認済み" or "矛盾" — that's Kelly's call.

### Step 3 — Sources audit (Layer 3)

Sources are a flat reading list, not one-source-per-claim footnotes. A claim's
support does not have to come from whichever source sits nearest it in the
list or in the article's text — check each claim against the whole set.

1. Fetch every URL under `## Sources` first, before checking any individual
   claim. You need the full set in hand — checking one claim against one
   source at a time, in list order, is how a claim that's genuinely covered
   by the third or fourth source ends up reported as unsupported.
2. For each concept-level claim from Step 0, search across **all** fetched
   sources — not just whichever one is positionally closest in the article —
   for a passage that supports it.
3. Classify each claim as exactly one of three, and label it in the report:
   - **全面カバー** — some source states the claim, or states a general
     principle that entails it. The article's exact wording and exact technical
     term do not have to appear. A source saying a value "never changes within a
     render, even if its event handler's code is asynchronous" covers a specific
     claim about reading state after an `await`, even though the word "await"
     never appears there.
   - **一部カバー** — the sources support part of the claim, but the article
     states something further that no source states. The article may well be
     right; that is not the point. The point is that it is asserting more than
     its citations carry, and Kelly needs to see that to decide whether to
     soften the sentence, add a source, or leave it as is.
   - **該当なし** — no source covers it, even loosely.

   **Do not let 一部カバー collapse into 全面カバー.** Finding a related passage
   is not the same as finding one that carries the whole claim; if you catch
   yourself writing a note that begins "this exact wording isn't in any source,
   but…", that claim is 一部カバー and belongs in that count. The one exception
   is pure re-wording: if the article says `const` and a source describes a
   variable created fresh on each call and never reassigned, the mechanism is
   fully covered and only the vocabulary differs. Say which of the two it is in
   one line, and say specifically what the sources stop short of.

4. Quote the supporting passage(s) next to the article's claim. If two or
   more sources each cover part of the same claim, show all of them — that's
   the normal shape for a claim like "batching," not a discrepancy to explain
   away.
5. Only report a claim as 該当なし once it has been checked against every
   fetched source and none of them cover it, even loosely. A claim not
   covered by the nearest source but covered by another one in the list is
   not 該当なし.
6. A fetch failure, a dead link, or a page that no longer says anything like
   any claim it might once have supported is itself a finding — report it,
   don't silently skip it.

### Step 4 — Gotcha fix verification (Layer 4)

For each entry in `gotchas[]`:

1. From `symptom` + `cause`, write the minimal "before" snippet expected to reproduce the symptom. **This is one of two places this skill writes code that isn't lifted verbatim from the article** — say so plainly in the report and show the snippet in full, since Kelly needs to check this code is a fair reproduction, not just the result.
2. Run it. Confirm what actually happens.
3. Apply exactly the change described in `fix`. Run that.
4. **If `fix` offers several options, apply each one separately and report each.**
   A fix with three bullets is three "after" runs, not one — the reader is being
   told any of them solves the problem, and a bullet that doesn't is invisible
   until it is run on its own. Say which bullet each "after" snippet implements.
   If an option genuinely cannot be applied to this particular before-snippet,
   say that instead of silently dropping it.
5. **Label the "after" code's provenance as carefully as the "before" code's.**
   An "after" is frequently newly written even when the "before" came verbatim
   from the article — a fix stated in prose has no snippet to lift, and stitching
   two article slices together is still assembly. Show it in full whenever it is
   not a single verbatim slice, and say which lines came from where.
6. Report all of it: the "before" snippet, its actual behavior, each "after" snippet, its actual behavior.

## Known pitfalls (from prior runs — do not repeat these)

- **A render-count assertion is easy to get subtly wrong.** Log the value at each render rather than incrementing a counter across separate closures — a counter-based check produced a false "batching didn't happen" result once on a claim that was actually correct. If a result contradicts the article, re-verify with a second, differently-built check before reporting it as a discrepancy.
- **Never hand-transcribe JSX/JS.** Extract and run the literal text (see Step 1.1).
- **A claim tested only inside a React event handler proves nothing about pre-batching behavior.** Handlers always batched, even before React 18. Test the exact location the claim names.
- **A legacy install one major version off still runs without error** — it just silently fails to prove anything about the version the article actually names. Confirm the legacy version matches what the article claims before trusting a clean run.
- **Writing the run's scripts from scratch is the point, not overhead.** Copying a previous run's script and editing it is how a subtly wrong setup propagates across articles.
- **`act()` erases the batching difference being measured.** From React 18 on,
  `act()` batches its own contents, so a comparison wrapped in it reports
  identical render counts on every version and proves nothing. Use real timers
  and real awaits, and read the render log rather than a counter.
- **A source not covering a claim doesn't mean the claim is unsupported.** Check it against every fetched source before reporting an absence — a batching claim was once flagged as unsupported by the first source in the list, when the fourth source (titled "Automatic batching") covered it plainly. Position in the list carries no meaning.
- **Don't require the article's exact term to appear in the source.** A general statement in a source can cover a more specific case in the article without using the same words — "even if its event handler's code is asynchronous" already covers an `await` example. Requiring a literal keyword match produces findings that aren't real gaps.
- **A null result and a broken harness produce the same output.** Verifying "this
  approach does not help" by measuring it and getting no difference proves
  nothing on its own, because a harness that cannot detect any difference returns
  exactly that. Every negative claim needs a positive control in the same run —
  a case the harness _should_ show a difference on. Verifying "capturing into a
  local before the await doesn't help" meant also running a ref-based version and
  seeing it come back with the newer value; without that second row, the first
  row was unreadable. The control row in a version comparison does the same job.
- **"Covered by a source" is not a two-way switch.** After the audit was widened
  to check every source, the pressure moved the other way: a claim with a loosely
  related passage somewhere in the set gets waved through as covered, and the
  fact that the article went a step further than any of them disappears into a
  footnote nobody reads. A claim whose supporting quote stops short of what the
  article actually says is 一部カバー, and it belongs in that count in the
  summary where it can be seen.
- **An "after" snippet is not automatically safer than a "before" snippet.** The
  one article error found so far was in a `fix`, not in a code block — a bullet
  that read plausibly and did nothing. Fixes stated in prose get assembled by
  this skill, which means the assembly is the thing under test as much as the
  result is. Show every assembled "after" in full.

## Never

- Edit anything under `content/knowledge-base/`.
- Write a verdict — "correct", "incorrect", "confirmed", "✅", "❌" — anywhere in the report. Claim and evidence, side by side, is the whole output.
- Grade an earlier dated section of the same report. Report what this run measured; leave the earlier section as written. See "Re-running a slug".
- Run `npm run article:push`, touch Contentful, or open a PR.
- Commit, or ask to commit, the `.mjs` scripts written during a run. They are scratch.
- Create a shared helper module under `verify/` without proposing it first and being told to. See the Environment section for why.
- Install a `verify/react-legacy-<N>/` without asking first and naming the version, or reinstall one that already exists.
- Overwrite a previous report for the same slug. If one exists at `verify/reports/$slug-verify.md`, append a dated run below it instead, or ask.
- Treat a Layer 1 mismatch as settled without the Known-pitfalls re-check.
- Report a negative claim as measured without a positive control alongside it.

## Report when done

Copy `verify/reports/_template.md` to `verify/reports/$slug-verify.md` and fill it in, in Japanese (gitignored — `_template.md` itself is the one tracked exception, per `verify/.gitignore`). Do not invent a different report shape. Print this checklist to chat with the measured values filled in — a bare "終わりました" is not a report.

**棚卸し(Step 0)**

- [ ] 検証可能なコード片: \_\_\_\_ 件
- [ ] frontmatterのフィールド内にあった検証可能な主張: \_\_\_\_ 件
- [ ] 判定不能とラベルした箇所: \_\_\_\_ 件 — 理由
- [ ] バージョン差分の主張: \_\_\_\_ 件
- [ ] 概念レベルの主張(Sourcesと照合すべきもの): \_\_\_\_ 件
- [ ] Sourcesのリンク: \_\_\_\_ 件
- [ ] gotchas: \_\_\_\_ 件

**層1 — 実行**

- [ ] 実行した件数 / 対象外だった件数(カテゴリ理由): \_\_\_\_ / \_\_\_\_
- [ ] 複数バージョンで実行した件数、使ったバージョン: \_\_\_\_ / \_\_\_\_
- [ ] 否定形の主張と、それに対照を置いた件数: \_\_\_\_ / \_\_\_\_
- [ ] Known pitfallsの再チェックを行った件数: \_\_\_\_
- [ ] 書いたスクリプト(`verify/*.mjs`、コミットしない): \_\_\_\_ 件

**層2 — 一次資料**

- [ ] fetchしたURL: \_\_\_\_ 件
- [ ] 「記載が無いこと」を根拠にした主張(消極的証拠として明示): \_\_\_\_ 件
- [ ] fetch失敗/内容不一致で要フラグにした件数: \_\_\_\_

**層3 — Sources監査**

- [ ] fetchしたリンク: \_\_\_\_ / `## Sources`内の総数 \_\_\_\_
- [ ] 全source集合と照合した概念レベルの主張: \_\_\_\_ 件
- [ ] 全面カバー \_\_\_\_ 件 / 一部カバー \_\_\_\_ 件 / 該当なし \_\_\_\_ 件
- [ ] 一部カバーとした主張(記事がsourceより踏み込んでいる箇所)を、行番号つきで列挙

**層4 — gotcha**

- [ ] 検証したgotcha: \_\_\_\_ / 総数 \_\_\_\_
- [ ] `fix`の選択肢を個別に適用した件数: \_\_\_\_ / 選択肢の総数 \_\_\_\_
- [ ] 「before」コードを新規に書いた件数(記事からの抜粋ではない): \_\_\_\_
- [ ] 「after」コードを新規に書いた/継ぎ合わせた件数: \_\_\_\_

## Then

Tell Kelly the report path and stop. Reading it, judging each claim, and deciding whether to edit the article are all her call — not part of this command.
