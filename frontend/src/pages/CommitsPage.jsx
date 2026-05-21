import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { gitApi } from '../api/services';
import { CommitGraph } from '../components/CommitGraph';

export const CommitsPage = () => {
  const { repo } = useOutletContext();

  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDiff, setCommitDiff] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCommits = async (branch = '', currentPage = 1) => {
    try {
      let data;
      if (branch) {
        data = await gitApi.commitsByBranch(repo.name, branch);
        setCommits(data.all || []);
        setTotalPages(1); // No pagination for branches yet
      } else {
        const res = await gitApi.commits(repo.name, currentPage);
        setCommits(res.data || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (error) {
      setCommits([]);
    }
  };

  useEffect(() => {
    loadCommits(selectedBranch, page);

    gitApi
      .branches(repo.name)
      .then((data) => {
        setBranches(data.all || []);
      })
      .catch(() => {
        setBranches([]);
      });
  }, [repo.name, page, selectedBranch]);

  const openCommit = async (commit) => {
    try {
      setSelectedCommit(commit);

      const data = await gitApi.commitDetails(
        repo.name,
        commit.hash || commit.hash
      );

      setCommitDiff(data.diff || '');
    } catch (error) {
      setCommitDiff('Failed to load commit details');
    }
  };

  return (
    <div className="stack-md">
      <div className="card">
        <div className="section-header">
          <h3>Commit History</h3>

          <select
            value={selectedBranch}
            onChange={(e) => {
              const branch = e.target.value;
              setSelectedBranch(branch);
              setPage(1);
            }}
          >
            <option value="">All Branches</option>

            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
      </div>

      {commits.length > 0 && !selectedBranch && (
        <CommitGraph
          commits={commits.map((commit) => ({
            hash: commit.hash,
            message: commit.message || commit.subject,
            author: commit.author_name || commit.authorName,
            date: commit.date,
          }))}
        />
      )}

      {(selectedBranch || commits.length === 0) && (
        <div className="card list-stack">
          {commits.map((commit) => (
            <button
              key={commit.hash}
              className="list-row"
              onClick={() => openCommit(commit)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div>
                <strong>
                  {commit.subject || commit.message}
                </strong>

                <p>
                  {commit.authorName || commit.author_name}
                </p>

                <small>
                  {(commit.shortHash || commit.hash?.slice(0, 7)) ?? ''}
                </small>
              </div>

              <span>
                {new Date(commit.date).toLocaleString()}
              </span>
            </button>
          ))}

          {!commits.length && (
            <div className="empty-card">
              No commits yet.
            </div>
          )}
        </div>
      )}


      {selectedCommit && (
        <div className="card stack-md">
          <div className="section-header">
            <div>
              <h3>
                Commit Details
              </h3>

              <p>
                {selectedCommit.subject || selectedCommit.message}
              </p>
            </div>
          </div>

          <div className="diff-view">
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}
            >
              {commitDiff}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};