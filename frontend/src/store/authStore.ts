import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('kubemind_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  return localStorage.getItem('kubemind_token');
};

export const authStore = {
  getInitialState(): AuthState {
    const token = getStoredToken();
    const user = getStoredUser();
    return {
      user: token ? user : null,
      token,
      isAuthenticated: !!token,
      setAuth: (user: User, token: string) => {
        localStorage.setItem('kubemind_user', JSON.stringify(user));
        localStorage.setItem('kubemind_token', token);
      },
      logout: () => {
        localStorage.removeItem('kubemind_user');
        localStorage.removeItem('kubemind_token');
      },
    };
  },
};
