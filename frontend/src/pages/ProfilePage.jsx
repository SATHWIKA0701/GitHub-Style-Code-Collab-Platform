//ProfilePage.jsx
import { useAuth } from '../contexts/AuthContext';

export const ProfilePage = () => {
  const { user } = useAuth();
  return (
    <div className="card profile-card">
      <div className="avatar">{user?.username?.slice(0, 2).toUpperCase()}</div>
      <div className="stack-sm">
        <h1>{user?.username}</h1>
        <p>{user?.email}</p>
        <div className="meta-row"><span>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span></div>
      </div>
    </div>
  );
};
