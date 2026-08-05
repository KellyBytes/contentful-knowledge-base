import Link from 'next/link';
import ContentfulImage from '../ui/ContentfulImage';
import DateComponent from '../ui/DateComponent';

const PostCard = ({ post }) => {
  const { title, slug, excerpt, coverImage, date } = post.fields;

  return (
    <li>
      <Link
        href={`/posts/${slug}`}
        className="group flex h-full flex-col rounded-xl border border-slate-200 transition hover:border-amber-400 hover:shadow-md"
        aria-label={title}
      >
        <div className="relative w-full aspect-3/2">
          <ContentfulImage
            alt={`Cover Image for ${title}`}
            src={coverImage.fields.file.url}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            loading="eager"
          />
        </div>

        <div className="p-4">
          <h3 className="mb-1 text-lg font-semibold leading-snug group-hover:text-amber-600">
            {title}
          </h3>
          <div className="text-sm mb-4 text-slate-400">
            <DateComponent dateString={date} />
          </div>
          <p className="mb-4 text-base leading-snug">{excerpt}</p>
        </div>
      </Link>
    </li>
  );
};

export default PostCard;
