import { getCategories } from '@/lib/contentful/kb';
import Link from 'next/link';

export default async function NotFound() {
  const categories = await getCategories();

  return (
    <section className="flex flex-col h-full items-center justify-center">
      <h1 className="mb-4 text-3xl font-bold">Category Not Found</h1>

      <p className="mb-8">
        The category may have been removed or the URL is incorrect.
      </p>

      <ul className="max-w-xl mx-auto flex flex-wrap justify-center gap-2 mb-8">
        {categories.map(category => (
          <li key={category.sys.id}>
            <Link
              href={`/kb/${category.fields.slug}`}
              className="px-3 py-1 rounded-lg border text-sm border-slate-300 transition hover:border-amber-400 hover:text-amber-600 hover:shadow-md"
            >
              {category.fields.name}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/kb"
        className="inline-block rounded-lg bg-stone-600 px-5 py-2 text-white hover:bg-stone-700"
      >
        <span aria-hidden="true">←</span> Back to Knowledge Base
      </Link>
    </section>
  );
}
