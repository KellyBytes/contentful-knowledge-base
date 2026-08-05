import ArticleList from '@/components/kb/ArticleList';
import {
  getArticlesByCategory,
  getCategories,
  getCategory,
} from '@/lib/contentful/kb';
import CategoryIcon from '@/lib/icons';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const generateStaticParams = async () => {
  const categories = await getCategories();

  return categories.map(category => ({
    category: category.fields.slug,
  }));
};

export const generateMetadata = async ({ params }) => {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);

  if (!category) return {};

  return {
    title: `${category.fields.name} | Kelly's Notes`,
    description: category.fields.description,
  };
};

const CategoryPage = async ({ params }) => {
  const { category: categorySlug } = await params;

  const [category, articles] = await Promise.all([
    getCategory(categorySlug),
    getArticlesByCategory(categorySlug),
  ]);

  if (!category) return notFound();

  const { name, description, icon } = category.fields;

  return (
    <section className="py-12 md:py-24">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-slate-500">
          <Link href="/kb" className="hover:text-amber-600">
            Knowledge Base
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{name}</span>
        </nav>

        <header className="max-w-2xl mb-12">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CategoryIcon name={icon} className="size-6" />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight">{name}</h1>
          <p className="mt-4 leading-relaxed">{description}</p>
        </header>

        {articles.length === 0 ? (
          <p className="text-slate-500">No articles here yet. Coming soon.</p>
        ) : (
          <ArticleList articles={articles} categorySlug={categorySlug} />
        )}
      </div>
    </section>
  );
};

export default CategoryPage;
