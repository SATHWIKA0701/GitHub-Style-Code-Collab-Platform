import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { notificationApi } from '../api/services';

import { useApp } from '../contexts/AppContext';

export const NotificationsPage = () => {
  const navigate = useNavigate();

  const {
    notifications,
    setNotifications,
    setUnreadNotifications,
  } = useApp();

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const load = async () => {
    try {
      const res =
        await notificationApi.list(
          page
        );

      setNotifications(
        res.data || []
      );

      setTotalPages(
        res.totalPages || 1
      );
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const openNotification =
    async (item) => {
      try {
        if (!item.isRead) {
          await notificationApi.read(
            item._id
          );
        }

        setUnreadNotifications(
          (prev) =>
            Math.max(0, prev - 1)
        );

        if (
          item.resourceType ===
            'issue' &&
          item.repoId
        ) {
          navigate(
            `/repos/${item.repoId}/issues`
          );

          return;
        }

        if (
          item.resourceType ===
            'pr' &&
          item.repoId
        ) {
          navigate(
            `/repos/${item.repoId}/pull-requests`
          );

          return;
        }

        if (
          item.resourceType ===
            'repository' &&
          item.repoId
        ) {
          navigate(
            `/repos/${item.repoId}`
          );

          return;
        }
      } catch (err) {
        console.error(err);
      }
    };

  const markAllRead =
    async () => {
      try {
        await notificationApi.readAll();

        setUnreadNotifications(0);

        load();
      } catch (err) {
        console.error(err);
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
        <button
          key={item._id}
          className="list-row"
          onClick={() =>
            openNotification(item)
          }
          style={{
            opacity:
              item.isRead
                ? 0.7
                : 1,
          }}
        >
          <div>
            <strong>
              {item.message}
            </strong>

            <p>{item.type}</p>
          </div>

          {!item.isRead && (
            <span className="pill">
              unread
            </span>
          )}
        </button>
      ))}

      {!notifications.length && (
        <div className="empty-card">
          No notifications.
        </div>
      )}

      <div className="button-row">
        <button
          className="secondary-button"
          disabled={page <= 1}
          onClick={() =>
            setPage((p) => p - 1)
          }
        >
          Previous
        </button>

        <span>
          Page {page} of{' '}
          {totalPages}
        </span>

        <button
          className="secondary-button"
          disabled={
            page >= totalPages
          }
          onClick={() =>
            setPage((p) => p + 1)
          }
        >
          Next
        </button>
      </div>
    </div>
  );
};