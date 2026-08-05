import Link from 'next/link';

const CompactArticleCard = ({ article }) => {
  const categorySlug = article.fields.category.fields.slug;
  const { slug, title, summary } = article.fields;

  return (
    <Link
      href={`/kb/${categorySlug}/${slug}`}
      className="
        block
        h-full
        rounded-xl
        border
        border-slate-200
        bg-amber-50/30
        p-5
        transition
        hover:border-amber-400 hover:text-amber-600 hover:shadow-md
      "
    >
      <h3 className="line-clamp-2 text-lg font-semibold">{title}</h3>

      <p className="mt-3 line-clamp-3 text-sm text-stone-600">{summary}</p>

      <span className="inline-flex mt-6 text-sm font-medium text-amber-600">
        Read article →
      </span>
    </Link>
  );
};

export default CompactArticleCard;
