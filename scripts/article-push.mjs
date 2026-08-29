import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';
import { entryLink, getClient, getDefaultLocale } from './lib/contentful.mjs';

const CONTENT_TYPE = 'article';
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SYMBOL_MAX = 256;
const TAG_MIN = 1;
const TAG_MAX = 4;
const QUESTION_MAX = 5;
const SHORT_ANSWER_MAX = 600;
const QUESTION_TYPE = 'interviewQuestion';

const GOTCHA_TYPE = 'gotcha';
const GOTCHA_MAX = 6;
const SYMPTOM_MIN = 10;
const SYMPTOM_MAX = 120;
const ERROR_MESSAGE_MAX = 200;
const CAUSE_MAX = 600;
const FIX_MAX = 900;
/** A gotcha allows three tags; an article allows four (TAG_MAX). Not the same limit. */
const GOTCHA_TAG_MAX = 3;
/** Every article that can link a gotcha, for the cross-article consistency check. */
const ARTICLE_ROOT = 'content/knowledge-base';
/** The gotcha fields the frontmatter owns, in the order the report should list them. */
const GOTCHA_FIELDS = [
  'symptom',
  'slug',
  'errorMessage',
  'cause',
  'fix',
  'category',
  'tag',
];

const PREREQUISITE_MAX = 3;
const RELATED_MAX = 4;
/** Article link arrays resolved from slugs in the frontmatter, in report order. */
const ARTICLE_LINK_FIELDS = ['prerequisites', 'related'];
/**
 * Pipeline bookkeeping, not content type fields: `contentType` is the marker
 * validate() checks, and `contentfulEntryId` is how the script finds the entry.
 * Both belong in the frontmatter, so neither is an unknown key.
 */
const FRONTMATTER_EXTRAS = ['contentType', 'contentfulEntryId'];

/** Optional fields sent only when the frontmatter carries them. */
const MANAGED_OPTIONAL = ['order', 'versionScope', 'readingTime'];
/** Derived on every push, so it is never worth diffing. */
const DERIVED = 'lastReviewed';
/**
 * Child links get their own report, never the generic field diff. A dry run
 * never syncs children, so a pending one has no link yet and a plain diff would
 * show it as a removal.
 */
const CHILD_FIELDS = ['interviewQuestions', 'gotchas'];
/** Cut long scalars in the dry-run report at this width. */
const DISPLAY_MAX = 80;
/** Show the actual body lines only when the change is small enough to read. */
const BODY_DETAIL_MAX = 40;
/** Edge whitespace is invisible, and it is exactly what causes body drift. */
const WS_GLYPH = { ' ': '·', '\t': '→' };

/** An entry is published and current when publishedVersion is one behind version. */
const isUpToDate = entry =>
  entry.sys.publishedVersion != null &&
  entry.sys.publishedVersion === entry.sys.version - 1;

/**
 * Create or update each interview question, then publish it.
 * Mutates `list` to record new ids so the caller can write them back.
 *
 * Publishing children here is safe: a question entry that no published article
 * links to is invisible on the site. Leaving them as drafts is what breaks —
 * the Delivery API omits `fields` for unpublished references, so the article
 * would render an empty section with no error anywhere.
 */
async function syncQuestions(client, locale, list) {
  const links = [];

  for (const q of list) {
    const fields = {
      question: { [locale]: q.question },
      shortAnswer: { [locale]: q.shortAnswer },
    };

    let entry;

    if (q.id) {
      const current = await client.entry.get({ entryId: q.id });
      entry = await client.entry.update(
        { entryId: q.id },
        { ...current, fields },
      );
    } else {
      entry = await client.entry.create(
        { contentTypeId: QUESTION_TYPE },
        { fields },
      );
      q.id = entry.sys.id; // recorded back into frontmatter by the caller
      console.log(`  created question: ${entry.sys.id}`);
    }

    if (!isUpToDate(entry)) {
      entry = await client.entry.publish({ entryId: entry.sys.id }, entry);
    }

    links.push(entryLink(entry.sys.id));
  }

  return links;
}

/** A blank scalar parses as null, which is not a value worth sending. */
const hasText = value => typeof value === 'string' && value.trim() !== '';

/**
 * Look an existing gotcha up by slug. Used only to refuse a duplicate before
 * creating one — never to resolve a gotcha that already carries an id, because
 * a near match would overwrite an unrelated entry.
 */
async function findGotchaBySlug(client, slug) {
  const page = await client.entry.getMany({
    query: { content_type: GOTCHA_TYPE, 'fields.slug': slug, limit: 1 },
  });
  return page.items[0] ?? null;
}

/** The gotcha payload, with the empty optionals left out rather than nulled. */
function gotchaFields(g, locale, categories, tags) {
  const fields = {
    symptom: { [locale]: g.symptom },
    slug: { [locale]: g.slug },
    cause: { [locale]: g.cause },
    fix: { [locale]: g.fix },
    category: { [locale]: entryLink(categories[g.category]) },
  };

  // `errorMessage:` with no value parses as null. Leave the key out of the
  // payload rather than sending { [locale]: null }.
  if (hasText(g.errorMessage)) {
    fields.errorMessage = { [locale]: g.errorMessage };
  }

  if (Array.isArray(g.tag) && g.tag.length > 0) {
    fields.tag = { [locale]: g.tag.map(name => entryLink(tags[name])) };
  }

  return fields;
}

