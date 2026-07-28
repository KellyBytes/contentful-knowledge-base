import { notFound } from 'next/navigation';
import { getPosts } from '@/lib/contentful/posts';
import { getPost } from '@/lib/contentful/posts';
import PostHeader from '@/components/posts/PostHeader';
import PostBody from '@/components/posts/PostBody';
import PreviewAlert from '@/components/ui/PreviewAlert';

export const generateStaticParams = async () => {
  const posts = await getPosts();

  return posts.map(post => ({
    slug: post.fields.slug,
  }));
};

const Post = async ({ params, searchParams }) => {
  const { slug } = await params;
  const query = await searchParams;

  const preview = query.preview === 'true';

  const post = await getPost({
    slug,
    preview,
  });

  if (!post) return notFound();

  return (
    <section className="py-24">
      {/* {preview && <PreviewAlert />} */}

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="prose mx-auto">
          <PostHeader post={post} />
          <PostBody post={post} />
        </article>
      </div>
    </section>
  );
};

export default Post;
