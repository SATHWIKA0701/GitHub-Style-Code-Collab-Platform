//ProfilePage.jsx
import { useEffect, useState } from 'react';
import { FormField } from '../components/FormField';
import { authApi } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { pushToast } = useApp();
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const avatarOptions = ['1', '2', '3', '4', '5'];
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || '',
      });
      setSelectedAvatar(user.avatar || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...profileForm, avatar: selectedAvatar || profileForm.avatar };
    await authApi.updateProfile(payload);
    await refreshProfile();
    pushToast('Profile updated');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    await authApi.updateProfile(passwordForm);
    setPasswordForm({ currentPassword: '', newPassword: '' });
    pushToast('Password updated');
  };

  return (
    <div className="stack-md">
      <div className="card profile-card">
        <div className={`profile-avatar ${selectedAvatar ? `avatar-${selectedAvatar}` : ''}`}>
          <div className="avatar-preview">
            {selectedAvatar === '1' && <span className="animal-emoji">🐰</span>}
            {selectedAvatar === '2' && <span className="animal-emoji">🐸</span>}
            {selectedAvatar === '3' && <span className="animal-emoji">🐳</span>}
            {selectedAvatar === '4' && <span className="animal-emoji">🐶</span>}
            {selectedAvatar === '5' && <span className="animal-emoji">🦖</span>}
            {!selectedAvatar && (
              <div className="avatar-person">
                <div className="avatar-ear left" />
                <div className="avatar-ear right" />
                <div className="avatar-head">
                  <div className="avatar-eye left" />
                  <div className="avatar-eye right" />
                  <div className="avatar-cheek left" />
                  <div className="avatar-cheek right" />
                  <div className="avatar-nose" />
                  <div className="avatar-mouth" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="stack-sm">
          <h1>{user?.username}</h1>
          <p>{user?.email}</p>
          <div className="meta-row">
            <span>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="split-grid two">
        <form className="card stack-md" onSubmit={handleProfileSubmit}>
          <h2>Public profile</h2>
          <FormField label="Username">
            <input
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            />
          </FormField>
          <FormField label="Email">
            <input
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </FormField>

            <FormField label="Avatar">
              <div className="avatar-grid">
                  {avatarOptions.map((opt) => {
                    const emoji = opt === '1' ? '🐰' : opt === '2' ? '🐸' : opt === '3' ? '🐳' : opt === '4' ? '🐶' : '🦖';
                    return (
                      <button
                        key={opt}
                        type="button"
                        className={`avatar-option ${selectedAvatar === opt ? 'selected' : ''} avatar-${opt}`}
                        onClick={() => setSelectedAvatar(opt)}
                        aria-pressed={selectedAvatar === opt}
                      >
                        <span className="animal-emoji">{emoji}</span>
                      </button>
                    );
                  })}
                </div>
            </FormField>
          <button className="primary-button">Save profile</button>
        </form>

        <form className="card stack-md" onSubmit={handlePasswordSubmit}>
          <h2>Password</h2>
          <FormField label="Current password">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </FormField>
          <FormField label="New password">
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </FormField>
          <button className="secondary-button">Update password</button>
        </form>
      </div>
    </div>
  );
};
