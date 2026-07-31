import DifficultyBadge from './DifficultyBadge';

const ArticleHeader = ({ article }) => {
  const { title, summary, difficulty, lastReviewed, category } = article.fields;

  return (
    <header className="not-prose mb-12 pb-8 border-b border-slate-200">
      <p className="text-sm font-medium text-amber-600">
        {category?.fields?.name}
      </p>

      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{title}</h1>

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
