import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/contentful/kb';
import { getPosts } from '@/lib/contentful/posts';

export async function GET() {
  const [articles, posts] = await Promise.all([getArticles(), getPosts()]);

  const articleItems = articles
    .filter(a => a.fields.category?.fields?.slug)
    .map(a => ({
      type: 'article',
      title: a.fields.title,
      summary: a.fields.summary ?? '',
      context: a.fields.category.fields.name,
      path: `/kb/${a.fields.category.fields.slug}/${a.fields.slug}`,
      date: a.fields.lastReviewed ?? null,
    }));

  const postItems = posts.map(p => ({
    type: 'post',
    title: p.fields.title,
    summary: p.fields.excerpt ?? '',
    context: 'Blog',
    path: `/posts/${p.fields.slug}`,
    date: p.fields.date ?? null,
  }));

  return NextResponse.json([...articleItems, ...postItems], {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
