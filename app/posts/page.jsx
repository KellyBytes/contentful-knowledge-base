import { getPosts } from '@/lib/contentful/posts';
import PostCard from '@/components/posts/PostCard';

const Posts = async () => {
  const posts = await getPosts();
  // console.log({ posts });

  return (
    <section className="py-24">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map(post => (
            <PostCard key={post.fields.slug} post={post} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Posts;
