//authContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const bootstrap = async () => {
  try {
    const profile = await authApi.profile();
    setUser(profile);
  } catch {
    setUser(null);
  } finally {
    setReady(true);
  }
};

  useEffect(() => { bootstrap(); }, []);

  const login = async (payload) => {
  const data = await authApi.login(payload);
  const profile = await authApi.profile();
  setUser(profile);
  return data;
};

  const register = async (payload) => authApi.register(payload);

  const logout = async () => {
  try {
    await authApi.logout();
  } finally {
    setUser(null);
  }
};

  const refreshProfile = async () => {
    const profile = await authApi.profile();
    setUser(profile);
    return profile;
  };

  const value = useMemo(() => ({ user, ready, setUser, login, register, logout, refreshProfile }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
