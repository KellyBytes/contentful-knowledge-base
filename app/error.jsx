'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const Error = ({ error, reset }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-col h-full items-center justify-center">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="mb-4 text-3xl font-bold">Something Went Wrong</h1>

        <p className="mb-8">
          An unexpected error occurred while loading this page. Trying again
          often resolves it.
        </p>

        {error.digest && (
          <p className="mb-8 text-sm">
            Reference: <code>{error.digest}</code>
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onLick={reset}
            className="inline-block px-5 py-2 rounded-lg font-semibold text-white bg-stone-600 border border-stone-600 transition hover:bg-stone-500 hover:shadow-md"
          >
            Try again
          </button>

          <Link
            href="/"
            className="inline-block px-5 py-3  rounded-lg font-semibold border border-slate-300 transition hover:border-amber-400 hover:text-amber-600 hover:shadow-md"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Error;
