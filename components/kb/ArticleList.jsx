'use client';

import { useMemo, useState } from 'react';
import ArticleCard from './ArticleCard';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const ArticleList = ({ articles, categorySlug }) => {
  const [level, setLevel] = useState('All');

  // Count the number of articles for each level (for badge)
  const counts = useMemo(() => {
    const result = {
      All: articles.length,
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
    };

    articles.forEach(({ fields }) => {
      if (fields.difficulty in result) result[fields.difficulty] += 1;
    });

    return result;
  }, [articles]);

  const visibleArticles =
    level === 'All'
      ? articles
      : articles.filter(article => article.fields.difficulty === level);

  return (
    <>
      <div
        role="group"
        aria-label="Filter articles by difficulty"
        className="mb-8 flex flex-wrap gap-2"
      >
        {LEVELS.map(item => {
          const isActive = item === level;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              aria-pressed={isActive}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'border-amber-400 bg-amber-100 text-amber-600'
                  : 'border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              {item}
              <span
                className={`ml-2 text-xs ${
                  isActive ? 'text-stone-400 font-semibold' : 'text-stone-400'
                }`}
              >
                {counts[item]}
              </span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {visibleArticles.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-200 p-8 text-center text-stone-500">
            No <span className="font-medium text-stone-700">{level}</span>{' '}
            articles yet. Coming soon.
          </p>
        ) : (
          <ul className="space-y-4">
            {visibleArticles.map(article => (
              <ArticleCard
                key={article.fields.slug}
                article={article}
                categorySlug={categorySlug}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ArticleList;
