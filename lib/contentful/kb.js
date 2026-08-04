import { unstable_cache } from 'next/cache';
import { getContentfulClient } from './client';
import { sortArticles } from '@/lib/kb/sort';

const REVALIDATE = 60;

const DIFFICULTY_RANK = { Beginner: 0, Intermediate: 1, Advanced: 2 };

const sortByDifficulty = items =>
  [...items].sort((a, b) => {
    const rank =
      (DIFFICULTY_RANK[a.fields.difficulty] ?? 99) -
      (DIFFICULTY_RANK[b.fields.difficulty] ?? 99);
    return rank !== 0 ? rank : a.fields.title.localeCompare(b.fields.title);
  });

// ---------- Categories ----------
const fetchCategories = async () => {
  const client = getContentfulClient();

  const response = await client.getEntries({
    content_type: 'category',
    order: ['fields.order'],
  });

  return response.items;
};

export const getCategories = unstable_cache(
  fetchCategories,
  ['kb-categories'],
  {
    revalidate: REVALIDATE,
  },
);

const fetchCategory = async slug => {
  const client = getContentfulClient();

  const response = await client.getEntries({
    content_type: 'category',
    'fields.slug': slug,
    limit: 1,
  });

  return response.items[0] ?? null;
};

export const getCategory = slug =>
  unstable_cache(() => fetchCategory(slug), ['kb-category', slug], {
    revalidate: REVALIDATE,
  })();

// ---------- Articles ----------
const fetchArticles = async () => {
  const client = getContentfulClient();

  const response = await client.getEntries({
    content_type: 'article',
    include: 2,
  });

  return response.items;
};

export const getArticles = unstable_cache(fetchArticles, ['kb-articles'], {
  revalidate: REVALIDATE,
});

const fetchArticlesByCategory = async categorySlug => {
  const client = getContentfulClient();

  const response = await client.getEntries({
    content_type: 'article',
    'fields.category.sys.contentType.sys.id': 'category',
    'fields.category.fields.slug': categorySlug,
    // order: ['fields.order', 'fields.title'],
    include: 2,
  });

  // return sortByDifficulty(response.items);
  return sortArticles(response.items);
};

export const getArticlesByCategory = categorySlug =>
  unstable_cache(
    () => fetchArticlesByCategory(categorySlug),
    ['kb-articles', categorySlug],
    {
      revalidate: REVALIDATE,
    },
  )();

const fetchArticle = async (slug, preview = false) => {
  const client = getContentfulClient(preview);

  const response = await client.getEntries({
    content_type: 'article',
    'fields.slug': slug,
    limit: 1,
    include: 2,
  });

  return response.items[0] ?? null;
};

export const getArticle = ({ slug, preview = false }) => {
  if (preview) {
    return fetchArticle(slug, true);
  }

  return unstable_cache(() => fetchArticle(slug, false), ['kb-article', slug], {
    revalidate: REVALIDATE,
  })();
};