/**
 * Create or update each gotcha, then publish it.
 * Mutates `list` to record new ids so the caller can write them back.
 *
 * Unlike a question, a gotcha is shared: several articles link the same entry,
 * so writing one changes every article that references it. Two guards make that
 * safe, and neither may be dropped — the caller runs the cross-article
 * consistency check before this is reached, and the create path below refuses a
 * slug that already exists in the space.
 */
async function syncGotchas(client, locale, list, categories, tags) {
  const links = [];

  for (const g of list) {
    const fields = gotchaFields(g, locale, categories, tags);

    let entry;

    if (g.id) {
      const current = await client.entry.get({ entryId: g.id });
      entry = await client.entry.update(
        { entryId: g.id },
        { ...current, fields },
      );
    } else {
      const existing = await findGotchaBySlug(client, g.slug);
      if (existing) {
        throw new Error(
          `gotcha slug "${g.slug}" already exists in Contentful (${existing.sys.id}).\n` +
            '  Link the existing entry instead of creating a new one: add\n' +
            `  \`id: ${existing.sys.id}\` to the gotcha block, and copy the block\n` +
            '  verbatim from the article that already has it.',
        );
      }

      entry = await client.entry.create(
        { contentTypeId: GOTCHA_TYPE },
        { fields },
      );
      g.id = entry.sys.id; // recorded back into frontmatter by the caller
      console.log(`  created gotcha: ${entry.sys.id} (${g.slug})`);
    }

    if (!isUpToDate(entry)) {
      entry = await client.entry.publish({ entryId: entry.sys.id }, entry);
    }

    links.push(entryLink(entry.sys.id));
  }

  return links;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

/**
 * The local date, not UTC. `toISOString()` is always UTC, so an evening push
 * anywhere west of Greenwich stamps tomorrow onto lastReviewed. The date that
 * belongs on a review is the one on the wall behind the person doing it.
 */
const today = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

/** Report paths the way they are typed on the command line, on every platform. */
const posix = file => file.split(path.sep).join('/');

/**
 * Walk for .md files by hand. `fs.glob` and readdir's `recursive` option are
 * both newer than the Node this has to run on, and a dependency is not worth it.
 */
async function findMarkdownFiles(dir) {
  const found = [];

  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await findMarkdownFiles(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) found.push(full);
  }

  return found;
}

/**
 * Compare the parsed values, not the YAML. Two copies written with different
 * scalar styles can still mean the same thing - and, more importantly, two that
 * look alike can parse differently, which is the case that matters.
 */
const normalizeGotcha = g => ({
  symptom: g.symptom ?? null,
  slug: g.slug ?? null,
  // An omitted key and an empty key both mean "no error message".
  errorMessage: hasText(g.errorMessage) ? g.errorMessage : null,
  cause: g.cause ?? null,
  fix: g.fix ?? null,
  category: g.category ?? null,
  // Order matters: it is sent to Contentful as written.
  tag: Array.isArray(g.tag) ? g.tag : [],
});

const describeValue = (key, value) => {
  if (value == null) return '(missing)';
  if (key === 'tag') return `[${value.join(', ')}]`;
  return JSON.stringify(truncate(value));
};

/**
 * Show two copies of the same field so the difference is actually visible.
 *
 * `truncate` collapses whitespace, which is fatal here: the most common way for
 * two copies to drift is a folded scalar where the other is literal, and that
 * difference is nothing but line breaks. So spell the breaks out, and cut the
 * window around the first character that differs rather than at the start -
 * otherwise both sides show the same opening words and say nothing.
 */
function contrast(mine, theirs) {
  const a = String(mine);
  const b = String(theirs);

  let at = 0;
  while (at < a.length && at < b.length && a[at] === b[at]) at += 1;

  const start = Math.max(0, at - Math.floor(DISPLAY_MAX / 4));

  const window = text => {
    // Only the breaks: glyphing every space would drown the line in dots.
    const shown = text
      .slice(start, start + DISPLAY_MAX)
      .replace(/\n/g, '⏎')
      .replace(/\t/g, WS_GLYPH['\t']);
    const head = start > 0 ? '…' : '';
    const tail = start + DISPLAY_MAX < text.length ? '…' : '';
    return `${head}${shown}${tail}`;
  };

  return [window(a), window(b)];
}

/**
 * One pass over every article. The gotcha consistency check and the
 * prerequisites / related resolution both need every article's frontmatter,
 * and walking the tree twice for that would be waste.
 *
 * `bySlug` includes the article being pushed, because other articles may link
 * it. `gotchaById` deliberately does not: the pushed file is the copy being
 * compared, not one of the peers to compare it against.
 */
