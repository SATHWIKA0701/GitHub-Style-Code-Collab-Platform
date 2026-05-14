import { Link } from 'react-router-dom';

export const LandingPage = () => (
  <div className="landing-page">
    <div className="landing-card">
      <div className="eyebrow">✨ code-collab-platform</div>
      <h1>Version control and collaboration in one clean workspace.</h1>
      <p>Build repositories, manage branches, review pull requests, track issues, and ship together.</p>
      <div className="cta-row">
        <Link className="primary-button" to="/register">Create Account</Link>
        <Link className="secondary-button" to="/login">Login</Link>
      </div>
    </div>
  </div>
);
