import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/services';
import { FormField } from '../components/FormField';
import { useApp } from '../contexts/AppContext';

export const ForgotPasswordPage = () => {
  const { pushToast } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authApi.forgotPassword({ email });
      setMessage('Password reset instructions have been sent if this email exists.');
      pushToast('Reset request submitted');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page enhanced-auth-page">
      <form className="auth-card enhanced-auth-card" onSubmit={submit}>
        

        <h2>Forgot password?</h2>

        <p className="auth-subtitle">
          Enter your email address and we’ll help you reset your password.
        </p>

        <FormField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
        </FormField>

        {error ? <div className="error-banner">{error}</div> : null}

        {message ? (
          <div className="success-banner">
            {message}
          </div>
        ) : null}

        <button className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <p className="auth-switch-text">
          Remember password? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};