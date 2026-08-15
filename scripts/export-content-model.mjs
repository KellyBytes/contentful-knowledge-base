import fs from 'node:fs/promises';
import { getClient, getDefaultLocale } from './lib/contentful.mjs';

// content types whose entries are referenced by name from article frontmatter
const LOOKUPS = [
  { contentType: 'category', nameField: 'name', outFile: 'categories.json' },
  { contentType: 'tag', nameField: 'name', outFile: 'tags.json' },
];

async function main() {
  const client = getClient();
  const locale = await getDefaultLocale(client);
  console.log(`using locale: ${locale}\n`);

  await fs.mkdir('content/_reference', { recursive: true });

  // --- content model ---
  const { items: contentTypes } = await client.contentType.getMany({
    query: { limit: 100 },
  });

  const model = contentTypes.map(ct => ({
    id: ct.sys.id,
    name: ct.name,
    displayField: ct.displayField,
    fields: ct.fields.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      required: f.required,
      linkType: f.linkType,
      items: f.items,
      validations: f.validations,
    })),
  }));

  await fs.writeFile(
    'content/_reference/content-model.json',
    JSON.stringify(model, null, 2) + '\n',
  );
  console.log(`exported ${model.length} content types`);

  // --- name -> id lookup tables ---
  for (const { contentType, nameField, outFile } of LOOKUPS) {
    const { items } = await client.entry.getMany({
      query: { content_type: contentType, limit: 500 },
    });

    const map = {};
    for (const entry of items) {
      const field = entry.fields[nameField];
      const name = field?.[locale];

      if (!name) {
        // Say which of the two thins is wrong, so the next person doesn't guess.
        const detail = field
          ? `no "${locale}" value (has: ${Object.keys(field).join(', ')})`
          : `no "${nameField}" field at all`;
        console.warn(`  skipped ${contentType} ${entry.sys.id}: ${detail}`);
        continue;
      }
      map[name] = entry.sys.id;
    }

    await fs.writeFile(
      `content/_reference/${outFile}`,
      JSON.stringify(map, null, 2) + '\n',
    );
    console.log(
      `exported ${Object.keys(map).length} ${contentType} entries -> ${outFile}`,
    );
  }

  // downstream scripts read this instead of hardcoding a locale
  await fs.writeFile(
    'content/_reference/space-meta.json',
    JSON.stringify({ locale }, null, 2) + '\n',
  );
}

main().catch(err => {
  console.error(err.message ?? err);
  process.exit(1);
});
