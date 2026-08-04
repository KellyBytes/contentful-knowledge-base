import { getPosts } from '@/lib/contentful/posts';
import PostCard from '@/components/posts/PostCard';

export const metadata = {
  title: "Posts | Kelly's Notes",
  description:
    "Stories behind my projects, technical challenges I've solved, and lessons from building for the web.",
};

const Posts = async () => {
  const posts = await getPosts();

  return (
    <section className="py-12 md:py-24">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-14">
          <h1 className="text-4xl font-bold tracking-tight">Posts</h1>
          <p className="max-w-2xl mt-4 text-lg leading-relaxed text-slate-600">
            Stories behind my projects, technical challenges I&apos;ve solved,
            and lessons from building for the web.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PostCard key={post.fields.slug} post={post} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Posts;
