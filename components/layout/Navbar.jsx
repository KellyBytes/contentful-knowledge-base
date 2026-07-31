import Link from 'next/link';

const Navbar = () => {
  return (
    <nav
      className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8
"
    >
      <ul className="flex gap-4">
        <li>
          <Link
            href="/"
            className="text-sm font-medium uppercase text-stone-400"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/posts"
            className="text-sm font-medium uppercase text-stone-400"
          >
            Posts
          </Link>
        </li>
        <li>
          <Link
            href="/kb"
            className="text-sm font-medium uppercase text-stone-400"
          >
            Knowledge Base
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
