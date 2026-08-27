import matter from 'gray-matter';
import fs from 'node:fs/promises';
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

/** Optional fields sent only when the frontmatter carries them. */
const MANAGED_OPTIONAL = ['order', 'versionScope'];
/** Derived on every push, so it is never worth diffing. */
const DERIVED = 'lastReviewed';
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

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

const today = () => new Date().toISOString().slice(0, 10);

// Catch everything Contentful would reject, before spending a round trip.
// Collect all problems so one run reports them all instead of one at a time.
function validate(fm, body, categories, tags) {
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

  return errors;
}

/** Compare only the fields we manage; lastReviewed is derived, so ignore it. */
function hasChanges(currentFields, nextFields, locale) {
  return Object.keys(nextFields).some(key => {
    if (key === DERIVED) return false;
    return (
      JSON.stringify(currentFields[key]?.[locale]) !==
      JSON.stringify(nextFields[key][locale])
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
  return truncate(value);
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
    if (key === DERIVED || key === 'interviewQuestions') continue;

    const before = current.fields[key]?.[locale];
    const after = fields[key][locale];

    if (JSON.stringify(before) === JSON.stringify(after)) {
      unchanged.push(key);
      continue;
    }

    if (key === 'body') {
      changes.push(['changed', key, bodyDetails(before ?? '', after, fullDiff)]);
      continue;
    }

    if (before === undefined) {
      changes.push(['new', key, [`+ ${formatField(key, after, lookups)}`]]);
      continue;
    }

    changes.push([
      'changed',
      key,
      [
        `- ${formatField(key, before, lookups)}`,
        `+ ${formatField(key, after, lookups)}`,
      ],
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
    if (key === 'interviewQuestions') continue;

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

  const errors = validate(fm, content, categories, tags);
  if (errors.length > 0) {
    throw new Error(`${filePath}\n  - ${errors.join('\n  - ')}`);
  }

  const client = getClient();
  const locale = await getDefaultLocale(client);

  const questions = Array.isArray(fm.interviewQuestions)
    ? fm.interviewQuestions
    : [];
  const idsBefore = questions.map(q => q.id ?? null);

  // Children first: the article needs their ids to build its links.
  const questionLinks = dryRun
    ? questions.filter(q => q.id).map(q => entryLink(q.id))
    : await syncQuestions(client, locale, questions);

  const fields = {
    title: { [locale]: fm.title },
    slug: { [locale]: fm.slug },
    summary: { [locale]: fm.summary },
    difficulty: { [locale]: fm.difficulty },
    body: { [locale]: content },
    category: { [locale]: entryLink(categories[fm.category]) },
    tag: { [locale]: fm.tag.map(name => entryLink(tags[name])) },
    interviewQuestions: { [locale]: questionLinks },
    lastReviewed: { [locale]: today() },
  };

  if (fm.order != null) fields.order = { [locale]: fm.order };

  if (fm.versionScope != null) {
    fields.versionScope = { [locale]: fm.versionScope };
  }

  if (dryRun) {
    const lookups = {
      categoryNameById: invert(categories),
      tagNameById: invert(tags),
    };

    if (!fm.contentfulEntryId) {
      console.log(`[dry-run] CREATE ${fm.slug}\n`);
      reportCreate(fields, locale, lookups);
      reportQuestions(questions);
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

    console.log(`[dry-run] UPDATE ${fm.slug} (${entryId})\n`);

    // The same call the real push makes, so the two can never disagree.
    if (!hasChanges(current.fields, fields, locale)) {
      console.log('  no changes (lastReviewed left untouched)');
    }

    reportUpdate(current, fields, locale, lookups, fullDiff);
    reportUntouched(current, fields, locale);
    reportQuestions(questions);
    return;
  }

  // syncQuestions may have assigned new ids - persist them before touching the article, so a failure below doesn't orphan the entries we just created.
  const idsChanged = questions.some((q, i) => q.id !== idsBefore[i]);
  if (idsChanged) {
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
