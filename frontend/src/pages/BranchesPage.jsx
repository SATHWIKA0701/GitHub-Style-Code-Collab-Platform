import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FormField } from '../components/FormField';
import { gitApi } from '../api/services';
import { useApp } from '../contexts/AppContext';

export const BranchesPage = () => {
  const { repo } = useOutletContext();
  const { pushToast } = useApp();
  const [branches, setBranches] = useState({ all: [], current: '' });
  const [branchName, setBranchName] = useState('');
  const [mergeBranch, setMergeBranch] = useState('');

  const load = () => gitApi.branches(repo.name).then(setBranches);
  useEffect(() => { load(); }, [repo.name]);

  return (
    <div className="stack-lg">
      <div className="split-grid two">
        <div className="card list-stack">
          <div className="section-header"><h3>Branches</h3><span className="pill">current: {branches.current}</span></div>
          {branches.all?.map((branch) => (
            <div className="list-row compact" key={branch}>
              <strong>{branch}</strong>
              <button className="ghost-button" onClick={async () => { await gitApi.switchBranch({ repoName: repo.name, branchName: branch }); pushToast(`Switched to ${branch}`); load(); }}>Checkout</button>
            </div>
          ))}
        </div>
        <div className="card stack-md">
          <FormField label="Create branch"><input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="feature/ui-refresh" /></FormField>
          <button className="primary-button" onClick={async () => { await gitApi.createBranch({ repoName: repo.name, branchName }); pushToast('Branch created'); setBranchName(''); load(); }}>Create branch</button>
          <FormField label="Merge branch into current"><input value={mergeBranch} onChange={(e) => setMergeBranch(e.target.value)} placeholder="feature/ui-refresh" /></FormField>
          <button className="secondary-button" onClick={async () => { await gitApi.mergeBranch({ repoName: repo.name, branchName: mergeBranch }); pushToast('Branch merged'); setMergeBranch(''); load(); }}>Merge</button>
        </div>
      </div>
      <CommitsHint />
    </div>
  );
};

const CommitsHint = () => <div className="card subtle">Create branches, switch context, and merge changes directly from the repository view.</div>;
