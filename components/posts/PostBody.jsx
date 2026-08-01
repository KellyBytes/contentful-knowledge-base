import RichText from '../RichText';

const PostBody = ({ post }) => {
  const { content } = post.fields;

  return (
    <div className="prose max-w-4xl mx-auto">
      <RichText content={content} />
    </div>
  );
};

export default PostBody;