async function readArticleIndex(filePath) {
  const self = path.resolve(filePath);
  const bySlug = new Map();
  const gotchaById = new Map();
  const duplicateSlugs = [];

  for (const file of await findMarkdownFiles(ARTICLE_ROOT)) {
    const { data } = matter(await fs.readFile(file, 'utf8'));
    const isSelf = path.resolve(file) === self;

    if (data.slug) {
      const seen = bySlug.get(data.slug);
      if (seen) {
        duplicateSlugs.push({
          slug: data.slug,
          files: [seen.file, posix(file)],
        });
      }
      bySlug.set(data.slug, {
        entryId: data.contentfulEntryId ?? null,
        file: posix(file),
      });
    }

    if (isSelf) continue;

    for (const block of Array.isArray(data.gotchas) ? data.gotchas : []) {
      if (!block?.id) continue;
      if (!gotchaById.has(block.id)) gotchaById.set(block.id, []);
      gotchaById.get(block.id).push({ file: posix(file), block });
    }
  }

  return { bySlug, gotchaById, duplicateSlugs };
}

/**
 * Compare this article's copy of each shared gotcha against every other article
 * that links the same id.
 *
 * A gotcha entry is shared, so writing it changes every article that references
 * it. When the copies disagree, which one is correct is a human decision -
 * abort without writing rather than picking one. Returns id -> the other files
 * that link it, so the dry-run report can show the blast radius even when the
 * copies agree.
 */
function collectSharedGotchas(filePath, gotchas, byId) {
  const linked = gotchas.filter(g => g.id);
  if (linked.length === 0) return new Map();

  const alsoLinkedBy = new Map();
  const problems = [];

  for (const g of linked) {
    const others = byId.get(g.id) ?? [];
    alsoLinkedBy.set(
      g.id,
      others.map(other => other.file),
    );

    const mine = normalizeGotcha(g);

    for (const other of others) {
      const theirs = normalizeGotcha(other.block);
      const differing = GOTCHA_FIELDS.filter(
        key => JSON.stringify(mine[key]) !== JSON.stringify(theirs[key]),
      );

      if (differing.length > 0) {
        problems.push({
          id: g.id,
          slug: g.slug,
          file: other.file,
          differing,
          mine,
          theirs,
        });
      }
    }
  }

  if (problems.length > 0) {
    const lines = [
      `${posix(filePath)}`,
      '  Shared gotchas must be identical in every article that links them.',
    ];

    for (const p of problems) {
      lines.push(`\n  gotcha ${p.id} (${p.slug}) disagrees with:`);
      lines.push(`    ${p.file}`);

      for (const key of p.differing) {
        // A missing side, or a tag list, is readable as-is. Two present strings
        // need to be lined up against each other to see where they part.
        if (key === 'tag' || p.mine[key] == null || p.theirs[key] == null) {
          lines.push(
            `      ${key}: ${describeValue(key, p.mine[key])} vs ${describeValue(key, p.theirs[key])}`,
          );
          continue;
        }

        const [here, there] = contrast(p.mine[key], p.theirs[key]);
        lines.push(`      ${key}:`);
        lines.push(`        this file  ${here}`);
        lines.push(`        other      ${there}`);
      }
    }

    lines.push(
      '\n  Which copy is correct is a human decision. Fix the frontmatter so the',
      '  blocks match, then push again. Nothing was written.',
    );

    throw new Error(lines.join('\n'));
  }

  return alsoLinkedBy;
}

/**
 * Name the frontmatter keys that go nowhere.
 *
 * The known set comes from the exported content model rather than a list in
 * here, so re-exporting the model is all it takes to teach the script about a
 * new field. A warning, not an error: a stray key is worth knowing about, but
 * it cannot break a push, and blocking on one would help nobody.
 */
function warnUnknownKeys(filePath, fm, contentModel) {
  const article = contentModel.find(type => type.id === CONTENT_TYPE);
  if (!article) return;

  const known = new Set([
    ...article.fields.map(field => field.id),
    ...FRONTMATTER_EXTRAS,
  ]);
  const unknown = Object.keys(fm).filter(key => !known.has(key));
  if (unknown.length === 0) return;

  // stderr, so a loop over every article can collect these on their own.
  console.warn(
    `warning: ${posix(filePath)}: unknown frontmatter key(s): ${unknown.join(', ')}`,
  );
  console.warn(
    `warning:   not a field on the \`${CONTENT_TYPE}\` content type — not sent, and nothing reads it.`,
  );
}

/**
 * prerequisites and related are article slugs in the frontmatter and entry
 * links in Contentful. Everything needed to resolve them is already on disk,
 * so a bad reference is caught here rather than by a rejected write.
 */
function validateArticleLinks(fm, index) {
  const errors = [];
  const limits = {
    prerequisites: PREREQUISITE_MAX,
    related: RELATED_MAX,
  };

  // Two files claiming one slug makes every reference to it ambiguous.
  for (const { slug, files } of index.duplicateSlugs) {
    errors.push(
      `slug "${slug}" is used by two articles: ${files.join(' and ')}.\n` +
        '    A reference to it would silently resolve to one of them.',
    );
  }

  for (const key of ARTICLE_LINK_FIELDS) {
    const slugs = Array.isArray(fm[key]) ? fm[key] : [];

    if (slugs.length > limits[key]) {
      errors.push(`${key} has ${slugs.length} entries (max ${limits[key]})`);
    }
    if (new Set(slugs).size !== slugs.length) {
      errors.push(`${key} contains duplicates`);
    }

    slugs.forEach((slug, i) => {
      const at = `${key}[${i}]`;

      if (slug === fm.slug) {
        errors.push(
          `${at}: "${slug}" is this article — an article cannot reference itself`,
        );
        return;
      }

      const target = index.bySlug.get(slug);
      if (!target) {
        errors.push(
          `${at}: unknown article slug "${slug}" — no file under ${ARTICLE_ROOT}/ has it`,
        );
        return;
      }

      if (!target.entryId) {
        errors.push(
          `${at}: "${slug}" has no contentfulEntryId yet.\n` +
            `    Push ${target.file} first.`,
        );
      }
    });
  }

  return errors;
}

