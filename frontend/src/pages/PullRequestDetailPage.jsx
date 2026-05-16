import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { prApi } from '../api/services';
import { useApp } from '../contexts/AppContext';

export const PullRequestDetailPage = () => {
  const { prId } = useParams();
  const { pushToast } = useApp();
  const [pr, setPr] = useState(null);
  const [comments, setComments] = useState([]);
  const [diff, setDiff] = useState('');
  const [form, setForm] = useState({ prId, filePath: '', lineNumber: '', comment: '' });

  const load = async () => {
    const detail = await prApi.detail(prId);
    setPr(detail);
    const res = await prApi.comments(prId);
    setComments(res.data);
    const diffData = await prApi.diff(
  detail.repoId?.name,
  detail.sourceBranch,
  detail.targetBranch
);
  };

  useEffect(() => { load().catch(() => {}); }, [prId]);
  if (!pr) return <div className="loader-card">Loading pull request…</div>;

  return (
    <div className="stack-lg">
      <section className="card stack-md">
        <div className="section-header"><h1>{pr.title}</h1><span className={`pill ${pr.status === 'merged' ? 'pill-success' : ''}`}>{pr.status}</span></div>
        <p>{pr.description || 'No description provided.'}</p>
        <div className="meta-row"><span>{pr.repoId?.name}</span><span>{pr.sourceBranch} → {pr.targetBranch}</span><span>{pr.createdBy?.username || 'Unknown author'}</span></div>
        {pr.status !== 'merged' && <button className="primary-button" onClick={async () => { await prApi.merge(pr._id); pushToast('Pull request merged'); load(); }}>Merge pull request</button>}
      </section>
      <div className="split-grid two">
        <div className="card stack-md">
          <h3>Diff preview</h3>
          <pre className="diff-block">{diff || 'No diff available yet.'}</pre>
        </div>
        <div className="card stack-md">
          <h3>Review comments</h3>
          <div className="list-stack">{comments.map((comment) => <div key={comment._id} className="list-row compact"><strong>{comment.filePath || 'General'}</strong><span>{comment.comment}</span></div>)}</div>
          <form className="stack-md" onSubmit={async (e) => { e.preventDefault(); await prApi.addComment({ ...form, lineNumber: Number(form.lineNumber || 1) }); setForm({ prId, filePath: '', lineNumber: '', comment: '' }); pushToast('Review comment added'); load(); }}>
            <FormField label="File path"><input value={form.filePath} onChange={(e) => setForm({ ...form, filePath: e.target.value })} /></FormField>
            <FormField label="Line number"><input type="number" min="1" value={form.lineNumber} onChange={(e) => setForm({ ...form, lineNumber: e.target.value })} /></FormField>
            <FormField label="Comment"><textarea rows="4" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required /></FormField>
            <button className="primary-button">Add review comment</button>
          </form>
        </div>
      </div>
    </div>
  );
};
