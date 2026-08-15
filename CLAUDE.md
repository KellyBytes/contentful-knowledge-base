# Kelly's Notes

Content platform for kellybytes.dev — a blog (`/posts`) and a knowledge base (`/kb`) of JavaScript / React / web-fundamentals articles aimed at technical interview prep. Next.js App Router + Contentful, deployed on Vercel.

Articles are authored as Markdown under `content/` and pushed to Contentful by scripts in `scripts/`. Contentful is a delivery target, not the source of truth. See `content/CLAUDE.md` for authoring rules and the article schema.

---

## Stack constraints

- **This project does not use TypeScript.** Do not create `.ts` or `.tsx` files. Do not add type annotations, interfaces, generics, or `as` casts anywhere. If a change seems to require TypeScript, say so and stop — do not migrate files.
- App code: `.jsx` for components and routes, `.js` for plain modules under `lib/`
- Node scripts under `scripts/`: `.mjs` (ESM, run directly by Node, no build step)
- Next 16 (App Router), React 19, Tailwind CSS v4, npm
- `@/` maps to the project root (see `jsconfig.json`)

---

## Commands

```bash
npm run dev
npm run build                        # run before claiming a fix works — no types, so the build is the only real check
npm run lint

npm run article:model                # refresh content/_reference/*.json
npm run article:pull                 # import Contentful entries into content/ (OVERWRITES local Markdown)
npm run article:push -- <path>
npm run article:push -- <path> --dry-run
```

Scripts get credentials via `--env-file=.env --env-file=.env.local` in the npm
script definition. Never read `.env*` directly and never print their values.
When adding a script, copy the same double `--env-file` flags — one file alone is missing half the variables.

---

## Layout

```
app/
  api/preview|exit-preview/     draft mode toggles
  api/search-index/             JSON feed for the client-side Fuse.js search
  kb/[category]/[slug]/         knowledge base articles
  posts/[slug]/                 blog posts
components/
  kb/ posts/ ui/ layout/
  Markdown.jsx                  KB body (Markdown text field)
  RichText.jsx                  blog body (Contentful Rich Text field)
lib/
  contentful/client.js          CDA client factory, preview-aware
  contentful/kb.js              article + category fetching (cached)
  contentful/posts.js           blog fetching (cached)
  kb/sort.js                    article ordering
  preview-routes.js             allowed preview destinations
  utils/safe-redirect.js        origin-comparison redirect guard
content/                        article Markdown, _reference lookups, authoring CLAUDE.md
scripts/                        .mjs sync scripts; shared helpers in scripts/lib/contentful.mjs
```

Two content types, two renderers, two pipelines. `article` (KB) has a **Markdown Text** body and is managed by the scripts. `post` (blog) has a **Rich Text** body and a required cover image asset — it is authored in the Contentful web app and the article scripts must not touch it.

---

## Data fetching (Delivery API)

Every read goes through a `fetchX` function wrapped in `unstable_cache` with a shared `REVALIDATE` from `@/lib/utils`. Follow that pattern exactly when adding one:

```js
const fetchThing = async slug => {
  /* client.getEntries(...) */
};
export const getThing = unstable_cache(fetchThing, ['kb-thing'], {
  revalidate: REVALIDATE,
});
```

- **Use a function declaration or define the wrapper below its dependencies.** `unstable_cache` wrappers assigned to `const` arrow functions throw a TDZ error if referenced above the declaration line.
- Cache keys are flat strings (`'kb-articles-by-category'`). Keep them unique — a duplicate silently serves the wrong data.
- Preview reads must bypass the cache. See `getArticle` in `lib/contentful/kb.js`: the cached path is a separate export and preview calls the raw fetcher.
- Article queries need `include: 2` to resolve `category`, `tag`, and `interviewQuestions`. Without it those come back as unresolved links.
- **Searching on a referenced entry's fields requires `fields.<ref>.sys.contentType.sys.id`.** It looks redundant when the reference is locked to one content type by validation, but the CDA does not read validations — without it the nested field path cannot be resolved. See `fetchArticlesByCategory` in `lib/contentful/kb.js`. Do not remove it.
- Reference search only works on single-entry links, one level deep. It cannot be used on `tag` (an array of links) — filter those client-side instead.

