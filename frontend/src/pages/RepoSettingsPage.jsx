import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

import { authApi, repoApi, invitationApi } from '../api/services';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export const RepoSettingsPage = () => {
  const navigate = useNavigate();

  const { repo, refreshRepo } = useOutletContext();
  const { user } = useAuth();
  const { pushToast } = useApp();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [role, setRole] = useState('collaborator');

  const [labels, setLabels] = useState([]);
  const [labelForm, setLabelForm] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadLabels = useCallback(
    () => repoApi.labels(repo._id).then(setLabels).catch(() => {}),
    [repo._id]
  );

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  const isOwner = useMemo(() => {
    return String(repo.owner?._id || repo.owner) === String(user?.id || user?._id);
  }, [repo, user]);

  useEffect(() => {
    if (!query.trim()) {
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const timer = setTimeout(() => {
      authApi
        .searchUsers(query)
        .then((users) => setResults(users || []))
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleCreateLabel = async (e) => {
    e.preventDefault();

    try {
      await repoApi.createLabel(repo._id, labelForm);
      pushToast('Label created');
      setLabelForm({
        name: '',
        color: '#3b82f6',
        description: '',
      });
      loadLabels();
    } catch (error) {
      pushToast(error.message || 'Error creating label');
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await repoApi.deleteLabel(repo._id, labelId);
      pushToast('Label deleted');
      loadLabels();
    } catch (error) {
      pushToast(error.message || 'Error deleting label');
    }
  };

  const sendInvitation = async (userId) => {
    if (!userId) {
      pushToast('Invalid user selected');
      return;
    }

    try {
      await invitationApi.send(repo._id, {
        receiverId: userId,
        role,
      });

      pushToast('Invitation sent successfully');

      setQuery('');
      setResults([]);
    } catch (err) {
      pushToast(err.message || 'Failed to send invitation');
    }
  };

  const removeCollaborator = async (userId) => {
    if (!userId) {
      pushToast('Invalid collaborator');
      return;
    }

    try {
      await repoApi.removeCollaborator(repo._id, userId);
      pushToast('Collaborator removed');
      await refreshRepo();
    } catch (err) {
      pushToast(err.message);
    }
  };

  const updateRole = async (userId, nextRole) => {
    if (!userId) {
      pushToast('Invalid collaborator');
      return;
    }

    try {
      await repoApi.updateCollaboratorRole(repo._id, userId, {
        role: nextRole,
      });

      pushToast('Role updated');
      await refreshRepo();
    } catch (err) {
      pushToast(err.message);
    }
  };

  const confirmDeleteRepo = async () => {
    if (deleteName.trim() !== repo.name) {
      pushToast('Repository name does not match');
      return;
    }

    try {
      setDeleteLoading(true);

      await repoApi.delete(repo._id);

      pushToast('Repository deleted successfully');

      navigate('/repositories');
    } catch (err) {
      pushToast(err.message || 'Failed to delete repository');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="split-grid two">
      <div className="card stack-md">
        <h3>Collaborators</h3>

        <div className="list-stack">
          {(repo.collaborators || []).map((person) => {
            const collaboratorId = person.userId?._id || person.userId;
            const collaboratorName = person.userId?.username || person.userId;

            const isRepoOwner =
              String(collaboratorId) === String(repo.owner?._id || repo.owner);

            return (
              <div key={collaboratorId} className="list-row compact">
                <div>
                  <strong>{collaboratorName}</strong>
                  {isRepoOwner && <p>Repository Owner</p>}
                </div>

                <div className="button-row">
                  {isOwner && !isRepoOwner ? (
                    <>
                      <select
                        value={person.role}
                        onChange={(e) =>
                          updateRole(collaboratorId, e.target.value)
                        }
                      >
                        <option value="collaborator">Collaborator</option>
                        <option value="viewer">Viewer</option>
                      </select>

                      <button
                        className="ghost-button"
                        onClick={() => removeCollaborator(collaboratorId)}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="pill">{person.role}</span>
                  )}
                </div>
              </div>
            );
          })}

          {!repo.collaborators?.length && (
            <div className="empty-card">No collaborators yet.</div>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="card stack-md">
          <h3>Invite member</h3>

          <FormField label="Find user by username or email">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="octocat@example.com"
            />
          </FormField>

          <FormField label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="collaborator">Collaborator</option>
              <option value="viewer">Viewer</option>
            </select>
          </FormField>

          <div className="list-stack">
            {results.map((searchUser) => {
              const targetUserId = searchUser.id || searchUser._id;

              return (
                <div key={targetUserId} className="list-row compact">
                  <div>
                    <strong>{searchUser.username}</strong>
                    <p>{searchUser.email}</p>
                  </div>

                  <button
                    className="primary-button small"
                    onClick={() => sendInvitation(targetUserId)}
                    disabled={!targetUserId}
                  >
                    Send Invite
                  </button>
                </div>
              );
            })}

            {query.trim() && !results.length && (
              <div className="empty-card">No users found.</div>
            )}
          </div>
        </div>
      )}

      <div className="card stack-md">
        <h3>Labels</h3>

        <form
          onSubmit={handleCreateLabel}
          className="list-row compact"
          style={{
            alignItems: 'flex-end',
          }}
        >
          <FormField label="Name">
            <input
              value={labelForm.name}
              onChange={(e) =>
                setLabelForm({
                  ...labelForm,
                  name: e.target.value,
                })
              }
              required
              placeholder="bug"
            />
          </FormField>

          <FormField label="Color">
            <input
              type="color"
              value={labelForm.color}
              onChange={(e) =>
                setLabelForm({
                  ...labelForm,
                  color: e.target.value,
                })
              }
              required
              style={{
                width: '50px',
                padding: 0,
              }}
            />
          </FormField>

          <FormField label="Description">
            <input
              value={labelForm.description}
              onChange={(e) =>
                setLabelForm({
                  ...labelForm,
                  description: e.target.value,
                })
              }
              placeholder="Something isn't working"
            />
          </FormField>

          <button
            type="submit"
            className="primary-button small"
          >
            Create
          </button>
        </form>

        <div className="list-stack">
          {labels.map((label) => (
            <div key={label._id} className="list-row compact">
              <div>
                <span
                  className="pill"
                  style={{
                    backgroundColor: label.color,
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {label.name}
                </span>

                <p>{label.description}</p>
              </div>

              <button
                className="secondary-button small"
                onClick={() => handleDeleteLabel(label._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="card stack-md">
          <h3>Danger Zone</h3>

          <div
            className="list-row compact"
            style={{
              border: '1px solid var(--border)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <div>
              <strong
                style={{
                  color: 'var(--danger, #d73a49)',
                }}
              >
                Archive repository
              </strong>

              <p>Mark this repository as archived and read-only.</p>
            </div>

            <button
              className="secondary-button"
              style={{
                color: 'var(--danger, #d73a49)',
                borderColor: 'var(--danger, #d73a49)',
              }}
              onClick={async () => {
                await repoApi.archive(repo._id);
                pushToast(
                  repo.isArchived
                    ? 'Repository unarchived'
                    : 'Repository archived'
                );
                refreshRepo();
              }}
            >
              {repo.isArchived ? 'Unarchive' : 'Archive'}
            </button>
          </div>

          <div
            className="list-row compact"
            style={{
              border: '1px solid var(--danger, #d73a49)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <div>
              <strong
                style={{
                  color: 'var(--danger, #d73a49)',
                }}
              >
                Delete repository
              </strong>

              <p>
                Permanently delete this repository and all related issues, PRs,
                notifications, and activity.
              </p>
            </div>

            <button
              className="secondary-button"
              style={{
                color: 'var(--danger, #d73a49)',
                borderColor: 'var(--danger, #d73a49)',
              }}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <Modal
        open={deleteOpen}
        title="Delete repository"
        onClose={() => {
          setDeleteOpen(false);
          setDeleteName('');
        }}
      >
        <div className="stack-md">
          <p>
            This action cannot be undone. To confirm, type{' '}
            <strong>{repo.name}</strong> below.
          </p>

          <input
            value={deleteName}
            onChange={(e) => setDeleteName(e.target.value)}
            placeholder={repo.name}
          />

          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteName('');
              }}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              disabled={deleteLoading || deleteName.trim() !== repo.name}
              onClick={confirmDeleteRepo}
              style={{
                background: 'var(--danger, #d73a49)',
              }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete repository'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};