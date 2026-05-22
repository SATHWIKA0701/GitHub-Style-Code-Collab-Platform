import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { FormField } from '../components/FormField';
import { gitApi } from '../api/services';
import { useApp } from '../contexts/AppContext';

export const BranchesPage = () => {
  const { repo } = useOutletContext();
  const { pushToast } = useApp();

  const [branches, setBranches] = useState({
    all: [],
    current: '',
  });

  const [branchName, setBranchName] = useState('');
  const [mergeBranch, setMergeBranch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const data = await gitApi.branches(repo.name);
      setBranches(data || { all: [], current: '' });
    } catch {
      setBranches({ all: [], current: '' });
    }
  };

  useEffect(() => {
    load();
  }, [repo.name]);

  const createBranch = async () => {
    const selected = branchName.trim();

    if (!selected) {
      pushToast('Branch name is required');
      return;
    }

    try {
      setLoading(true);

      await gitApi.createBranch({
        repoName: repo.name,
        branchName: selected,
      });

      pushToast('Branch created');
      setBranchName('');
      await load();
    } catch (err) {
      pushToast(err.response?.data?.message || err.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  const checkoutBranch = async (branch) => {
    try {
      setLoading(true);

      await gitApi.switchBranch({
        repoName: repo.name,
        branchName: branch,
      });

      pushToast(`Switched to ${branch}`);
      await load();
    } catch (err) {
      pushToast(err.response?.data?.message || err.message || 'Failed to switch branch');
    } finally {
      setLoading(false);
    }
  };

  const mergeSelectedBranch = async () => {
    const selected = mergeBranch.trim();
    const current = branches.current || 'main';

    if (!selected) {
      pushToast('Select a branch to merge');
      return;
    }

    if (selected === current) {
      pushToast('Cannot merge current branch into itself');
      return;
    }

    try {
      setLoading(true);

      await gitApi.mergeBranch({
        repoName: repo.name,
        branchName: selected,
        sourceBranch: selected,
        targetBranch: current,
      });

      pushToast(`Merged ${selected} into ${current}`);
      setMergeBranch('');
      await load();
    } catch (err) {
      pushToast(err.response?.data?.message || err.message || 'Failed to merge branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack-lg">
      <div className="split-grid two">
        <div className="card list-stack">
          <div className="section-header">
            <h3>Branches</h3>
            <span className="pill">current: {branches.current || 'main'}</span>
          </div>

          {branches.all?.map((branch) => (
            <div className="list-row compact" key={branch}>
              <strong>{branch}</strong>

              <button
                className="ghost-button small"
                disabled={loading || branch === branches.current}
                onClick={() => checkoutBranch(branch)}
              >
                {branch === branches.current ? 'Current' : 'Checkout'}
              </button>
            </div>
          ))}

          {!branches.all?.length && (
            <div className="empty-card">No branches found.</div>
          )}
        </div>

        <div className="card stack-md branch-action-card">
          <FormField label="Create branch">
            <input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="feature/ui-refresh"
            />
          </FormField>

          <div className="button-row">
            <button
              type="button"
              className="primary-button branch-action-button"
              disabled={loading}
              onClick={createBranch}
            >
              Create branch
            </button>
          </div>

          <FormField label="Merge branch into current">
            <select
              value={mergeBranch}
              onChange={(e) => setMergeBranch(e.target.value)}
            >
              <option value="">Select branch to merge</option>

              {branches.all
                ?.filter((branch) => branch !== branches.current)
                .map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
            </select>
          </FormField>

          <div className="button-row">
            <button
              type="button"
              className="secondary-button branch-action-button"
              disabled={loading || !mergeBranch}
              onClick={mergeSelectedBranch}
            >
              Merge
            </button>
          </div>
        </div>
      </div>

      <CommitsHint />
    </div>
  );
};

const CommitsHint = () => (
  <div className="card subtle">
    Create branches, switch context, and merge changes directly from the repository view.
  </div>
);