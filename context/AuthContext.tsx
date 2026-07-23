'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { logout as apiLogout } from '@/lib/api';

interface AuthUser {
  token: string;
  refreshToken: string;
  expiresAt: number; // epoch ms — when the access token expires
  userId: number;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  openModal: (view?: 'login' | 'register') => void;
  closeModal: () => void;
  modalOpen: boolean;
  modalInitialView: 'login' | 'register';
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  openModal: () => {},
  closeModal: () => {},
  modalOpen: false,
  modalInitialView: 'login',
});

const STORAGE_KEY = 'user_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialView, setModalInitialView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  // lib/api.ts silently refreshes the access token behind the scenes on a
  // 401. When it succeeds it writes the new token/refreshToken to
  // localStorage and fires 'auth:updated' so this context's React state
  // (and every component reading user.token) picks up the fresh token. If
  // the refresh token itself is invalid/expired, it fires 'auth:logout' so
  // we treat the session as over instead of silently failing forever.
  useEffect(() => {
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<AuthUser>).detail;
      if (detail) setUser(detail);
    };
    const onExpired = () => setUser(null);

    window.addEventListener('auth:updated', onUpdated);
    window.addEventListener('auth:logout', onExpired);
    return () => {
      window.removeEventListener('auth:updated', onUpdated);
      window.removeEventListener('auth:logout', onExpired);
    };
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const openModal = useCallback((view: 'login' | 'register' = 'login') => {
    setModalInitialView(view);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const { unregister: unregisterPush } = usePushNotifications(user?.token ?? null);

  const logoutWithCleanup = useCallback(() => {
    unregisterPush();
    if (user?.refreshToken) apiLogout(user.refreshToken); // best-effort server-side revoke
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [unregisterPush, user?.refreshToken]);

  return (
    <AuthContext.Provider value={{ user, login, logout: logoutWithCleanup, updateUser, openModal, closeModal, modalOpen, modalInitialView }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
