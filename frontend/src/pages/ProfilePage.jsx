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
        <div className="meta-row"><span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span></div>
      </div>
    </div>
  );
};
