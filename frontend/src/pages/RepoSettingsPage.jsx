import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { authApi, repoApi } from '../api/services';
import { FormField } from '../components/FormField';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export const RepoSettingsPage = () => {
  const { repo, refreshRepo } = useOutletContext();
  const { pushToast } = useApp();
  const { user } = useAuth();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [role, setRole] = useState('collaborator');

  const [labels, setLabels] = useState([]);
  const [labelForm, setLabelForm] = useState({ name: '', color: '#3b82f6', description: '' });

  const loadLabels = () => repoApi.labels(repo._id).then(setLabels).catch(() => {});

  useEffect(() => {
    loadLabels();
  }, [repo._id]);

  useEffect(() => {
    if (!query.trim()) return setResults([]);
    const id = setTimeout(() => authApi.searchUsers(query).then(setResults).catch(() => setResults([])), 300);
    return () => clearTimeout(id);
  }, [query]);

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    try {
      await repoApi.createLabel(repo._id, labelForm);
      pushToast('Label created');
      setLabelForm({ name: '', color: '#3b82f6', description: '' });
      loadLabels();
    } catch (error) {
      pushToast(error.response?.data?.message || 'Error creating label');
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await repoApi.deleteLabel(repo._id, labelId);
      pushToast('Label deleted');
      loadLabels();
    } catch (error) {
      pushToast(error.response?.data?.message || 'Error deleting label');
    }
  };

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
          {results.map((u) => (
            <div key={u.id} className="list-row compact">
              <div><strong>{u.username}</strong><p>{u.email}</p></div>
              <button className="primary-button small" onClick={async () => { await repoApi.addCollaborator(repo._id, { userId: u.id, role }); pushToast('Collaborator updated'); refreshRepo(); }}>Invite</button>
            </div>
          ))}
        </div>
      </div>
      <div className="card stack-md">
        <h3>Labels</h3>
        <form onSubmit={handleCreateLabel} className="list-row compact" style={{ alignItems: 'flex-end' }}>
          <FormField label="Name"><input value={labelForm.name} onChange={(e) => setLabelForm({ ...labelForm, name: e.target.value })} required placeholder="bug" /></FormField>
          <FormField label="Color"><input type="color" value={labelForm.color} onChange={(e) => setLabelForm({ ...labelForm, color: e.target.value })} required style={{ width: '50px', padding: 0 }} /></FormField>
          <FormField label="Description"><input value={labelForm.description} onChange={(e) => setLabelForm({ ...labelForm, description: e.target.value })} placeholder="Something isn't working" /></FormField>
          <button type="submit" className="primary-button small">Create</button>
        </form>
        <div className="list-stack">
          {labels.map(l => (
            <div key={l._id} className="list-row compact">
              <div>
                <span className="pill" style={{ backgroundColor: l.color, color: '#fff', border: 'none' }}>{l.name}</span>
                <p>{l.description}</p>
              </div>
              <button className="secondary-button small" onClick={() => handleDeleteLabel(l._id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
      {(repo.owner === user?.id || repo.owner?._id === user?.id) && (
        <div className="card stack-md">
          <h3>Danger Zone</h3>
          <div className="list-row compact" style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <strong style={{ color: 'var(--danger, #d73a49)' }}>Archive repository</strong>
              <p>Mark this repository as archived and read-only.</p>
            </div>
            <button
              className="secondary-button"
              style={{ color: 'var(--danger, #d73a49)', borderColor: 'var(--danger, #d73a49)' }}
              onClick={async () => {
                await repoApi.archive(repo._id);
                pushToast(repo.isArchived ? 'Repository unarchived' : 'Repository archived');
                refreshRepo();
              }}
            >
              {repo.isArchived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
