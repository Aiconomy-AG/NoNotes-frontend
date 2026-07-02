import { createContext, useContext, useEffect, useState } from 'react';
import api from '../Api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // restore session
  useEffect(() => {
    api.get('/api/user')
        .then((res) => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    // IMPORTANT for Sanctum
    await api.get('/sanctum/csrf-cookie');

    await api.post('/api/login', { username, password });

    const res = await api.get('/api/user');
    setUser(res.data);

    return res.data;
  }

  async function register(username, password) {
    await api.get('/sanctum/csrf-cookie');

    await api.post('/api/register', { username, password });

    const res = await api.get('/api/user');
    setUser(res.data);

    return res.data;
  }

  async function logout() {
    try {
      await api.post('/api/logout');
    } finally {
      setUser(null);
    }
  }

  return (
      <AuthContext.Provider value={{ user, loading, login, register, logout }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
