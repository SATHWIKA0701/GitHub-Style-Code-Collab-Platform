import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastStack } from '../components/ToastStack';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/dashboard" className="brand">code-collab-platform</Link>
          <nav className="top-nav">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/repositories">Repositories</NavLink>
            <NavLink to="/notifications">Notifications</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </nav>
          <div className="top-user">
            <span>{user?.username}</span>
            <button className="ghost-button" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <main className="page-shell"><Outlet /></main>
      <ToastStack />
    </div>
  );
};
