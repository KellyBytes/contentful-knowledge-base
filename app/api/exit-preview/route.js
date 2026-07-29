import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const draft = await draftMode();
  draft.disable();

  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('slug')
    ? `/posts/${searchParams.get('slug')}`
    : `/`;

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
