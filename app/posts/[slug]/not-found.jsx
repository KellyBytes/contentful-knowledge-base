import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="py-12 md:py-24 text-center">
      <h1 className="mb-4 text-3xl font-bold">Article Not Found</h1>

      <p className="mb-8">
        The article may have been removed or the URL is incorrect.
      </p>

      <Link
        href="/posts"
        className="inline-block rounded-lg bg-stone-600 px-5 py-2 text-white hover:bg-stone-700"
      >
        ← Back to All Posts
      </Link>
    </section>
  );
}
