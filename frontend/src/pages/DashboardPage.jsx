import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi, repoApi } from '../api/services';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [repos, setRepos] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    repoApi.list().then((res) => setRepos(res.data)).catch(() => setRepos([]));
    notificationApi.list().then((res) => setNotifications(res.data || [])).catch(() => setNotifications([]));
  }, []);

  const recentRepos = useMemo(() => repos.slice(0, 5), [repos]);

  return (
    <div className="stack-lg">
      <section className="hero-strip card">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>Welcome back, {user?.username} 👋</h1>
          <p>Your repositories, pull requests, issues, and notifications stay in sync here.</p>
        </div>
        <Link to="/repositories/new" className="primary-button">New repository</Link>
      </section>
      <div className="dashboard-grid">
        <section className="card dashboard-profile-card">
          <div className="dashboard-avatar">{user?.username?.slice(0, 2).toUpperCase()}</div>
          <div className="stack-sm">
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
          </div>
          <Link to="/profile" className="primary-button">
            Edit profile
          </Link>
        </section>

        <section className="card">
          <div className="section-header"><h3>Recent repositories</h3><Link to="/repositories">View all</Link></div>
          <div className="list-stack">
            {recentRepos.length ? recentRepos.map((repo) => (
              <Link key={repo._id} to={`/repos/${repo._id}`} className="list-row">
                <div><strong>{repo.name}</strong><p>{repo.description || 'No description yet.'}</p></div>
                <span className="pill">{repo.visibility}</span>
              </Link>
            )) : <div className="empty-card">No repositories yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
