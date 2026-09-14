import RichText from '../RichText';

const PostBody = ({ post }) => {
  const { content } = post.fields;

  return (
    <div className="prose max-w-4xl mx-auto [&_ul_p]:my-0 [&_ol_p]:my-0 prose-li:my-0">
      <RichText content={content} />
    </div>
  );
};

export default PostBody;