/** Frontmatter slugs to entry links. Only safe once validate() has passed. */
const linkArticles = (slugs, bySlug) =>
  (Array.isArray(slugs) ? slugs : []).map(slug =>
    entryLink(bySlug.get(slug).entryId),
  );

// Catch everything Contentful would reject, before spending a round trip.
// Collect all problems so one run reports them all instead of one at a time.
function validate(fm, body, categories, tags, index) {
  const errors = [];

  if (fm.contentType !== CONTENT_TYPE) {
    errors.push(
      `contentType must be "${CONTENT_TYPE}" (got "${fm.contentType ?? ''}")`,
    );
  }

  if (!fm.title) errors.push('title is required');
  else if (fm.title.length > SYMBOL_MAX) {
    errors.push(`title is ${fm.title.length} chars (max ${SYMBOL_MAX})`);
  }

  if (!fm.slug) errors.push('slug is required');
  else if (!SLUG_PATTERN.test(fm.slug)) {
    errors.push(`slug "${fm.slug}" must be lowercase kebab-case`);
  }

  if (!fm.summary) errors.push('summary is required');
  else if (fm.summary.length > SYMBOL_MAX) {
    errors.push(`summary is ${fm.summary.length} chars (max ${SYMBOL_MAX})`);
  }

  if (fm.versionScope != null) {
    const value = String(fm.versionScope).trim();
    if (value.length > SYMBOL_MAX) {
      errors.push(`versionScope is ${value.length} chars (max ${SYMBOL_MAX})`);
    }
  }

  if (!DIFFICULTIES.includes(fm.difficulty)) {
    errors.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  }

  if (!fm.category) errors.push('category is required');
  else if (!categories[fm.category]) {
    errors.push(
      `unknown category "${fm.category}".\n    Known: ${Object.keys(categories).join(', ')}`,
    );
  }

  const tagList = Array.isArray(fm.tag) ? fm.tag : [];
  if (tagList.length < TAG_MIN)
    errors.push(`tag needs at least ${TAG_MIN} entry`);
  if (tagList.length > TAG_MAX) {
    errors.push(`tag has ${tagList.length} entries (max ${TAG_MAX})`);
  }
  if (new Set(tagList).size !== tagList.length)
    errors.push('tag contains duplicates');

  const unknownTags = tagList.filter(name => !tags[name]);
  if (unknownTags.length > 0) {
    errors.push(
      `unknown tag(s): ${unknownTags.join(', ')}.\n    Known: ${Object.keys(tags).join(', ')}`,
    );
  }

  if (fm.order != null && !Number.isInteger(fm.order)) {
    errors.push(`order must be an integer (got ${JSON.stringify(fm.order)})`);
  }

  if (fm.readingTime != null && !Number.isInteger(fm.readingTime)) {
    errors.push(
      `readingTime must be an integer (got ${JSON.stringify(fm.readingTime)})`,
    );
  }

  errors.push(...validateArticleLinks(fm, index));

  if (!body.trim()) errors.push('body is empty');

  const questions = Array.isArray(fm.interviewQuestions)
    ? fm.interviewQuestions
    : [];
  if (questions.length > QUESTION_MAX) {
    errors.push(
      `interviewQuestions has ${questions.length} items (max ${QUESTION_MAX})`,
    );
  }

  questions.forEach((q, i) => {
    const at = `interviewQuestions[${i}]`;
    if (!q.question) errors.push(`${at}.question is required`);
    if (!q.shortAnswer) errors.push(`${at}.shortAnswer is required`);
    else if (q.shortAnswer.length > SHORT_ANSWER_MAX) {
      errors.push(
        `${at}.shortAnswer is ${q.shortAnswer.length} chars (max ${SHORT_ANSWER_MAX})`,
      );
    }
  });

  errors.push(...validateGotchas(fm, categories, tags));

  return errors;
}

/**
 * Gotcha limits are its own, not the article's. In particular a gotcha allows
 * three tags where an article allows four - hence GOTCHA_TAG_MAX, not TAG_MAX.
 */
