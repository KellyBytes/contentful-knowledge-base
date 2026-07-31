import Link from 'next/link';
import ContentfulImage from '../ui/ContentfulImage';
import DateComponent from '../ui/DateComponent';
import Avatar from '../ui/Avatar';

const PostCard = ({ post }) => {
  const { title, slug, excerpt, coverImage, author, date } = post.fields;

  return (
    <li className="rounded-md overflow-hidden shadow-md">
      <Link href={`/posts/${slug}`} aria-label={title}>
        <div className="relative h-48 w-full">
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
          <h3 className="text-xl mb-1 leading-snug">{title}</h3>
          <div className="text-sm mb-4 text-gray-400">
            <DateComponent dateString={date} />
          </div>
          <p className="text-base mb-4">{excerpt}</p>
          <Avatar name={author.fields.name} picture={author.fields.picture} />
        </div>
      </Link>
    </li>
  );
};

export default PostCard;
