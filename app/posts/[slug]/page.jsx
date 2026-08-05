import PostBody from '@/components/posts/PostBody';
import PostHeader from '@/components/posts/PostHeader';
import PreviewAlert from '@/components/ui/PreviewAlert';
import { getPost, getPosts } from '@/lib/contentful/posts';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

export const generateStaticParams = async () => {
  const posts = await getPosts();

  return posts.map(post => ({
    slug: post.fields.slug,
  }));
};

export const generateMetadata = async ({ params }) => {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const post = await getPost({ slug, preview });

  if (!post) return {};

  const { title, excerpt } = post.fields;

  return {
    title: `${title} | Kelly's Notes`,
    description: excerpt,
  };
};

const Post = async ({ params }) => {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();

  const post = await getPost({ slug, preview });

  if (!post) return notFound();

  return (
    <section className="py-12 md:py-24">
      {preview && <PreviewAlert path={`/posts/${slug}`} />}

      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="prose prose-stone mx-auto max-w-4xl lg:prose-lg">
          <PostHeader post={post} />
          <PostBody post={post} />
        </article>
      </div>
    </section>
  );
};

export default Post;
