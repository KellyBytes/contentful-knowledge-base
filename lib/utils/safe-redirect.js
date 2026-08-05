// Resolve a redirect target to a same-origin path.
// Returns null if the input cannot be safely resolved.

export const resolveInternalPath = (requested, base) => {
  if (typeof requested !== 'string' || !requested.startsWith('/')) return null;

  try {
    const origin = new URL(base).origin;
    const target = new URL(requested, base);

    if (target.origin !== origin) return null;

    return target.pathname + target.search + target.hash;
  } catch {
    return null;
  }
};
