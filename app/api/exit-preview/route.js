import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';
import { resolveInternalPath } from '@/lib/utils/safe-redirect';

export async function GET(request) {
  const draft = await draftMode();
  draft.disable();

  const { searchParams } = new URL(request.url);
  const path =
    resolveInternalPath(searchParams.get('redirect'), request.url) ?? '/';

  return NextResponse.redirect(new URL(path, request.url));
}