**The Delivery API omits `fields` for unpublished referenced entries.** A published article linking a draft category, tag, or interview question renders an empty section with no error anywhere. Always use optional chaining plus a fallback when reading through a reference, in addition to Contentful's own validation.

---

## Preview mode

`app/api/preview/route.js` calls `draftMode().enable()` and redirects to the requested path.

- **The preview secret check and `lib/utils/safe-redirect.js` are security fixes. Do not remove or "simplify" either during refactoring.** String-prefix path validation is not safe — backslash handling in the WHATWG URL spec lets open redirects through. Redirect targets must be validated by comparing origins.
- Allowed destinations live in `lib/preview-routes.js`.
- Routes with both `generateStaticParams` and `draftMode()` build as `●` (SSG), not `ƒ`. That is correct: public visitors get static HTML, draft-cookie requests render on demand. Do not "fix" it.

---

## Markdown rendering (KB bodies)

`components/Markdown.jsx` — `react-markdown` + `remark-gfm` + `rehype-highlight`, no custom `components` override. Styling comes from `@tailwindcss/typography`.

- Allowed: h2–h4, lists, tables, fenced code blocks, inline code, links, blockquotes
- Not available: raw HTML (not enabled), footnotes, math, images
- `h1` is reserved for the `title` field — never use `#` in a body
- **Every fenced code block must declare a language.** `rehype-highlight` leaves untagged blocks unhighlighted.

---

## Management API (scripts only)

`contentful-management` v12+. The default client is the **plain** client.

- Never use `client.getSpace()`, `space.getEnvironment()`, or `entry.update()`. Those belong to the legacy client and do not exist on the default one.
- Create it with `{ type: 'plain', defaults: { spaceId, environmentId } }`.
- Query params go inside `query`: `client.entry.getMany({ query: { content_type: 'article', limit: 100 } })`. Passing them at the top level is **silently ignored**.
- On update, spread the fetched entry so `sys.version` survives — it is the optimistic lock: `client.entry.update({ entryId }, { ...current, fields })`.
- A page is capped at 100 items regardless of `limit`. Use `getAllEntries()` from `scripts/lib/contentful.mjs` for anything that can exceed 100.
- **Never hardcode a locale.** Call `getDefaultLocale(client)`. A wrong locale key produces empty results with no error.
- The CMA does not expand links. References come back as `{ sys: { id } }` and must be resolved against entries you fetched separately.

---

## Known traps in this codebase

- **Module-level client instantiation.** Instantiating third-party SDK clients at module load time breaks Vercel builds — env vars are not injected yet. Instantiate inside the async function that uses it.
- **Effect dependency arrays capture inputs, not outputs.** Including state the effect itself produces causes an infinite loop.
- **React keys control identity.** Same-type siblings in the same tree position keep their state unless the key differs; a differing key forces unmount/remount.
- **Tailwind v4 only emits `@keyframes` when the matching utility class appears in markup.** An inline `style` animation reference without the class has no keyframe to point at.
- **Debug by the shape of the broken output.** What exactly is wrong usually names the culprit — e.g. items grouped correctly but sorted alphabetically points at a local sort function, not the API.

---

## Conventions

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`. Single line for straightforward changes. Security fixes and refactors go in separate commits — never mixed.
- ESLint via `eslint.config.mjs` (`eslint-config-next`). Run `npm run lint`.
- Comments, commit messages, and identifiers in English.

---

## Rules

- **Never publish an article to Contentful from a script.** Drafts only; publishing is manual. The one exception is `interviewQuestion` child entries, which the push script publishes — an unlinked question entry is invisible on the site, and leaving it as a draft breaks the parent article silently.
- Never modify an existing article body unless explicitly asked.
- `npm run article:pull` overwrites local Markdown. Confirm the working tree is clean before suggesting it.
- Do not add dependencies without asking. Script-only deps go in `devDependencies`.
