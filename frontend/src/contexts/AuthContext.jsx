import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const bootstrap = async () => {
    const token = localStorage.getItem('ccp-token');
    if (!token) {
      setReady(true);
      return;
    }
    try {
      const profile = await authApi.profile();
      setUser(profile);
    } catch {
      localStorage.removeItem('ccp-token');
      setUser(null);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => { bootstrap(); }, []);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    if (data.token) localStorage.setItem('ccp-token', data.token);
    const profile = await authApi.profile();
    setUser(profile);
    return data;
  };

  const register = async (payload) => authApi.register(payload);

  const logout = async () => {
    try { await authApi.logout(); } finally {
      localStorage.removeItem('ccp-token');
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
