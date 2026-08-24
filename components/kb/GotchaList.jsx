import Markdown from '../Markdown';

const GotchaList = ({ gotchas }) => {
  // Exclude unpublished entries as fields will not be resolved
  const resolved = (gotchas ?? []).filter(g => g?.fields?.symptom);

  if (resolved.length === 0) return null;

  return (
    <section className="not-prose mt-16 pt-10 border-t border-slate-200">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">
        Where people get stuck
      </h2>

      <div className="mt-6 space-y-6">
        {resolved.map(item => {
          const { symptom, errorMessage, cause, fix } = item.fields;

          return (
            <div
              key={item.sys.id}
              className="rounded-lg border border-slate-200 p-5"
            >
              <p className="font-medium text-stone-900">{symptom}</p>

              {errorMessage && (
                <code className="mt-2 block rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </code>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Cause
                  </p>
                  <div className="prose prose-stone prose-sm mt-1 max-w-none text-stone-600 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                    <Markdown>{cause}</Markdown>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Fix
                  </p>
                  <div className="prose prose-stone prose-sm mt-1 max-w-none text-stone-600 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                    <Markdown>{fix}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GotchaList;
