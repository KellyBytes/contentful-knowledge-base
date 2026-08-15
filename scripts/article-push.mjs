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
    if (key === 'lastReviewed') return false;
    return (
      JSON.stringify(currentFields[key]?.[locale]) !==
      JSON.stringify(nextFields[key][locale])
    );
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const filePath = args.find(a => !a.startsWith('--'));

  if (!filePath) {
    throw new Error(
      'usage: npm run article:push -- <path/to/article.md> [--dry-run]',
    );
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

  if (dryRun) {
    const pending = questions.filter(q => !q.id).length;
    if (pending > 0) {
      console.log(`[dry-run] ${pending} new question(s) would be created`);
    }
    console.log(
      `[dry-run] ${fm.contentfulEntryId ? 'would update' : 'would create'} ${fm.slug}`,
    );
    console.log(JSON.stringify(fields, null, 2));
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
