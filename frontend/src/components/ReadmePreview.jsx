import ReactMarkdown from 'react-markdown';

export const ReadmePreview = ({
  content,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '24px',
      }}
    >
      <h2
        style={{
          marginBottom: '20px',
        }}
      >
        README
      </h2>

      <div className="markdown-body">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};