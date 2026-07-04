'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface AuthUser {
  token: string;
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
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [unregisterPush]);

  return (
    <AuthContext.Provider value={{ user, login, logout: logoutWithCleanup, updateUser, openModal, closeModal, modalOpen, modalInitialView }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
