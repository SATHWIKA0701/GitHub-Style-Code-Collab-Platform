import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useRef,
} from "react";

import { io } from "socket.io-client";

import { useAuth } from "../contexts/AuthContext";

import { useApp } from "../contexts/AppContext";

import { ToastStack } from "../components/ToastStack";

export const AppLayout = () => {
  const { user, logout } = useAuth();

  const {
    unreadNotifications,

    incrementUnreadCount,

    prependNotification,

    pushToast,
  } = useApp();

  const navigate = useNavigate();

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_API_URL ||
        "http://localhost:3000",
      {
        withCredentials: true,
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );
    });

    socket.on("disconnect", () => {
      console.log(
        "Socket disconnected"
      );
    });

    socket.on(
      "notification",
      (payload) => {
        console.log(
          "Notification:",
          payload
        );

        pushToast(
          payload?.message ||
            "New notification"
        );

        incrementUnreadCount();

        if (payload?.notification) {
          prependNotification(
            payload.notification
          );
        }
      }
    );

    socket.on(
      "repo_event",
      (payload) => {
        console.log(
          "Repo event:",
          payload
        );
      }
    );

    return () => {
      socket.off("notification");

      socket.off("repo_event");

      socket.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    await logout();

    navigate("/login");
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Notifications

                {unreadNotifications >
                  0 && (
                  <span
                    style={{
                      minWidth:
                        "20px",

                      height: "20px",

                      borderRadius:
                        "999px",

                      background:
                        "#ef4444",

                      color: "white",

                      fontSize:
                        "12px",

                      display:
                        "inline-flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      padding:
                        "0 6px",

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
              onClick={
                handleLogout
              }
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