import { useState } from 'react';
import { authApi } from '../api/services';
import { FormField } from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const SettingsPage = () => {
  const { user, refreshProfile } = useAuth();
  const { pushToast } = useApp();
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

  return (
    <div className="split-grid two">
      <form className="card stack-md" onSubmit={async (e) => { e.preventDefault(); await authApi.updateProfile(profileForm); await refreshProfile(); pushToast('Profile updated'); }}>
        <h2>Public profile</h2>
        <FormField label="Username"><input value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} /></FormField>
        <FormField label="Email"><input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></FormField>
        <button className="primary-button">Save profile</button>
      </form>
      <form className="card stack-md" onSubmit={async (e) => { e.preventDefault(); await authApi.updateProfile(passwordForm); setPasswordForm({ currentPassword: '', newPassword: '' }); pushToast('Password updated'); }}>
        <h2>Password</h2>
        <FormField label="Current password"><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></FormField>
        <FormField label="New password"><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></FormField>
        <button className="secondary-button">Update password</button>
      </form>
    </div>
  );
};
