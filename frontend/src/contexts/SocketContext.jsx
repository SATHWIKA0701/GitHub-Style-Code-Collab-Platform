//SocketContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, ready } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!ready || !user) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const nextSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    nextSocket.on('connect', () => {
      console.log('Socket connected:', nextSocket.id);
    });

    nextSocket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error.message);
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [ready, user]);

  const value = useMemo(() => ({ socket }), [socket]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);