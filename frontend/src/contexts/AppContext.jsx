import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [currentRepo, setCurrentRepo] = useState(null);

  const pushToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3000);
  };

  const value = useMemo(() => ({ toasts, pushToast, currentRepo, setCurrentRepo }), [toasts, currentRepo]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
