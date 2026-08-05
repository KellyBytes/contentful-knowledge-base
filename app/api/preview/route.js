import { getContentfulClient } from '@/lib/contentful/client';
import { previewRoutes } from '@/lib/preview-routes';
import { resolveInternalPath } from '@/lib/utils/safe-redirect';
import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') ?? 'post';

  const expected = process.env.CONTENTFUL_PREVIEW_SECRET;
  if (!expected)
    return new NextResponse('Preview not configured', { status: 503 });

  if (secret !== expected || !slug)
    return new NextResponse('Invalid token', { status: 401 });

  const config = previewRoutes[type];

  if (!config) return new NextResponse('Unknown content type', { status: 404 });

  const client = getContentfulClient(true);

  const response = await client.getEntries({
    content_type: config.contentType,
    'fields.slug': slug,
    limit: 1,
    include: 2,
  });

  const entry = response?.items?.[0];

  if (!entry) {
    return new NextResponse('Invalid slug', { status: 404 });
  }

  const path = config.getPath(entry);

  if (!path) {
    return new NextResponse(
      'Could not build a preview URL. Is the Category reference correct?',
      { status: 422 },
    );
  }

  const safePath = resolveInternalPath(path, request.url);

  if (!safePath)
    return new NextResponse('Preview path failed validation', { status: 500 });

  const draft = await draftMode();
  draft.enable();

  return NextResponse.redirect(new URL(safePath, request.url));
}
