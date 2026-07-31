import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const ArticleBody = ({ article }) => {
  const { body } = article.fields;

  if (!body) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
    >
      {body}
    </ReactMarkdown>
  );
};

export default ArticleBody;
