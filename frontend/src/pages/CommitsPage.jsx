import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { gitApi } from '../api/services';

export const CommitsPage = () => {
  const { repo } = useOutletContext();
  const [commits, setCommits] = useState([]);
  useEffect(() => {
    gitApi.commits(repo.name).then((res) => setCommits(res.data || [])).catch(() => setCommits([]));
  }, [repo.name]);
  return (
    <div className="card list-stack">
      <div className="section-header"><h3>Commit history</h3></div>
      {commits.map((commit) => (
        <div className="list-row" key={commit.hash}>
          <div><strong>{commit.message}</strong><p>{commit.author_name}</p></div>
          <span>{commit.date}</span>
        </div>
      ))}
      {!commits.length && <div className="empty-card">No commits yet.</div>}
    </div>
  );
};
