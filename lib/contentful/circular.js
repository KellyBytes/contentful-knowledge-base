// When articles cross-reference each other via related / prerequisites,
// the SDK's resolved linked entries point back to the original entry,
// forming a circular structure. These two helpers only change how the
// related / prerequisites fields are handled per use case, and leave
// every other field (category, tags, etc.) untouched.
const LINK_FIELDS = ['related', 'prerequisites'];

// For list/card views: strip related / prerequisites entirely.
// CompactArticleCard doesn't use either field, so this has no visual effect.
export function stripLinkFieldsForList(entry) {
  if (!entry?.fields) return entry;
  const fields = { ...entry.fields };
  for (const key of LINK_FIELDS) delete fields[key];
  return { ...entry, fields };
}

// For detail views: keep related / prerequisites themselves (title, slug,
// etc.) but strip related / prerequisites from each linked entry to break
// the cycle. Builds a new object each time rather than mutating the
// original entry, since it may be shared by reference elsewhere.
export function stripLinkFieldsForDetail(entry) {
  if (!entry?.fields) return entry;

  const fields = { ...entry.fields };
  for (const key of LINK_FIELDS) {
    if (!Array.isArray(fields[key])) continue;
    fields[key] = fields[key].map(linked =>
      linked?.fields ? stripLinkFieldsForList(linked) : linked,
    );
  }
  return { ...entry, fields };
}
