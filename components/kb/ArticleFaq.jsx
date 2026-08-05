import Markdown from '../Markdown';

const ArticleFaq = ({ questions }) => {
  // Exclude unpublished entries as fields will not be resolved
  const resolved = (questions ?? []).filter(q => q?.fields?.question);

  if (resolved.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-slate-200">
      <h2 className="not-prose text-2xl font-bold tracking-tight text-stone-900">
        Common questions
      </h2>

      <dl className="mt-6 divide-y divide-slate-200">
        {resolved.map(item => (
          <div key={item.sys.id} className="py-5">
            <dt className="not-prose font-medium text-stone-900">
              {item.fields.question}
            </dt>
            <dd className="prose prose-stone prose-sm mt-2 max-w-none text-stone-600 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
              <Markdown>{item.fields.shortAnswer}</Markdown>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default ArticleFaq;