function validateGotchas(fm, categories, tags) {
  const errors = [];
  const gotchas = Array.isArray(fm.gotchas) ? fm.gotchas : [];

  if (gotchas.length > GOTCHA_MAX) {
    errors.push(`gotchas has ${gotchas.length} items (max ${GOTCHA_MAX})`);
  }

  const seenSlugs = new Set();

  gotchas.forEach((g, i) => {
    const at = `gotchas[${i}]`;

    if (!hasText(g.symptom)) errors.push(`${at}.symptom is required`);
    else if (
      g.symptom.length < SYMPTOM_MIN ||
      g.symptom.length > SYMPTOM_MAX
    ) {
      errors.push(
        `${at}.symptom is ${g.symptom.length} chars (${SYMPTOM_MIN}-${SYMPTOM_MAX})`,
      );
    }

    if (!hasText(g.slug)) errors.push(`${at}.slug is required`);
    else {
      if (!SLUG_PATTERN.test(g.slug)) {
        errors.push(`${at}.slug "${g.slug}" must be lowercase kebab-case`);
      }
      // Two blocks in one file sharing a slug is always a mistake: the slug is
      // unique across the space, so they cannot both be right.
      if (seenSlugs.has(g.slug)) {
        errors.push(`${at}.slug "${g.slug}" is used twice in this file`);
      }
      seenSlugs.add(g.slug);
    }

    if (!hasText(g.cause)) errors.push(`${at}.cause is required`);
    else if (g.cause.length > CAUSE_MAX) {
      errors.push(`${at}.cause is ${g.cause.length} chars (max ${CAUSE_MAX})`);
    }

    if (!hasText(g.fix)) errors.push(`${at}.fix is required`);
    else if (g.fix.length > FIX_MAX) {
      errors.push(`${at}.fix is ${g.fix.length} chars (max ${FIX_MAX})`);
    }

    // Optional, but a value that is present still has to fit.
    if (hasText(g.errorMessage) && g.errorMessage.length > ERROR_MESSAGE_MAX) {
      errors.push(
        `${at}.errorMessage is ${g.errorMessage.length} chars (max ${ERROR_MESSAGE_MAX})`,
      );
    }

    if (!g.category) errors.push(`${at}.category is required`);
    else if (!categories[g.category]) {
      errors.push(
        `${at}: unknown category "${g.category}".\n    Known: ${Object.keys(categories).join(', ')}`,
      );
    }

    const tagList = Array.isArray(g.tag) ? g.tag : [];
    if (tagList.length > GOTCHA_TAG_MAX) {
      errors.push(
        `${at}.tag has ${tagList.length} entries (max ${GOTCHA_TAG_MAX})`,
      );
    }
    if (new Set(tagList).size !== tagList.length) {
      errors.push(`${at}.tag contains duplicates`);
    }

    const unknownTags = tagList.filter(name => !tags[name]);
    if (unknownTags.length > 0) {
      errors.push(
        `${at}: unknown tag(s): ${unknownTags.join(', ')}.\n    Known: ${Object.keys(tags).join(', ')}`,
      );
    }
  });

  return errors;
}

/**
 * Contentful drops an empty array field, so undefined and [] are the same.
 * Without this, a field we send as [] reads back as undefined and every push
 * looks like a change - which also means lastReviewed is bumped every time.
 */
const forCompare = value =>
  Array.isArray(value) && value.length === 0 ? undefined : value;

/** Compare only the fields we manage; lastReviewed is derived, so ignore it. */
function hasChanges(currentFields, nextFields, locale) {
  return Object.keys(nextFields).some(key => {
    if (key === DERIVED) return false;
    return (
      JSON.stringify(forCompare(currentFields[key]?.[locale])) !==
      JSON.stringify(forCompare(nextFields[key][locale]))
    );
  });
}

/** name -> id lookups come from disk; the report needs them the other way round. */
const invert = map =>
  Object.fromEntries(Object.entries(map).map(([name, id]) => [id, name]));

const truncate = value => {
  const text = String(value).replace(/\s+/g, ' ');
  return text.length > DISPLAY_MAX ? `${text.slice(0, DISPLAY_MAX)}…` : text;
};

/** Recover the differing lines from a built LCS table, in document order. */
function backtrack(table, a, b) {
  const changed = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      changed.push(['-', a[i]]);
      i += 1;
    } else {
      changed.push(['+', b[j]]);
      j += 1;
    }
  }
  while (i < a.length) changed.push(['-', a[(i += 1) - 1]]);
  while (j < b.length) changed.push(['+', b[(j += 1) - 1]]);

  return changed;
}

/**
 * Line-level LCS, so the body summary can be trusted. A positional compare
 * would call every line after a single insertion changed.
 */
function diffLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint32Array(b.length + 1),
  );

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const common = table[0][0];
  const added = b.length - common;
  const removed = a.length - common;

  return {
    oldTotal: a.length,
    newTotal: b.length,
    added,
    removed,
    // Building the table already cost O(n*m); walking it back is O(n+m), so
    // recovering the lines is effectively free even when nothing prints them.
    changed: backtrack(table, a, b),
  };
}

/** Blank lines and edge whitespace are invisible, so spell them out. */
function visualizeLine(line) {
  const show = ws => [...ws].map(ch => WS_GLYPH[ch] ?? ch).join('');

  if (line === '') return '(blank line)';
  if (line.trim() === '') return `(blank line: ${show(line)})`;

  const [, lead, core, trail] = line.match(/^(\s*)(.*?)(\s*)$/);
  return `${show(lead)}${core}${show(trail)}`;
}

/**
 * Blank lines match between any two documents, so a shared blank proves nothing.
 * Only real content decides whether the two bodies are related at all.
 */
function sharesAnyLine(before, after) {
  const seen = new Set(before.split('\n').filter(line => line.trim() !== ''));
  return after.split('\n').some(line => line.trim() !== '' && seen.has(line));
}

/**
 * A line count alone cannot explain why an article looks changed on every push.
 * Name the two causes that are easiest to miss - mismatched line endings, and a
 * difference that is only whitespace - before listing the lines themselves.
 */
