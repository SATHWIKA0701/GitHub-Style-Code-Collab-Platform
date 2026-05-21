import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { repoApi } from '../api/services';

export const ActivityPage = () => {
  const { repo } = useOutletContext();
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    repoApi.activity(repo._id).then((res) => setActivity(res.data || []));
  }, [repo._id]);

  return (
    <div className="card list-stack">
      <h3>Activity</h3>
      {activity.length > 0 ? (
        activity.map((item) => (
          <div key={item._id} className="list-row">
            <div>
              <strong>{item.eventType}</strong>
              <p>{item.message}</p>
            </div>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        ))
      ) : (
        <div className="empty-state">No activity yet.</div>
      )}
    </div>
  );
};
