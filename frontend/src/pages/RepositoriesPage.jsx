import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { repoApi } from '../api/services';

export const RepositoriesPage = () => {
  const [repos, setRepos] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    repoApi
      .list(page)
      .then((res) => {
        setRepos(res.data || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch(() => setRepos([]));
  }, [page]);

  const filtered = useMemo(
    () =>
      repos.filter((repo) =>
        repo.name.toLowerCase().includes(query.toLowerCase())
      ),
    [repos, query]
  );

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1>Repositories</h1>
          <p>Browse every repository you can access.</p>

          <div style={{ marginTop: '1rem' }}>
            <Link
              className="primary-button"
              to="/repositories/new"
            >
              New repository
            </Link>
          </div>
        </div>
      </div>

      <div className="card toolbar">
        <input
          placeholder="Find a repository…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="repo-grid">
        {filtered.map((repo) => (
          <Link
            key={repo._id}
            to={`/repos/${repo._id}`}
            className="repo-card card hover-card"
          >
            <div className="section-header">
              <strong>{repo.name}</strong>
              <span className="pill">{repo.visibility}</span>
            </div>

            <p>{repo.description || 'No description yet.'}</p>

            <div className="meta-row">
              <span>{repo.defaultBranch || 'main'}</span>
              <span>
                {new Date(repo.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}

        {!filtered.length && (
          <div className="empty-card">
            No repositories match your search.
          </div>
        )}
      </div>

    </div>
  );
};