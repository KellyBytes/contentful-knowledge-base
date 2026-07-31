import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { getArticles, getArticle } from '@/lib/contentful/kb';
import ArticleHeader from '@/components/kb/ArticleHeader';
import ArticleBody from '@/components/kb/ArticleBody';
import PreviewAlert from '@/components/ui/PreviewAlert';

export const generateStaticParams = async () => {
  const articles = await getArticles();

  return articles
    .filter(article => article.fields.category?.fields?.slug)
    .map(article => ({
      category: article.fields.category.fields.slug,
      slug: article.fields.slug,
    }));
};

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  const article = await getArticle({ slug });

  if (!article) return {};

  const { title, summary } = article.fields;

  return {
    title: title,
    description: summary,
  };
};

const ArticlePage = async ({ params }) => {
  const { category: categorySlug, slug } = await params;
  const { isEnabled: preview } = await draftMode();

  const article = await getArticle({ slug, preview });

  if (!article) return notFound();

  // Check whether the category in the url matches the category of the article
  if (article.fields.category?.fields?.slug !== categorySlug) {
    return notFound();
  }

  return (
    <section className="py-24">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {preview && <PreviewAlert path={`/kb/${categorySlug}/${slug}`} />}

        <article className="prose prose-slate mx-auto max-w-none lg:prose-lg">
          <ArticleHeader article={article} />
          <ArticleBody article={article} />
        </article>
      </div>
    </section>
  );
};

export default ArticlePage;