function bodyDetails(before, after, fullDiff) {
  const d = diffLines(before, after);
  const details = [
    `${d.oldTotal} lines → ${d.newTotal} lines (+${d.added} −${d.removed})`,
  ];

  // A mismatch here leaves an invisible \r on every local line, so nothing
  // lines up and the list of changed lines would be the whole body twice.
  const local = after.includes('\r\n') ? 'CRLF' : 'LF';
  const remote = before.includes('\r\n') ? 'CRLF' : 'LF';

  if (local !== remote) {
    details.push(`line endings differ: local ${local}, Contentful ${remote}`);
    return details;
  }

  // Nothing survived. Printing every line would say nothing either.
  if (!sharesAnyLine(before, after)) {
    details.push('no lines in common');
    return details;
  }

  if (before.trim() === after.trim()) {
    details.push(
      'whitespace only — the text matches once both ends are trimmed',
    );
  }

  // BODY_DETAIL_MAX and --full-diff are both display policy, so the cut lives
  // here rather than in diffLines.
  if (!fullDiff && d.changed.length > BODY_DETAIL_MAX) {
    details.push(
      `${d.changed.length} changed lines omitted — rerun with --full-diff to see them`,
    );
    return details;
  }

  for (const [sign, line] of d.changed) {
    details.push(`${sign} ${truncate(visualizeLine(line))}`);
  }

  return details;
}

/** Links are unreadable as ids, so resolve them back to the names in frontmatter. */
function formatField(key, value, lookups) {
  if (value == null) return '(empty)';

  if (key === 'category') {
    return lookups.categoryNameById[value.sys.id] ?? value.sys.id;
  }
  if (key === 'tag') {
    const names = value.map(
      link => lookups.tagNameById[link.sys.id] ?? link.sys.id,
    );
    return `[${names.join(', ')}]`;
  }
  if (ARTICLE_LINK_FIELDS.includes(key)) {
    // An id Contentful holds for an article that is not in the tree stays an
    // id. That is the honest rendering - there is no slug to show.
    const slugs = value.map(
      link => lookups.articleSlugById[link.sys.id] ?? link.sys.id,
    );
    return `[${slugs.join(', ')}]`;
  }
  return truncate(value);
}

/** Link fields resolve to names; text fields get cut where they differ. */
const isLinkField = key =>
  key === 'category' || key === 'tag' || ARTICLE_LINK_FIELDS.includes(key);

/**
 * The two sides of one changed field.
 *
 * `truncate` collapses whitespace and always cuts at the front, so two long
 * values that differ only near the end render as the same string. Where both
 * sides are text, window them around the first character that differs instead.
 */
function diffPair(key, before, after, lookups) {
  if (isLinkField(key) || typeof before !== 'string' || typeof after !== 'string') {
    return [
      before === undefined ? null : `- ${formatField(key, before, lookups)}`,
      after === undefined
        ? '+ (removed)'
        : `+ ${formatField(key, after, lookups)}`,
    ];
  }

  const [a, b] = contrast(before, after);
  return [`- ${a}`, `+ ${b}`];
}

const label = (kind, key) => `  ${kind.padEnd(9)}  ${key}`;
const detail = text => `               ${text}`;

/**
 * Questions are reported as counts, not as a diff. A dry run never calls
 * syncQuestions, so links exist only for questions that already have an id —
 * diffing that array would show pending ones as removals.
 */
function reportQuestions(questions) {
  const linked = questions.filter(q => q.id).length;
  const pending = questions.length - linked;
  const suffix = pending > 0 ? `, ${pending} would be created` : '';
  console.log(`\n  interviewQuestions: ${linked} linked${suffix}`);
}

const gotchaLabel = (kind, key) => `      ${kind.padEnd(9)}  ${key}`;
const gotchaDetail = text => `                   ${text}`;

/**
 * Gotchas get a per-entry report rather than a count, because writing one
 * changes every article that links it. The articles sharing each entry are
 * listed even when the copies agree - that is the blast radius of the push,
 * and it is the thing worth seeing before a write.
 */
async function reportGotchas(client, locale, gotchas, ctx) {
  const linked = gotchas.filter(g => g.id).length;
  const pending = gotchas.length - linked;
  const suffix = pending > 0 ? `, ${pending} would be created` : '';
  console.log(`\n  gotchas: ${linked} linked${suffix}`);

  for (const g of gotchas) {
    const where = g.id ? g.id : 'would create';
    console.log(`\n    ${g.slug} (${where})`);

    const others = ctx.alsoLinkedBy.get(g.id) ?? [];
    if (others.length > 0) {
      console.log(`      also linked by: ${others.join(', ')}`);
    }

    if (!g.id) {
      // The same lookup the real push runs before creating. Read-only.
      const existing = await findGotchaBySlug(client, g.slug);
      console.log(
        existing
          ? `      slug already exists in Contentful (${existing.sys.id}) — link it instead`
          : '      no existing gotcha with this slug',
      );
      continue;
    }

    let current;
    try {
      current = await client.entry.get({ entryId: g.id });
    } catch (err) {
      if (isNotFound(err)) {
        throw new Error(
          `gotcha id ${g.id} (${g.slug}) does not exist in Contentful.\n` +
            `  ${posix(ctx.filePath)}\n` +
            '  Fix or remove the id in the frontmatter.',
        );
      }
      throw err;
    }

    const next = gotchaFields(g, locale, ctx.categories, ctx.tags);
    const unchanged = [];
    let changed = 0;

    for (const key of GOTCHA_FIELDS) {
      // The label follows the meaning; the detail lines follow what is sent.
      const rawBefore = current.fields[key]?.[locale];
      const rawAfter = next[key]?.[locale];
      const before = forCompare(rawBefore);
      const after = forCompare(rawAfter);

      if (JSON.stringify(before) === JSON.stringify(after)) {
        if (before !== undefined) unchanged.push(key);
        continue;
      }

      changed += 1;
      console.log(gotchaLabel(before === undefined ? 'new' : 'changed', key));

      for (const line of diffPair(key, rawBefore, rawAfter, ctx.lookups)) {
        if (line !== null) console.log(gotchaDetail(line));
      }
    }

    if (changed === 0) console.log('      unchanged');
    else if (unchanged.length > 0) {
      console.log(gotchaLabel('unchanged', unchanged.join(', ')));
    }
  }
}

