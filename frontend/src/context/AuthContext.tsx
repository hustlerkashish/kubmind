import { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthResponse } from '@/types';
import { apiClient } from '@/services/apiClient';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authData: AuthResponse & { refreshToken?: string }) => void;
  updateUser: (updatedUser: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('kubemind_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('kubemind_access_token')
  );

  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem('kubemind_refresh_token')
  );

  const [isLoading] = useState<boolean>(false);

  const login = (data: AuthResponse & { refreshToken?: string }) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
      localStorage.setItem('kubemind_refresh_token', data.refreshToken);
    }
    localStorage.setItem('kubemind_user', JSON.stringify(data.user));
    localStorage.setItem('kubemind_access_token', data.accessToken);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('kubemind_user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await apiClient.post('/auth/logout');
      }
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('kubemind_user');
      localStorage.removeItem('kubemind_access_token');
      localStorage.removeItem('kubemind_refresh_token');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
