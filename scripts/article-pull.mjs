import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {
  getAllEntries,
  getClient,
  getDefaultLocale,
  slugify,
} from './lib/contentful.mjs';

const CONTENT_TYPE = 'article';
const OUT_DIR = 'content/knowledge-base';

// id -> human name, plus id -> url slug for directory naming
async function buildLookups(client, locale) {
  const [categories, tags, questions] = await Promise.all([
    getAllEntries(client, { content_type: 'category' }),
    getAllEntries(client, { content_type: 'tag' }),
    getAllEntries(client, { content_type: 'interviewQuestion' }),
  ]);

  const categoryById = {};
  for (const c of categories) {
    categoryById[c.sys.id] = {
      name: c.fields.name?.[locale] ?? 'Uncategorized',
      // use Contentful's own slug so local folders match the live URLs
      slug: c.fields.slug?.[locale] ?? slugify(c.fields.name?.[locale]),
    };
  }

  const tagNameById = {};
  for (const t of tags) {
    tagNameById[t.sys.id] = t.fields.name?.[locale];
  }

  // Unlike category/tag, these are not looked up by name - each one belongs to a single article, so we keep the whole payload and index it by id.
  const questionById = {};
  for (const q of questions) {
    questionById[q.sys.id] = {
      question: q.fields.question?.[locale] ?? '',
      shortAnswer: q.fields.shortAnswer?.[locale] ?? '',
    };
  }

  return { categoryById, tagNameById, questionById };
}

// Resolve the article's question links, keeping Contentful's ordering. The order is editorial, so it must survive the round trip.
function resolveQuestions(links, questionById, slug) {
  const resolved = [];

  for (const link of links) {
    const id = link?.sys?.id;
    const found = questionById[id];

    if (!found) {
      console.warn(
        `  ${slug}: interviewQuestion ${id} could not be resolved, dropped`,
      );
      continue;
    }
    resolved.push({ id, ...found });
  }

  return resolved;
}

async function main() {
  const client = getClient();
  const locale = await getDefaultLocale(client);
  console.log(`using locale: ${locale}\n`);

  const { categoryById, tagNameById, questionById } = await buildLookups(
    client,
    locale,
  );
  const entries = await getAllEntries(client, { content_type: CONTENT_TYPE });

  let written = 0;

  for (const entry of entries) {
    const f = entry.fields;
    const slug = f.slug?.[locale];

    if (!slug) {
      console.warn(`  skipped ${entry.sys.id}: no slug`);
      continue;
    }

    const category = categoryById[f.category?.[locale]?.sys?.id];
    if (!category) {
      console.warn(`  skipped ${slug}: category link could not be resolved`);
      continue;
    }

    const tagNames = (f.tag?.[locale] ?? [])
      .map(link => tagNameById[link.sys.id])
      .filter(Boolean);

    const questions = resolveQuestions(
      f.interviewQuestions?.[locale] ?? [],
      questionById,
      slug,
    );

    // lastReviewed is deliberately omitted: the push script derives it.
    const frontmatter = {
      contentType: CONTENT_TYPE,
      title: f.title?.[locale] ?? '',
      slug,
      category: category.name,
      tag: tagNames,
      difficulty: f.difficulty?.[locale] ?? 'Intermediate',
      summary: f.summary?.[locale] ?? '',
      contentfulEntryId: entry.sys.id,
    };

    if (f.order?.[locale] != null) frontmatter.order = f.order[locale];
    if (questions.length > 0) frontmatter.interviewQuestions = questions;

    const dir = path.join(OUT_DIR, category.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, `${slug}.md`),
      matter.stringify(f.body?.[locale] ?? '', frontmatter),
    );

    console.log(
      `  pulled ${category.slug}/${slug} (${questions.length} questions)`,
    );
    written += 1;
  }

  console.log(
    `\ndone: ${written} of ${entries.length} entries written to ${OUT_DIR}`,
  );
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
