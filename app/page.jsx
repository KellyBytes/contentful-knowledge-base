import Link from 'next/link';

const HomePage = () => {
  return (
    <section className="py-12 md:py-24 space-y-6">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Kelly&apos;s Notes
        </h1>

        <p className="max-w-2xl mt-4 text-lg text-muted-foreground">
          Thoughts, projects, and reference notes on frontend and full-stack web
          development.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/posts"
            className="px-5 py-3 rounded-xl font-semibold text-white bg-stone-600 border border-stone-600 transition hover:border-amber-400 hover:text-amber-300 hover:shadow-md"
          >
            Browse Posts
          </Link>

          <Link
            href="/kb"
            className="px-5 py-3 rounded-xl font-semibold border border-stone-200 transition hover:border-amber-400 hover:text-amber-400 hover:shadow-md"
          >
            Knowledge Base
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
