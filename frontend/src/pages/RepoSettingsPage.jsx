import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { authApi, repoApi } from '../api/services';
import { FormField } from '../components/FormField';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

export const RepoSettingsPage = () => {
  const { repo, refreshRepo } = useOutletContext();
  const { user } = useAuth();
  const { pushToast } = useApp();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [role, setRole] = useState('collaborator');

  const isOwner = useMemo(() => {
    return String(repo.owner?._id || repo.owner) === String(user?.id || user?._id);
  }, [repo, user]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
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

  const addCollaborator = async (userId) => {
    if (!userId) {
      pushToast('Invalid user selected');
      return;
    }

    try {
      await repoApi.addCollaborator(repo._id, {
        userId,
        role,
      });

      pushToast('Collaborator added');
      await refreshRepo();

      setQuery('');
      setResults([]);
    } catch (err) {
      pushToast(err.message);
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
                    onClick={() => addCollaborator(targetUserId)}
                    disabled={!targetUserId}
                  >
                    Add
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
    </div>
  );
};