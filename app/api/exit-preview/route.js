import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const draft = await draftMode();
  draft.disable();

  const { searchParams } = new URL(request.url);
  const requested = searchParams.get('redirect');

  const isSafe =
    typeof requested === 'string' &&
    requested.startsWith('/') &&
    !requested.startsWith('//');

  return NextResponse.redirect(new URL(isSafe ? requested : '/', request.url));
}
