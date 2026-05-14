import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { repoApi } from '../api/services';
import { useApp } from '../contexts/AppContext';

export const NewRepositoryPage = () => {
  const navigate = useNavigate();
  const { pushToast } = useApp();
  const [form, setForm] = useState({ name: '', description: '', visibility: 'private', defaultBranch: 'main' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const repo = await repoApi.create(form);
      pushToast('Repository created');
      navigate(`/repos/${repo._id}`);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <form className="card form-card stack-md" onSubmit={submit}>
      <div><h1>Create a new repository</h1><p>Start with a clean repo and a main branch ready for commits.</p></div>
      <FormField label="Repository name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} /></FormField>
      <FormField label="Description"><textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
      <div className="split-grid">
        <FormField label="Visibility">
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="private">Private</option><option value="public">Public</option></select>
        </FormField>
        <FormField label="Default branch"><input value={form.defaultBranch} onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })} /></FormField>
      </div>
      {error ? <div className="error-banner">{error}</div> : null}
      <button className="primary-button" disabled={loading}>{loading ? 'Creating…' : 'Create repository'}</button>
    </form>
  );
};
