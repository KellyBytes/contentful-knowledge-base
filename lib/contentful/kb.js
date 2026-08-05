import { unstable_cache } from 'next/cache';
import { getContentfulClient } from './client';
import { REVALIDATE } from '@/lib/utils';
import { sortArticles } from '@/lib/kb/sort';

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

export const getCategory = unstable_cache(fetchCategory, ['kb-category'], {
  revalidate: REVALIDATE,
});

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
    include: 2,
  });

  return sortArticles(response.items);
};

export const getArticlesByCategory = unstable_cache(
  fetchArticlesByCategory,
  ['kb-articles-by-category'],
  {
    revalidate: REVALIDATE,
  },
);

const fetchLatestArticles = async () => {
  const client = getContentfulClient();

  const response = await client.getEntries({
    content_type: 'article',
    order: ['-sys.updatedAt'],
    limit: 4,
    include: 2,
  });

  return response.items;
};

export const getLatestArticles = unstable_cache(
  fetchLatestArticles,
  ['kb-latest-articles'],
  {
    revalidate: REVALIDATE,
  },
);

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

export const getArticleCached = unstable_cache(
  slug => fetchArticle(slug, false),
  ['kb-article'],
  {
    revalidate: REVALIDATE,
  },
);

export const getArticle = ({ slug, preview = false }) =>
  preview ? fetchArticle(slug, true) : getArticleCached(slug);