/** Anything push does not send survives the update, because the fields merge. */
function reportUntouched(current, fields, locale) {
  const kept = MANAGED_OPTIONAL.filter(
    key =>
      fields[key] === undefined && current.fields[key]?.[locale] !== undefined,
  );
  for (const key of kept) {
    console.log(`  ${key}: not sent, existing value kept`);
  }

  const preserved = Object.keys(current.fields).filter(
    key => fields[key] === undefined && !MANAGED_OPTIONAL.includes(key),
  );
  if (preserved.length > 0) {
    console.log(`  preserved (not sent): ${preserved.join(', ')}`);
  }
}

function reportUpdate(current, fields, locale, lookups, fullDiff) {
  const unchanged = [];
  const changes = [];

  for (const key of Object.keys(fields)) {
    if (key === DERIVED || CHILD_FIELDS.includes(key)) continue;

    // The label follows the meaning; the detail lines follow what is sent.
    const rawBefore = current.fields[key]?.[locale];
    const rawAfter = fields[key][locale];
    const before = forCompare(rawBefore);
    const after = forCompare(rawAfter);

    if (JSON.stringify(before) === JSON.stringify(after)) {
      unchanged.push(key);
      continue;
    }

    if (key === 'body') {
      changes.push([
        'changed',
        key,
        bodyDetails(rawBefore ?? '', rawAfter, fullDiff),
      ]);
      continue;
    }

    changes.push([
      before === undefined ? 'new' : 'changed',
      key,
      diffPair(key, rawBefore, rawAfter, lookups).filter(line => line !== null),
    ]);
  }

  if (unchanged.length > 0) {
    console.log(label('unchanged', unchanged.join(', ')));
  }
  for (const [kind, key, details] of changes) {
    console.log(label(kind, key));
    for (const line of details) console.log(detail(line));
  }
  // The stored date is when the article was last pushed, which is the thing you
  // need to know to tell whether a local edit came after it.
  const reviewed = current.fields[DERIVED]?.[locale];
  const note = reviewed ? `; currently ${String(reviewed).slice(0, 10)}` : '';
  console.log(label('skipped', `${DERIVED} (derived on push${note})`));
}

function reportCreate(fields, locale, lookups) {
  for (const key of Object.keys(fields)) {
    if (CHILD_FIELDS.includes(key)) continue;

    const value = fields[key][locale];
    const pad = key.padEnd(14);

    if (key === 'body') {
      console.log(`  ${pad}${value.split('\n').length} lines`);
    } else if (key === DERIVED) {
      console.log(`  ${pad}${value} (derived)`);
    } else {
      console.log(`  ${pad}${formatField(key, value, lookups)}`);
    }
  }
}

