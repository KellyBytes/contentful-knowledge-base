import { draftMode } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getArticles, getArticle } from '@/lib/contentful/kb';
import ArticleHeader from '@/components/kb/ArticleHeader';
import ArticleBody from '@/components/kb/ArticleBody';
import ArticleFaq from '@/components/kb/ArticleFaq';
import BackToTop from '@/components/ui/BackToTop';
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
  const { isEnabled: preview } = await draftMode();
  const article = await getArticle({ slug, preview });

  if (!article) return {};

  const { title, summary } = article.fields;

  return {
    title: `${title} | Kelly's Notes`,
    description: summary,
  };
};

const ArticlePage = async ({ params }) => {
  const { category: categorySlug, slug } = await params;
  const { isEnabled: preview } = await draftMode();

  const article = await getArticle({ slug, preview });

  if (!article) return notFound();

  const actualCategory = article.fields.category?.fields?.slug;

  // Article exists but has no category reference - cannot build a canonical URL
  if (!actualCategory) return notFound();

  // Canonicalize: the article's own category is the source of truth
  if (actualCategory !== categorySlug) {
    redirect(`/kb/${actualCategory}/${slug}`);
  }

  return (
    <section className="py-12 md:py-24">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {preview && <PreviewAlert path={`/kb/${categorySlug}/${slug}`} />}

        <article className="prose prose-stone mx-auto max-w-none lg:prose-lg">
          <ArticleHeader article={article} />
          <ArticleBody article={article} />
          <ArticleFaq questions={article.fields.interviewQuestions} />
        </article>
      </div>
      <BackToTop />
    </section>
  );
};

export default ArticlePage;
