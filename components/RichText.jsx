import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import Link from 'next/link';
import ContentfulImage from '@/components/ui/ContentfulImage';

const options = {
  renderMark: {
    [MARKS.CODE]: text => {
      return (
        <pre>
          <code>{text}</code>
        </pre>
      );
    },
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => {
      if (
        node.content.find(item =>
          item.marks?.find(mark => mark.type === 'code'),
        )
      ) {
        return (
          <div>
            <pre>
              <code>{children}</code>
            </pre>
          </div>
        );
      }
      return <p>{children}</p>;
    },
    [INLINES.ENTRY_HYPERLINK]: (node, children) => {
      const target = node.data.target;
      if (target?.sys.contentType.sys.id === 'post') {
        return (
          <Link href={`/posts/${target.fields.slug}`}>
            {target.fields.title}
          </Link>
        );
      }
      return <>{children}</>;
    },
    [INLINES.HYPERLINK]: (node, children) => (
      <a href={node.data.uri} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    [BLOCKS.EMBEDDED_ENTRY]: node => {
      const target = node.data.target;
      if (target?.sys.contentType.sys.id === 'videoEmbed') {
        return (
          <iframe
            width="100%"
            height="400"
            src={target.fields.embedUrl}
            title={target.fields.title}
            allowFullScreen={true}
          />
        );
      }
      return null;
    },
    [BLOCKS.EMBEDDED_ASSET]: node => {
      const target = node.data.target;
      return (
        <ContentfulImage
          src={target.fields.file.url}
          height={target.fields.file.details.image.height}
          width={target.fields.file.details.image.width}
          alt={target.fields.title ?? ''}
          className="size-20"
        />
      );
    },
  },
};

const RichText = ({ content }) => {
  return <>{documentToReactComponents(content, options)}</>;
};

export default RichText;
