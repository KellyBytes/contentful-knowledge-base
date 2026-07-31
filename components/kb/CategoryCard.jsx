import Link from 'next/link';
import CategoryIcon from '@/lib/icons';

const CategoryCard = ({ category, articleCount }) => {
  const { name, slug, description, icon } = category.fields;

  return (
    <li>
      <Link
        href={`/kb/${slug}`}
        className="group flex h-full flex-col p-6 rounded-xl border border-slate-200 transition hover:border-amber-400 hover:shadow-md"
      >
        <span className="inline-flex items-center justify-center size-11 rounded-lg bg-amber-50 text-amber-600">
          <CategoryIcon name={icon} className="size-5" />;
        </span>

        <h2 className="mt-4 text-lg font-bold group-hover:text-amber-600">
          {name}
        </h2>

        <p className="flex-1 mt-2 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-400">
          {articleCount} {articleCount === 1 ? 'article' : 'articles'}
        </p>
      </Link>
    </li>
  );
};

export default CategoryCard;
