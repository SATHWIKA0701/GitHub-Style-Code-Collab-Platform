import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { repoApi } from '../api/services';
import { RepoSidebar } from '../components/RepoSidebar';
import { useApp } from '../contexts/AppContext';

export const RepositoryPage = () => {
  const { repoId } = useParams();
  const [repo, setRepo] = useState(null);
  const location = useLocation();
  const { setCurrentRepo } = useApp();

  useEffect(() => {
    repoApi.detail(repoId).then((data) => { setRepo(data); setCurrentRepo(data); }).catch(() => setRepo(null));
    return () => setCurrentRepo(null);
  }, [repoId]);

  if (!repo) return <div className="loader-card">Loading repository…</div>;

  return (
    <div className="repo-layout">
      <div className="repo-main stack-lg">
        <section className="repo-banner card">
          <div>
            <div className="eyebrow">Repository</div>
            <h1>{repo.name}</h1>
            <p>{repo.description || 'No description yet.'}</p>
          </div>
          <div className="repo-banner-meta">
            <span className="pill">{repo.visibility}</span>
            <span className="pill">default: {repo.defaultBranch}</span>
          </div>
        </section>
        {location.pathname === `/repos/${repoId}` ? (
          <div className="code-overview card">
            <div className="overview-grid">
              <Link to={`/repos/${repoId}/files`} className="hover-card compact-card"><strong>Files</strong><p>Browse and edit repository content.</p></Link>
              <Link to={`/repos/${repoId}/commits`} className="hover-card compact-card"><strong>Commits</strong><p>Inspect the latest commit history.</p></Link>
              <Link to={`/repos/${repoId}/branches`} className="hover-card compact-card"><strong>Branches</strong><p>Create, switch, and merge branches.</p></Link>
              <Link to={`/repos/${repoId}/pulls`} className="hover-card compact-card"><strong>Pull requests</strong><p>Open, review, and merge pull requests.</p></Link>
            </div>
          </div>
        ) : <Outlet context={{ repo, refreshRepo: () => repoApi.detail(repoId).then(setRepo) }} />}
      </div>
      <RepoSidebar repoId={repoId} />
    </div>
  );
};
