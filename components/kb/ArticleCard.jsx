import Link from 'next/link';
import DifficultyBadge from './DifficultyBadge';

const ArticleCard = ({ article, categorySlug }) => {
  const { title, slug, summary, difficulty } = article.fields;

  return (
    <li>
      <Link
        href={`/kb/${categorySlug}/${slug}`}
        className="group block p-5 rounded-lg border border-slate-200 transition hover:border-amber-400 hover:bg-amber-50/30"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-heading text-lg font-semibold group-hover:text-amber-600">
            {title}
          </h2>
          <DifficultyBadge level={difficulty} />
        </div>

        <p className="mt-2 text-sm leading-relaxed text-stone-600">{summary}</p>
      </Link>
    </li>
  );
};

export default ArticleCard;
