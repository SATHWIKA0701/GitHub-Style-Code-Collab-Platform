import { useEffect, useState } from 'react';
import { notificationApi } from '../api/services';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const load = () => notificationApi.list().then((data) => setNotifications(data.notifications || []));
  useEffect(() => { load(); }, []);
  return (
    <div className="card list-stack">
      <div className="section-header"><h1>Notifications</h1></div>
      {notifications.map((item) => (
        <div key={item._id} className="list-row">
          <div><strong>{item.message}</strong><p>{item.type}</p></div>
          <button className="ghost-button" onClick={async () => { await notificationApi.read(item._id); load(); }}>Mark read</button>
        </div>
      ))}
      {!notifications.length && <div className="empty-card">No unread notifications.</div>}
    </div>
  );
};
