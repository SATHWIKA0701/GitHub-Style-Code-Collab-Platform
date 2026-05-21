import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { invitationApi, notificationApi } from '../api/services';
import { useApp } from '../contexts/AppContext';

export const NotificationsPage = () => {
  const navigate = useNavigate();

  const {
    notifications,
    setNotifications,
    setUnreadNotifications,
    pushToast,
  } = useApp();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async () => {
    try {
      const res = await notificationApi.list(page);

      setNotifications(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const markNotificationRead = async (item) => {
    if (!item.isRead) {
      await notificationApi.read(item._id);

      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    }
  };

  const acceptInvitation = async (item) => {
    try {
      await invitationApi.accept(item.resourceId);
      await markNotificationRead(item);

      pushToast('Invitation accepted. Repository added to your list.');
      await load();

      if (item.repoId) {
        navigate(`/repos/${item.repoId}`);
      }
    } catch (err) {
      pushToast(err.message || 'Failed to accept invitation');
    }
  };

  const declineInvitation = async (item) => {
    try {
      await invitationApi.decline(item.resourceId);
      await markNotificationRead(item);

      pushToast('Invitation declined');
      await load();
    } catch (err) {
      pushToast(err.message || 'Failed to decline invitation');
    }
  };

  const openNotification = async (item) => {
    try {
      if (item.type === 'repo_invitation') {
        return;
      }

      await markNotificationRead(item);

      if (item.resourceType === 'issue' && item.repoId) {
        navigate(`/repos/${item.repoId}/issues`);
        return;
      }

      if (item.resourceType === 'pr' && item.repoId) {
        navigate(`/repos/${item.repoId}/pulls`);
        return;
      }

      if (item.resourceType === 'repository' && item.repoId) {
        navigate(`/repos/${item.repoId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.readAll();

      setUnreadNotifications(0);

      await load();
    } catch (err) {
      pushToast(err.message || 'Failed to mark all read');
    }
  };

  return (
    <div className="card list-stack">
      <div className="section-header">
        <h1>Notifications</h1>

        <button
          className="secondary-button"
          onClick={markAllRead}
        >
          Mark all read
        </button>
      </div>

      {notifications.map((item) => (
        <div
          key={item._id}
          className="list-row"
          onClick={() => openNotification(item)}
          style={{
            opacity: item.isRead ? 0.7 : 1,
            cursor: item.type === 'repo_invitation' ? 'default' : 'pointer',
          }}
        >
          <div>
            <strong>{item.message}</strong>
            <p>{item.type}</p>

            {item.type === 'repo_invitation' && !item.isRead && (
              <div
                className="button-row"
                style={{
                  marginTop: '0.5rem',
                }}
              >
                <button
                  className="primary-button small"
                  onClick={(e) => {
                    e.stopPropagation();
                    acceptInvitation(item);
                  }}
                >
                  Accept
                </button>

                <button
                  className="secondary-button small"
                  onClick={(e) => {
                    e.stopPropagation();
                    declineInvitation(item);
                  }}
                >
                  Decline
                </button>
              </div>
            )}
          </div>

          {!item.isRead && (
            <span className="pill">
              unread
            </span>
          )}
        </div>
      ))}

      {!notifications.length && (
        <div className="empty-card">
          No notifications.
        </div>
      )}

    </div>
  );
};