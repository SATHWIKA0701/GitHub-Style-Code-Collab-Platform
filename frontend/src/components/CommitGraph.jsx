export const CommitGraph = ({ commits = [] }) => {
  return (
    <div className="card commit-graph-card">
      <div className="section-header">
        <h3>Commit graph</h3>
      </div>

      {commits.length === 0 ? (
        <div className="empty-state">No commit graph data available.</div>
      ) : (
        <div className="commit-graph-wrapper">
          {commits.map((commit) => (
            <div className="commit-graph-item" key={commit.hash}>
              <div className="commit-line-section">
                <div className="commit-dot" />
                <div className="commit-line" />
              </div>

              <div className="commit-content">
                <p className="commit-message">{commit.message || 'Untitled commit'}</p>
                <div className="commit-meta">
                  <span>{commit.author || 'Unknown author'}</span>
                  <span className="commit-hash">{commit.hash?.slice(0, 7) || ''}</span>
                </div>
                <small>{commit.date ? new Date(commit.date).toLocaleString() : ''}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};