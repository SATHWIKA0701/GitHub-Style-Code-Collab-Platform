//login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { pushToast } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form);
      pushToast('Logged in successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <form className="auth-card card" onSubmit={submit}>
        <h2>Sign in</h2>
        <FormField label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></FormField>
        <FormField label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></FormField>
        {error ? <div className="error-banner">{error}</div> : null}
        <button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        <p className="subtle">New here? <Link to="/register">Create your account</Link></p>
      </form>
    </div>
  );
};
