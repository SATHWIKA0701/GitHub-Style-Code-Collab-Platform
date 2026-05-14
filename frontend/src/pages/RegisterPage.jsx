import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { pushToast } = useApp();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form);
      pushToast('Account created. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <form className="auth-card card" onSubmit={submit}>
        <h2>Create account</h2>
        <FormField label="Username"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required minLength={3} /></FormField>
        <FormField label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></FormField>
        <FormField label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></FormField>
        {error ? <div className="error-banner">{error}</div> : null}
        <button className="primary-button" disabled={loading}>{loading ? 'Creating…' : 'Create Account'}</button>
        <p className="subtle">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
};
