import { createClient } from 'contentful-management';

export function getClient() {
  const {
    CONTENTFUL_MANAGEMENT_TOKEN,
    CONTENTFUL_SPACE_ID,
    CONTENTFUL_ENVIRONMENT = 'master',
  } = process.env;

  if (!CONTENTFUL_MANAGEMENT_TOKEN || !CONTENTFUL_SPACE_ID) {
    throw new Error(
      'Missing env vars. Check that both --enf-file flags are passed.',
    );
  }

  return createClient(
    {
      accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
    },
    {
      type: 'plain',
      defaults: {
        spaceId: CONTENTFUL_SPACE_ID,
        environmentId: CONTENTFUL_ENVIRONMENT,
      },
    },
  );
}

// The space decides the locale, not us. Ask it.
export async function getDefaultLocale(client) {
  const { items } = await client.locale.getMany({ query: { limit: 100 } });
  const found = items.find(l => l.default);

  if (!found) {
    throw new Error(
      `No default locale. Available: ${items.map(l => l.code).join(', ')}`,
    );
  }
  return found.code;
}

// Contentful caps a page at 100 entries; walk until we have them all.
export async function getAllEntries(client, query) {
  const items = [];
  const limit = 100;
  let skip = 0;

  for (;;) {
    const page = await client.entry.getMany({
      query: { ...query, limit, skip },
    });
    items.push(...page.items);
    skip += limit;
    if (skip >= page.total) return items;
  }
}

export const entryLink = id => ({
  sys: { type: 'Link', linkType: 'Entry', id },
});

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
