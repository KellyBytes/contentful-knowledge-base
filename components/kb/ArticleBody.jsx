import Markdown from '../Markdown';

const ArticleBody = ({ article }) => <Markdown>{article.fields.body}</Markdown>;

export default ArticleBody;
