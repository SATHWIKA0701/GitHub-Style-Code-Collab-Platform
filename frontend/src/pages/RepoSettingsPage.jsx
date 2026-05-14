import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { authApi, repoApi } from '../api/services';
import { FormField } from '../components/FormField';
import { useApp } from '../contexts/AppContext';

export const RepoSettingsPage = () => {
  const { repo, refreshRepo } = useOutletContext();
  const { pushToast } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [role, setRole] = useState('collaborator');

  useEffect(() => {
    if (!query.trim()) return setResults([]);
    const id = setTimeout(() => authApi.searchUsers(query).then(setResults).catch(() => setResults([])), 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="split-grid two">
      <div className="card stack-md">
        <h3>Collaborators</h3>
        <div className="list-stack">
          {(repo.collaborators || []).map((person) => (
            <div key={person._id || person.userId?._id || person.userId} className="list-row compact">
              <strong>{person.userId?.username || person.userId}</strong>
              <span className="pill">{person.role}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card stack-md">
        <h3>Invite member</h3>
        <FormField label="Find user by username or email"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="octocat@example.com" /></FormField>
        <FormField label="Role">
          <select value={role} onChange={(e) => setRole(e.target.value)}><option value="collaborator">Collaborator</option><option value="viewer">Viewer</option></select>
        </FormField>
        <div className="list-stack">
          {results.map((user) => (
            <div key={user.id} className="list-row compact">
              <div><strong>{user.username}</strong><p>{user.email}</p></div>
              <button className="primary-button small" onClick={async () => { await repoApi.addCollaborator(repo._id, { userId: user.id, role }); pushToast('Collaborator updated'); refreshRepo(); }}>Invite</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
