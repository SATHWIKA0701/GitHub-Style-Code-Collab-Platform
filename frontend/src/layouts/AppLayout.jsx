import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useSocket } from '../contexts/SocketContext';

import { ToastStack } from '../components/ToastStack';

export const AppLayout = () => {
  const { user, logout } = useAuth();

  const {
    unreadNotifications,
    incrementUnreadCount,
    prependNotification,
    pushToast,
  } = useApp();

  const { socket } = useSocket();

  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const onNotification = (payload) => {
      pushToast(
        payload?.message ||
          'New notification'
      );

      incrementUnreadCount();

      if (payload?.notification) {
        prependNotification(
          payload.notification
        );
      }
    };

    const onRepoEvent = (payload) => {
      console.log(
        'Repo event:',
        payload
      );
    };

    socket.on(
      'notification',
      onNotification
    );

    socket.on(
      'repo_event',
      onRepoEvent
    );

    return () => {
      socket.off(
        'notification',
        onNotification
      );

      socket.off(
        'repo_event',
        onRepoEvent
      );
    };
  }, [socket]);

  const handleLogout = async () => {
    await logout();

    navigate('/login');
  };

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-inner">
          <Link
            to="/dashboard"
            className="brand"
          >
            code-collab-platform
          </Link>

          <nav className="top-nav">
            <NavLink to="/dashboard">
              Dashboard
            </NavLink>

            <NavLink to="/repositories">
              Repositories
            </NavLink>

            <NavLink to="/notifications">
              <span
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: '0.5rem',
                }}
              >
                Notifications

                {unreadNotifications >
                  0 && (
                  <span
                    style={{
                      minWidth:
                        '20px',

                      height:
                        '20px',

                      borderRadius:
                        '999px',

                      background:
                        '#ef4444',

                      color:
                        'white',

                      fontSize:
                        '12px',

                      display:
                        'inline-flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'center',

                      padding:
                        '0 6px',

                      fontWeight: 700,
                    }}
                  >
                    {
                      unreadNotifications
                    }
                  </span>
                )}
              </span>
            </NavLink>

            <NavLink to="/profile">
              Profile
            </NavLink>

            <NavLink to="/settings">
              Settings
            </NavLink>
          </nav>

          <div className="top-user">
            <span>
              {user?.username}
            </span>

            <button
              className="ghost-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <ToastStack />
    </div>
  );
};