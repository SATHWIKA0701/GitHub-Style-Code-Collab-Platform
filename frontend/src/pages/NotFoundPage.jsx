import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="empty-state card">
    <h1>404</h1>
    <p>The page you’re looking for does not exist.</p>
    <Link className="primary-button" to="/dashboard">Back to dashboard</Link>
  </div>
);
