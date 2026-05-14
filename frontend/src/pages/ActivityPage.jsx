import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { gitApi, repoApi } from '../api/services';

export const ActivityPage = () => {
  const { repo } = useOutletContext();
  const [activity, setActivity] = useState([]);
  const [graph, setGraph] = useState('');
  useEffect(() => {
    repoApi.activity(repo._id).then((data) => setActivity(data.activities || []));
    gitApi.graph(repo.name).then((data) => setGraph(data.graph || ''));
  }, [repo._id, repo.name]);
  return (
    <div className="split-grid two">
      <div className="card list-stack">
        <h3>Activity</h3>
        {activity.map((item) => <div key={item._id} className="list-row"><div><strong>{item.eventType}</strong><p>{item.message}</p></div><span>{new Date(item.createdAt).toLocaleString()}</span></div>)}
      </div>
      <div className="card stack-md">
        <h3>Commit graph</h3>
        <pre className="diff-block">{graph || 'No graph data yet.'}</pre>
      </div>
    </div>
  );
};