const isNotFound = err =>
  err?.name === 'NotFound' ||
  err?.sys?.id === 'NotFound' ||
  err?.status === 404;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fullDiff = args.includes('--full-diff');
  const filePath = args.find(a => !a.startsWith('--'));

  if (!filePath) {
    throw new Error(
      'usage: npm run article:push -- <path/to/article.md> [--dry-run] [--full-diff]',
    );
  }

  // Guard before the file is read or the client is built, so the mistake is free.
  if (fullDiff && !dryRun) {
    throw new Error('--full-diff only affects the diff report. Add --dry-run.');
  }

  const raw = await fs.readFile(filePath, 'utf8');
  const { data: fm, content } = matter(raw);

  const categories = await readJson('content/_reference/categories.json');
  const tags = await readJson('content/_reference/tags.json');
  const contentModel = await readJson('content/_reference/content-model.json');

  warnUnknownKeys(filePath, fm, contentModel);

  // Filesystem only, and validate() needs it, so it runs before the client
  // exists. One pass feeds both the link resolution and the gotcha check.
  const index = await readArticleIndex(filePath);

  const errors = validate(fm, content, categories, tags, index);
  if (errors.length > 0) {
    throw new Error(`${filePath}\n  - ${errors.join('\n  - ')}`);
  }

  const client = getClient();
  const locale = await getDefaultLocale(client);

  const questions = Array.isArray(fm.interviewQuestions)
    ? fm.interviewQuestions
    : [];
  const gotchas = Array.isArray(fm.gotchas) ? fm.gotchas : [];

  const questionIdsBefore = questions.map(q => q.id ?? null);
  const gotchaIdsBefore = gotchas.map(g => g.id ?? null);

  // Gotchas are shared, so a write here reaches every article that links one.
  // Refuse before anything is written when the copies disagree; the map it
  // returns is the blast radius, which the dry-run report shows either way.
  const alsoLinkedBy = collectSharedGotchas(filePath, gotchas, index.gotchaById);

  // Children first: the article needs their ids to build its links.
  const questionLinks = dryRun
    ? questions.filter(q => q.id).map(q => entryLink(q.id))
    : await syncQuestions(client, locale, questions);

  const gotchaLinks = dryRun
    ? gotchas.filter(g => g.id).map(g => entryLink(g.id))
    : await syncGotchas(client, locale, gotchas, categories, tags);

  const fields = {
    title: { [locale]: fm.title },
    slug: { [locale]: fm.slug },
    summary: { [locale]: fm.summary },
    difficulty: { [locale]: fm.difficulty },
    body: { [locale]: content },
    category: { [locale]: entryLink(categories[fm.category]) },
    tag: { [locale]: fm.tag.map(name => entryLink(tags[name])) },
    interviewQuestions: { [locale]: questionLinks },
    // Markdown order is the display order; send it through unchanged.
    gotchas: { [locale]: gotchaLinks },
    // Always sent, empty included: the frontmatter is the source of truth, so
    // a slug removed from it has to be removed in Contentful too.
    prerequisites: { [locale]: linkArticles(fm.prerequisites, index.bySlug) },
    related: { [locale]: linkArticles(fm.related, index.bySlug) },
    lastReviewed: { [locale]: today() },
  };

  if (fm.order != null) fields.order = { [locale]: fm.order };

  if (fm.versionScope != null) {
    fields.versionScope = { [locale]: fm.versionScope };
  }

  if (fm.readingTime != null) {
    fields.readingTime = { [locale]: fm.readingTime };
  }

  if (dryRun) {
    const lookups = {
      categoryNameById: invert(categories),
      tagNameById: invert(tags),
      articleSlugById: Object.fromEntries(
        [...index.bySlug].flatMap(([slug, { entryId }]) =>
          entryId ? [[entryId, slug]] : [],
        ),
      ),
    };
    const gotchaCtx = { alsoLinkedBy, lookups, categories, tags, filePath };

    if (!fm.contentfulEntryId) {
      console.log(`[dry-run] CREATE ${fm.slug}\n`);
      reportCreate(fields, locale, lookups);
      reportQuestions(questions);
      await reportGotchas(client, locale, gotchas, gotchaCtx);
      return;
    }

    const entryId = fm.contentfulEntryId;
    let current;

    // A missing entry must not fall through to create. That would add a
    // duplicate and overwrite the frontmatter id on the next real push.
    try {
      current = await client.entry.get({ entryId });
    } catch (err) {
      if (isNotFound(err)) {
        throw new Error(
          `contentfulEntryId ${entryId} does not exist in Contentful.\n` +
            `  ${filePath}\n` +
            '  Fix or remove the id in the frontmatter.',
        );
      }
      throw err;
    }

    // The same call the real push makes, so the two can never disagree.
    const willChange = hasChanges(current.fields, fields, locale);

    // Headed after the diff is evaluated, never before. An entry id says only
    // that the article exists; a header built from that alone reads as a write
    // about to happen even when nothing would be sent.
    console.log(
      `[dry-run] ${willChange ? 'UPDATE' : 'NO CHANGES'} ${fm.slug} (${entryId})\n`,
    );

    reportUpdate(current, fields, locale, lookups, fullDiff);
    reportUntouched(current, fields, locale);
    reportQuestions(questions);
    await reportGotchas(client, locale, gotchas, gotchaCtx);
    return;
  }

  // The child syncs may have assigned new ids - persist them before touching the article, so a failure below doesn't orphan the entries we just created.
  const childIdsChanged =
    questions.some((q, i) => q.id !== questionIdsBefore[i]) ||
    gotchas.some((g, i) => g.id !== gotchaIdsBefore[i]);
  if (childIdsChanged) {
    await fs.writeFile(filePath, matter.stringify(content, fm));
  }

  if (fm.contentfulEntryId) {
    const entryId = fm.contentfulEntryId;
    const current = await client.entry.get({ entryId });

    if (!hasChanges(current.fields, fields, locale)) {
      console.log(`no changes: ${fm.slug} (lastReviewed left untouched)`);
      return;
    }

    // Spread `current` so sys.version survives – it is the optimistic lock.
    const updated = await client.entry.update(
      { entryId },
      { ...current, fields: { ...current.fields, ...fields } },
    );
    console.log(`updated draft: ${updated.sys.id} (${fm.slug})`);
  } else {
    const created = await client.entry.create(
      { contentTypeId: CONTENT_TYPE },
      { fields },
    );
    fm.contentfulEntryId = created.sys.id;
    await fs.writeFile(filePath, matter.stringify(content, fm));
    console.log(`created draft: ${created.sys.id} (${fm.slug})`);
  }

  console.log(
    'Article is a draft. Review in Contentful, then publish manually.',
  );
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
