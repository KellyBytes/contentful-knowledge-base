import { unstable_cache } from 'next/cache';
import { REVALIDATE } from '@/lib/utils';
import { getContentfulClient } from './client';

// Get all posts
const fetchPosts = async () => {
  const client = getContentfulClient();

  const response = await client.getEntries({
    content_type: 'post',
  });

  return response.items;
};

export const getPosts = unstable_cache(fetchPosts, ['posts'], {
  revalidate: REVALIDATE,
});

// Get a single post
const fetchPost = async (slug, preview = false) => {
  const client = getContentfulClient(preview);

  const response = await client.getEntries({
    content_type: 'post',
    'fields.slug': slug,
    limit: 1,
  });

  return response.items[0] ?? null;
};

export const getPostCached = unstable_cache(
  slug => fetchPost(slug, false),
  ['post'],
  {
    revalidate: REVALIDATE,
  },
);

export const getPost = ({ slug, preview = false }) =>
  preview ? fetchPost(slug, true) : getPostCached(slug);
