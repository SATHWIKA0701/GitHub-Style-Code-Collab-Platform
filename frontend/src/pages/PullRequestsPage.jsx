import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { prApi } from '../api/services';
import { Modal } from '../components/Modal';
import { useApp } from '../contexts/AppContext';

export const PullRequestsPage = () => {
  const { repo } = useOutletContext();
  const navigate = useNavigate();
  const { pushToast } = useApp();
  const [prs, setPrs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ repoName: repo.name, title: '', description: '', sourceBranch: '', targetBranch: repo.defaultBranch || 'main' });

  const load = () => prApi.list(repo.name).then(setPrs);
  useEffect(() => { load(); }, [repo.name]);

  return (
    <div className="stack-lg">
      <div className="section-header"><h2>Pull requests</h2><button className="primary-button" onClick={() => setOpen(true)}>New pull request</button></div>
      <div className="card list-stack">
        {prs.map((pr) => (
          <button key={pr._id} className="list-row" onClick={() => navigate(`/pulls/${pr._id}`)}>
            <div><strong>{pr.title}</strong><p>{pr.sourceBranch} → {pr.targetBranch}</p></div>
            <span className={`pill ${pr.status === 'merged' ? 'pill-success' : ''}`}>{pr.status}</span>
          </button>
        ))}
        {!prs.length && <div className="empty-card">No pull requests yet.</div>}
      </div>
      <Modal open={open} title="Open pull request" onClose={() => setOpen(false)}>
        <form className="stack-md" onSubmit={async (e) => { e.preventDefault(); const pr = await prApi.create(form); pushToast('Pull request created'); setOpen(false); load(); navigate(`/pulls/${pr._id}`); }}>
          <FormField label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></FormField>
          <FormField label="Description"><textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <div className="split-grid">
            <FormField label="Source branch"><input value={form.sourceBranch} onChange={(e) => setForm({ ...form, sourceBranch: e.target.value })} required /></FormField>
            <FormField label="Target branch"><input value={form.targetBranch} onChange={(e) => setForm({ ...form, targetBranch: e.target.value })} required /></FormField>
          </div>
          <button className="primary-button">Create pull request</button>
        </form>
      </Modal>
    </div>
  );
};
