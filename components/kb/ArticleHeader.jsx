import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DifficultyBadge from './DifficultyBadge';

const ArticleHeader = ({ article }) => {
  const { title, summary, difficulty, lastReviewed, category } = article.fields;

  const categoryName = category?.fields?.name;
  const categorySlug = category?.fields?.slug;

  return (
    <header className="not-prose mb-12 pb-8 border-b border-slate-200">
      {categorySlug && (
        <Link
          href={`/kb/${categorySlug}`}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
        >
          <ArrowLeft
            className="size-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          />
          Back to {categoryName}
        </Link>
      )}

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>

      <p className="mt-4 text-lg leading-relaxed text-slate-600">{summary}</p>

      <div className="flex items-center gap-4 mt-6 text-sm text-slate-500">
        <DifficultyBadge level={difficulty} />
        {lastReviewed && (
          <span>
            Last reviewed{' '}
            <time dateTime={lastReviewed}>
              {new Date(lastReviewed).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </span>
        )}
      </div>
    </header>
  );
};

export default ArticleHeader;
