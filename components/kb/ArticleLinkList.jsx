import CompactArticleCard from './CompactArticleCard';

// Reusable for both `prerequisites` ("Before you start") and `related`
// ("Keep reading"). Wraps CompactArticleCard so prerequisite/related links
// match the same card used on category listing pages.
const ArticleLinkList = ({ title, articles, className = '' }) => {
  // Exclude unpublished entries as fields will not be resolved
  const resolved = (articles ?? []).filter(
    a =>
      a?.fields?.title && a?.fields?.slug && a?.fields?.category?.fields?.slug,
  );

  if (resolved.length === 0) return null;

  return (
    <section className="not-prose mb-12 pb-10 border-b border-slate-200">
      <h2 className="text-2xl font-bold tracking-tight text-stone-900">
        {title}
      </h2>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {resolved.map(article => (
          <li key={article.sys.id}>
            <CompactArticleCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ArticleLinkList;
