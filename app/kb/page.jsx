import CategoryCard from '@/components/kb/CategoryCard';
import { getArticles, getCategories } from '@/lib/contentful/kb';

export const metadata = {
  title: "Knowledge Base | Kelly's Notes",
  description:
    'Core concepts in JavaScript, TypeScript, React, and the web platform written up as reference notes.',
};

const KnowledgeBase = async () => {
  const [categories, articles] = await Promise.all([
    getCategories(),
    getArticles(),
  ]);

  const countBySlug = articles.reduce((acc, article) => {
    const slug = article.fields.category?.fields?.slug;
    if (slug) acc[slug] = (acc[slug] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="py-8 md:py-16">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-14">
          <h1 className="text-4xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="max-w-2xl mt-4 text-lg leading-relaxed">
            Reference notes on the concepts that come up again and again in
            frontend and full-stack development.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(category => (
            <CategoryCard
              key={category.fields.slug}
              category={category}
              articleCount={countBySlug[category.fields.slug] ?? 0}
            />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default KnowledgeBase;
