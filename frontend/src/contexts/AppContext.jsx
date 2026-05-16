import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { notificationApi } from "../api/services";

const AppContext = createContext(null);

export const AppProvider = ({
  children,
}) => {
  const [toasts, setToasts] = useState([]);

  const [currentRepo, setCurrentRepo] =
    useState(null);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const [notifications, setNotifications] =
    useState([]);

  const pushToast = (
    message,
    type = "success"
  ) => {
    const id =
      Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.filter(
          (toast) => toast.id !== id
        )
      );
    }, 3000);
  };

  const refreshUnreadNotifications =
    async () => {
      try {
        const data =
          await notificationApi.count();

        setUnreadNotifications(
          data.unread || 0
        );
      } catch {
        setUnreadNotifications(0);
      }
    };

  const prependNotification = (
    notification
  ) => {
    if (!notification) return;

    setNotifications((prev) => [
      notification,
      ...prev,
    ]);
  };

  const incrementUnreadCount = () => {
    setUnreadNotifications(
      (prev) => prev + 1
    );
  };

  const decrementUnreadCount = () => {
    setUnreadNotifications((prev) =>
      Math.max(0, prev - 1)
    );
  };

  useEffect(() => {
    refreshUnreadNotifications();
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      pushToast,

      currentRepo,
      setCurrentRepo,

      unreadNotifications,
      setUnreadNotifications,

      refreshUnreadNotifications,

      notifications,
      setNotifications,

      prependNotification,

      incrementUnreadCount,
      decrementUnreadCount,
    }),
    [
      toasts,
      currentRepo,
      unreadNotifications,
      notifications,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () =>
  useContext(AppContext);