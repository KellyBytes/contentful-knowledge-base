import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ContentfulImage from '../ui/ContentfulImage';
import DateComponent from '../ui/DateComponent';

const PostHeader = ({ post }) => {
  const { title, coverImage, date } = post.fields;

  return (
    <header className="not-prose mb-12 pb-8 border-b border-slate-200">
      <Link
        href={`/posts`}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
      >
        <ArrowLeft
          className="size-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Back to Posts
      </Link>

      <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="flex justify-between items-center mb-10">
        <DateComponent
          dateString={date}
          className="mt-2 text-sm text-slate-400"
        />
      </div>

      <div className="relative w-full aspect-3/2 mb-8 md:mb-16 sm:mx-0">
        <ContentfulImage
          alt={`Cover Image for ${title}`}
          src={coverImage.fields.file.url}
          fill
          sizes="max-width: 768px) 100vw, 1200px"
          className="object-cover"
          loading="eager"
        />
      </div>
    </header>
  );
};

export default PostHeader;
