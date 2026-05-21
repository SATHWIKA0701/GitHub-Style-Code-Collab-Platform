import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { pushToast } = useApp();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      pushToast('Account created. Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page enhanced-auth-page">
      <form className="auth-card enhanced-auth-card" onSubmit={submit}>
        

        <h2>Create your account</h2>
        <p className="auth-subtitle">
          Join Code Collab and start managing repositories with your team.
        </p>

        <FormField label="Username">
          <input
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            placeholder="Enter username"
            required
            minLength={3}
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            placeholder="Enter email address"
            required
          />
        </FormField>

        <FormField label="Password">
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            placeholder="Minimum 8 characters"
            required
            minLength={8}
          />
        </FormField>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};