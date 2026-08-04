'use client';

import { useEffect, useRef } from 'react';
import CompactArticleCard from './CompactArticleCard';

const LatestArticlesCarousel = ({ articles }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const interval = setInterval(() => {
      const card = container.children[0];

      if (!card) return;

      const cardWidth = card.getBoundingClientRect().width;
      const gap = 24;

      const maxScroll = container.scrollWidth - container.clientWidth;

      const next = container.scrollLeft + cardWidth + gap;

      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({
          left: 0,
          behavior: 'smooth',
        });
      } else {
        container.scrollTo({
          left: next,
          behavior: 'smooth',
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Latest Articles</h2>
      </div>

      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {articles.map(article => (
          <div
            key={article.sys.id}
            className="snap-start shrink-0 basis-full md:basis-[calc((100%-1.5rem)/2)]"
          >
            <CompactArticleCard article={article} />
          </div>
        ))}
      </div>
    </>
  );
};

export default LatestArticlesCarousel;
