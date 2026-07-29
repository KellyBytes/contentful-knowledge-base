import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { getContentfulClient } from '@/lib/contentful/client';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  if (secret !== process.env.CONTENTFUL_PREVIEW_SECRET || !slug) {
    return new NextResponse('Invalid token', { status: 401 });
  }

  const client = getContentfulClient(true);
  const response = await client.getEntries({
    content_type: 'post',
    'fields.slug': slug,
  });

  const post = response?.items?.[0];

  if (!post) {
    return new NextResponse('Invalid slug', { status: 404 });
  }

  const draft = await draftMode();
  draft.enable();

  return NextResponse.redirect(
    new URL(`/posts/${post.fields.slug}`, request.url),
  );
}
