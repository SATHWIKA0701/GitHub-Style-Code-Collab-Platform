import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { gitApi } from '../api/services';

export const CommitsPage = () => {
  const { repo } = useOutletContext();

  const [commits, setCommits] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCommits = async (currentPage = 1) => {
    try {
      const res = await gitApi.commits(repo.name, currentPage);

      setCommits(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      setCommits([]);
    }
  };

  useEffect(() => {
    loadCommits(page);
  }, [repo.name, page]);

  return (
    <div className="card list-stack">
      <div className="section-header">
        <h3>Commit history</h3>
      </div>

      {commits.map((commit) => (
        <div className="list-row" key={commit.hash}>
          <div>
            <strong>{commit.message}</strong>
            <p>{commit.author_name}</p>
          </div>

          <span>{commit.date}</span>
        </div>
      ))}

      {!commits.length && (
        <div className="empty-card">
          No commits yet.
        </div>
      )}

      <div className="button-row">
        <button
          className="secondary-button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          className="secondary-button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};