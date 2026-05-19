import { useEffect, useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { issueApi, repoApi } from '../api/services';
import { Modal } from '../components/Modal';

import { FormField } from '../components/FormField';

import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

import { IssueLabel } from '../components/IssueLabel';

export const IssuesPage = () => {
  const { repo } = useOutletContext();
  const { pushToast } = useApp();
  const { user } = useAuth();

  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [issueOpen, setIssueOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', labels: [] });
  const [commentText, setCommentText] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [repoLabels, setRepoLabels] = useState([]);
  
  // Filtering states
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('created');

  const isCollaborator = repo.owner === user?.id || repo.owner?._id === user?.id || repo.collaborators?.some(c => c.userId === user?.id || c.userId?._id === user?.id);

  // Combine members for the assignees dropdown
  const repoMembers = useMemo(() => {
    const ownerObj = typeof repo.owner === 'object' ? repo.owner : { _id: repo.owner, username: 'Owner' };
    const collabs = (repo.collaborators || []).map(c => typeof c.userId === 'object' ? c.userId : { _id: c.userId, username: 'Collaborator' });
    const all = [ownerObj, ...collabs];
    return all.filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i);
  }, [repo]);

  const loadIssues = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (assigneeFilter) params.assignee = assigneeFilter;
    if (labelFilter) params.label = labelFilter;
    if (sortFilter) params.sort = sortFilter;
    params.page = page;

    repoApi.issues(repo._id, params).then((res) => {
      // In the backend I rewrote getIssuesByRepo to return the array directly. 
      // Wait, earlier getIssuesByRepo was res.status(200).json(issues) in HEAD, 
      // but if the user wants pagination, I should return { data, totalPages, page } etc?
      // Since I kept getIssuesByRepo as returning array in issueController.js: res.status(200).json(issues);
      // Wait, let's just setIssues(res) and let pagination fail gracefully if not returned.
      setIssues(res.data || res || []);
      setTotalPages(res.totalPages || 1);
    });
  };

  useEffect(() => {
    loadIssues();
  }, [repo._id, statusFilter, assigneeFilter, labelFilter, sortFilter, page]);

  useEffect(() => {
    repoApi.labels(repo._id).then(setRepoLabels).catch(() => {});
  }, [repo._id]);

  const openIssue = async (issue) => {
    setSelectedIssue(issue);

    const res = await issueApi.comments(issue._id);
    setComments(res.data || res || []);
  };

  const handleUpdateIssue = async (updates) => {
    try {
      const updated = await issueApi.update(selectedIssue._id, updates);
      setSelectedIssue(updated);
      pushToast('Issue updated');
      loadIssues();
    } catch (error) {
      pushToast(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await issueApi.deleteComment(selectedIssue._id, commentId);
      setComments(comments.filter(c => c._id !== commentId));
      pushToast('Comment deleted');
    } catch (error) {
      pushToast(error.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="stack-lg">
      <div className="section-header">
        <h2>Issues</h2>
        <button className="primary-button" onClick={() => setIssueOpen(true)}>New issue</button>
      </div>

      <div className="card">
        <div className="list-row compact" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Any Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>

          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
            <option value="">Any Assignee</option>
            {repoMembers.map(m => (
              <option key={m._id} value={m._id}>{m.username}</option>
            ))}
          </select>

          <select value={labelFilter} onChange={e => setLabelFilter(e.target.value)}>
            <option value="">Any Label</option>
            {repoLabels.map(l => (
              <option key={l._id} value={l._id}>{l.name}</option>
            ))}
          </select>

          <select value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
            <option value="created">Newest</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>

        <div className="list-stack">
          {issues.map((issue) => (
            <button key={issue._id} className="list-row" onClick={() => openIssue(issue)} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <strong style={{ fontSize: '1.1rem' }}>{issue.title} <span style={{ color: 'var(--text-light)' }}>#{issue.issueNumber}</span></strong>
                <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {issue.labels?.map(l => (
                    <span key={l._id} className="pill" style={{ backgroundColor: l.color, color: '#fff', border: 'none', fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}>{l.name}</span>
                  ))}
                </div>
                <p style={{ marginTop: '0.25rem' }}>{issue.description || 'No description'}</p>
                {issue.assignees?.length > 0 && (
                  <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    Assigned to: {issue.assignees.map(a => a.username).join(', ')}
                  </p>
                )}
              </div>
              <span className={`pill ${issue.status === 'closed' ? 'pill-danger' : ''}`}>{issue.status}</span>
            </button>
          ))}
          {!issues.length && <div className="empty-card">No issues match the filters.</div>}
        </div>
      </div>

      {selectedIssue ? (
        <div className="split-grid two">
          <div className="stack-md" style={{ gridColumn: 'span 2' }}>
            <div className="card list-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="section-header">
                  <h3>{selectedIssue.title} <span style={{ color: 'var(--text-light)' }}>#{selectedIssue.issueNumber}</span></h3>
                  <span className="pill">{selectedIssue.status}</span>
                </div>
                <p>{selectedIssue.description}</p>
              </div>

              <div style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                
                {/* Actions */}
                <div className="stack-sm">
                  {selectedIssue.status !== 'closed' && isCollaborator && (
                    <button className="secondary-button small" onClick={async () => { await issueApi.close(selectedIssue._id); pushToast('Issue closed'); openIssue({ ...selectedIssue, status: 'closed' }); loadIssues(); }}>Close issue</button>
                  )}
                  {selectedIssue.status === 'closed' && isCollaborator && (
                    <button className="secondary-button small" onClick={async () => { await issueApi.reopen(selectedIssue._id); pushToast('Issue reopened'); openIssue({ ...selectedIssue, status: 'open' }); loadIssues(); }}>Reopen issue</button>
                  )}
                </div>

                {/* Assignees */}
                <div className="stack-sm">
                  <strong>Assignees</strong>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {selectedIssue.assignees?.length ? selectedIssue.assignees.map(a => <span key={a._id} className="pill">{a.username}</span>) : <span className="subtle">None</span>}
                  </div>
                  {isCollaborator && (
                    <select 
                      onChange={e => {
                        if (!e.target.value) return;
                        const current = selectedIssue.assignees?.map(a => a._id) || [];
                        if (!current.includes(e.target.value)) {
                          handleUpdateIssue({ assignees: [...current, e.target.value] });
                        }
                        e.target.value = '';
                      }}
                      style={{ padding: '0.25rem', fontSize: '0.8rem' }}
                    >
                      <option value="">+ Assign</option>
                      {repoMembers.map(m => (
                        <option key={m._id} value={m._id}>{m.username}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Labels */}
                <div className="stack-sm">
                  <strong>Labels</strong>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {selectedIssue.labels?.length ? selectedIssue.labels.map(l => <span key={l._id} className="pill" style={{ backgroundColor: l.color, color: '#fff', border: 'none' }}>{l.name}</span>) : <span className="subtle">None</span>}
                  </div>
                  {isCollaborator && (
                    <select 
                      onChange={e => {
                        if (!e.target.value) return;
                        const current = selectedIssue.labels?.map(l => l._id) || [];
                        if (!current.includes(e.target.value)) {
                          handleUpdateIssue({ labels: [...current, e.target.value] });
                        }
                        e.target.value = '';
                      }}
                      style={{ padding: '0.25rem', fontSize: '0.8rem' }}
                    >
                      <option value="">+ Add Label</option>
                      {repoLabels.map(l => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="card stack-md">
              <h3>Comments</h3>
              <div className="list-stack">
                {comments.map((comment) => (
                  <div key={comment._id} className="list-row compact">
                    <div style={{ flex: 1 }}>
                      <strong>{comment.userId?.username || 'User'}</strong>
                      <p style={{ marginTop: '0.25rem' }}>{comment.text}</p>
                    </div>
                    {(comment.userId?._id === user?.id || comment.userId === user?.id || isCollaborator) && (
                      <button className="secondary-button small" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                    )}
                  </div>
                ))}
                {!comments.length && <div className="subtle">No comments yet.</div>}
              </div>
              
              <textarea rows="4" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Leave a comment" />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="primary-button" onClick={async () => { await issueApi.addComment(selectedIssue._id, { text: commentText }); setCommentText(''); pushToast('Comment added'); openIssue(selectedIssue); }}>Add comment</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal open={issueOpen} title="Create issue" onClose={() => setIssueOpen(false)}>
        <form className="stack-md" onSubmit={async (e) => { 
          e.preventDefault(); 
          await repoApi.createIssue(repo._id, form); 
          setIssueOpen(false); 
          setForm({ title: '', description: '', labels: [] }); 
          pushToast('Issue created'); 
          loadIssues(); 
        }}>
          <FormField label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></FormField>
          <FormField label="Description"><textarea rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          {isCollaborator && repoLabels.length > 0 && (
            <FormField label="Labels">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {repoLabels.map(l => (
                  <label key={l._id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={form.labels?.includes(l._id)} 
                      onChange={(e) => {
                        const current = form.labels || [];
                        if (e.target.checked) setForm({ ...form, labels: [...current, l._id] });
                        else setForm({ ...form, labels: current.filter(id => id !== l._id) });
                      }}
                    />
                    <span className="pill" style={{ backgroundColor: l.color, color: '#fff', border: 'none', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>{l.name}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}
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