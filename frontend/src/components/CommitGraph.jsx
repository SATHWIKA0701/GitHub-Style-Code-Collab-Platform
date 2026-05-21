export const CommitGraph = ({ commits }) => {
  if (!commits?.length) return null;

  return (
    <div className="card commit-graph-card">
      <div className="section-header">
        <h3>Commit graph</h3>
      </div>

      <div className="commit-graph-wrapper">
        {commits.map((commit, index) => (
          <div
            key={commit.hash}
            className="commit-graph-item"
          >
            {/* Timeline */}
            <div className="commit-line-section">
              <div className="commit-dot" />

              {index !== commits.length - 1 && (
                <div className="commit-line" />
              )}
            </div>

            {/* Commit Card */}
            <div className="commit-content">
              <h4 className="commit-message">
                {commit.message}
              </h4>

              <div className="commit-meta">
                <span>{commit.author}</span>

                <span>
                  {new Date(
                    commit.date
                  ).toLocaleString()}
                </span>
              </div>

              <div className="commit-hash">
                {(commit.hash || "").slice(0, 7)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};