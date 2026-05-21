import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { pushToast } = useApp();

  const [form, setForm] = useState({
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
      await login(form);
      pushToast('Logged in successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = () => {
    pushToast('Forgot password feature will be available soon');
  };

  return (
    <div className="auth-page enhanced-auth-page">
      <form className="auth-card enhanced-auth-card" onSubmit={submit}>
        

        <h2>Welcome back</h2>
        <p className="auth-subtitle">
          Sign in to continue collaborating with your team.
        </p>

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
            placeholder="Enter password"
            required
          />
        </FormField>

       <div className="auth-helper-row">
  <Link
    to="/forgot-password"
    className="auth-link-button"
  >
    Forgot password?
  </Link>
</div>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>

        <p className="auth-switch-text ">
          New here? <Link to="/register">Create your account</Link>
        </p>
      </form>
    </div>
  );
};