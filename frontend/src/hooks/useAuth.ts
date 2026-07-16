import { useState } from 'react';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('kubemind_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kubemind_token'));

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('kubemind_user', JSON.stringify(userData));
    localStorage.setItem('kubemind_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kubemind_user');
    localStorage.removeItem('kubemind_token');
    window.location.href = '/login';
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
