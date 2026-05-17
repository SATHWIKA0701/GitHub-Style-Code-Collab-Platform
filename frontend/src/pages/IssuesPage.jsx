//IssuePage.jsx
import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { issueApi, repoApi } from '../api/services';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { useApp } from '../contexts/AppContext';

export const IssuesPage = () => {
  const { repo } = useOutletContext();
  const { pushToast } = useApp();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [commentText, setCommentText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = () =>
    repoApi
      .issues(repo._id, page)
      .then((res) => {
        setIssues(res.data || []);
        setTotalPages(res.totalPages || 1);
      });
  useEffect(() => {
    load();
  }, [repo._id, page]);

  const openIssue = async (issue) => {
    setSelectedIssue(issue);
    const res = await issueApi.comments(issue._id);
    setComments(res.data || []);
  };

  return (
    <div className="stack-lg">
      <div className="section-header"><h2>Issues</h2><button className="primary-button" onClick={() => setIssueOpen(true)}>New issue</button></div>
      <div className="card list-stack">
        {issues.map((issue) => (
          <button key={issue._id} className="list-row" onClick={() => openIssue(issue)}>
            <div><strong>{issue.title}</strong><p>{issue.description || 'No description'}</p></div>
            <span className={`pill ${issue.status === 'closed' ? 'pill-danger' : ''}`}>{issue.status}</span>
          </button>
        ))}
        {!issues.length && <div className="empty-card">No issues yet.</div>}
      </div>
      {selectedIssue ? (
        <div className="split-grid two">
          <div className="card stack-md">
            <div className="section-header"><h3>{selectedIssue.title}</h3><span className="pill">{selectedIssue.status}</span></div>
            <p>{selectedIssue.description}</p>
            {selectedIssue.status !== 'closed' && <button className="secondary-button" onClick={async () => { await issueApi.close(selectedIssue._id); pushToast('Issue closed'); openIssue({ ...selectedIssue, status: 'closed' }); load(); }}>Close issue</button>}
          </div>
          <div className="card stack-md">
            <h3>Comments</h3>
            <div className="list-stack">
              {comments.map((comment) => <div key={comment._id} className="list-row compact"><strong>{comment.userId?.username || 'User'}</strong><span>{comment.text}</span></div>)}
            </div>
            <textarea rows="4" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Leave a comment" />
            <button className="primary-button" onClick={async () => { await issueApi.addComment(selectedIssue._id, { text: commentText }); setCommentText(''); pushToast('Comment added'); openIssue(selectedIssue); }}>Add comment</button>
          </div>
        </div>
      ) : null}
      <Modal open={issueOpen} title="Create issue" onClose={() => setIssueOpen(false)}>
        <form className="stack-md" onSubmit={async (e) => { e.preventDefault(); await repoApi.createIssue(repo._id, form); setIssueOpen(false); setForm({ title: '', description: '' }); pushToast('Issue created'); load(); }}>
          <FormField label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></FormField>
          <FormField label="Description"><textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <button className="primary-button">Create issue</button>
        </form>
      </Modal>
      <div className="button-row">
        <button
          className="secondary-button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          className="secondary-button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
