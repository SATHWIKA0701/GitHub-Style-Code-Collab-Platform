import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-shell"><div className="loader-card">Loading session…</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
